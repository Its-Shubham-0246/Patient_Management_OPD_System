import React, { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  Calendar,
  Layers,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import {
  getClinicSettings,
  updateClinicSettings,
  addHoliday,
  deleteHoliday,
  ClinicSettingData
} from '../../services/clinicService';

export const ClinicSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<ClinicSettingData>({
    clinicName: '',
    clinicPrefix: 'OPD',
    tagline: '',
    registrationNumber: '',
    gstin: '',
    contact: {
      phone: '',
      emergencyPhone: '',
      email: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '' }
    },
    departments: ['General Medicine', 'Pediatrics', 'Orthopedics', 'ENT', 'Dermatology'],
    appointmentRules: {
      defaultSlotDurationMinutes: 15,
      maxBookingDaysInAdvance: 14,
      cancellationCutoffHours: 2,
      allowWalkIns: true,
      walkInReservedSlots: 3
    },
    billingRules: {
      defaultConsultationFee: 500,
      followUpValidityDays: 7,
      followUpConsultationFee: 200,
      emergencyMarkupPercent: 50,
      taxEnabled: false,
      taxRatePercent: 0
    },
    holidays: []
  });

  const [newDept, setNewDept] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [holidayRecurring, setHolidayRecurring] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getClinicSettings();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          departments: data.departments?.length ? data.departments : prev.departments,
          contact: { ...prev.contact, ...(data.contact || {}) },
          appointmentRules: { ...prev.appointmentRules, ...(data.appointmentRules || {}) },
          billingRules: { ...prev.billingRules, ...(data.billingRules || {}) },
          holidays: data.holidays || []
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load clinic settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const updated = await updateClinicSettings(settings);
      setSettings(updated);
      setSuccessMsg('Clinic settings updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update clinic settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDepartment = () => {
    if (!newDept.trim()) return;
    const trimmed = newDept.trim();
    if (!settings.departments?.includes(trimmed)) {
      setSettings((prev) => ({
        ...prev,
        departments: [...(prev.departments || []), trimmed]
      }));
      setNewDept('');
    }
  };

  const handleRemoveDepartment = (dept: string) => {
    setSettings((prev) => ({
      ...prev,
      departments: (prev.departments || []).filter((d) => d !== dept)
    }));
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayReason) return;
    try {
      setHolidayLoading(true);
      const updatedHolidays = await addHoliday({
        date: holidayDate,
        reason: holidayReason,
        isRecurringYearly: holidayRecurring
      });
      setSettings((prev) => ({ ...prev, holidays: updatedHolidays }));
      setHolidayDate('');
      setHolidayReason('');
      setHolidayRecurring(false);
      setSuccessMsg('Clinic holiday declared.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to add holiday.');
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await deleteHoliday(id);
      setSettings((prev) => ({ ...prev, holidays: res.holidays }));
    } catch (err: any) {
      setErrorMsg('Failed to remove holiday');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <span className="text-sm font-medium text-slate-500">Loading clinic configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-medical-600" />
            Clinic Administration & Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your single-clinic profile, Clinical Establishments Act metadata, OPD departments, and appointment scheduling rules.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSaveProfile}
          isLoading={saving}
          className="flex items-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {successMsg && (
        <Alert type="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert type="error" title="Error">
          {errorMsg}
        </Alert>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Clinic Identity & Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-medical-600" />
              Clinic Identity & Statutory Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Clinic Name"
              required
              value={settings.clinicName}
              onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
              placeholder="e.g. City Health Care Clinic"
            />
            <Input
              label="Clinic Short Prefix (UHID & Invoices)"
              required
              value={settings.clinicPrefix}
              onChange={(e) => setSettings({ ...settings, clinicPrefix: e.target.value.toUpperCase() })}
              placeholder="e.g. OPD"
              helperText="Prefix used in generating UHID: OPD-YYMM-XXXXX"
            />
            <Input
              label="Clinic Tagline / Subtitle"
              value={settings.tagline || ''}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              placeholder="e.g. Comprehensive Family Outpatient Care"
            />
            <Input
              label="CEA Registration Number"
              value={settings.registrationNumber || ''}
              onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
              placeholder="e.g. CEA/MH/2024/0987"
              helperText="Mandatory under Clinical Establishments Act"
            />
            <Input
              label="GSTIN (Optional)"
              value={settings.gstin || ''}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              placeholder="e.g. 27AAAAA0000A1Z5"
            />
            <Input
              label="Primary Contact Phone"
              value={settings.contact?.phone || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact: { ...settings.contact, phone: e.target.value }
                })
              }
              placeholder="e.g. +91 9876543210"
            />
            <Input
              label="Clinic Official Email"
              type="email"
              value={settings.contact?.email || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact: { ...settings.contact, email: e.target.value }
                })
              }
              placeholder="e.g. clinic@cityhealthcare.in"
            />
            <div className="md:col-span-2">
              <Input
                label="Clinic Address"
                value={settings.contact?.address?.line1 || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: {
                      ...settings.contact,
                      address: { ...settings.contact?.address, line1: e.target.value }
                    }
                  })
                }
                placeholder="Shop 12-14, Health Complex, Ring Road, City"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Departments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-medical-600" />
              OPD Departments & Specialties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {settings.departments?.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-medical-50 text-medical-800 border border-medical-200 rounded-md text-xs font-semibold"
                >
                  {dept}
                  <button
                    type="button"
                    onClick={() => handleRemoveDepartment(dept)}
                    className="hover:text-red-600 ml-1"
                    title="Remove Department"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md pt-2">
              <Input
                placeholder="Add specialty (e.g. Cardiology)"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDepartment();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddDepartment}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Scheduling & OPD Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-medical-600" />
                Appointment Booking Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Default Slot Duration (Minutes)"
                type="number"
                min="5"
                max="60"
                value={settings.appointmentRules?.defaultSlotDurationMinutes || 15}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appointmentRules: {
                      ...settings.appointmentRules,
                      defaultSlotDurationMinutes: Number(e.target.value)
                    }
                  })
                }
              />
              <Input
                label="Max Booking Window (Days in Advance)"
                type="number"
                min="1"
                max="60"
                value={settings.appointmentRules?.maxBookingDaysInAdvance || 14}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appointmentRules: {
                      ...settings.appointmentRules,
                      maxBookingDaysInAdvance: Number(e.target.value)
                    }
                  })
                }
              />
              <Input
                label="Cancellation Cutoff Window (Hours)"
                type="number"
                min="0"
                max="48"
                value={settings.appointmentRules?.cancellationCutoffHours || 2}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appointmentRules: {
                      ...settings.appointmentRules,
                      cancellationCutoffHours: Number(e.target.value)
                    }
                  })
                }
              />
              <Input
                label="Reserved Walk-In Buffer Slots Per Shift"
                type="number"
                min="0"
                max="20"
                value={settings.appointmentRules?.walkInReservedSlots || 3}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appointmentRules: {
                      ...settings.appointmentRules,
                      walkInReservedSlots: Number(e.target.value)
                    }
                  })
                }
                helperText="Slots reserved at reception for walk-in patients during busy shifts"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-medical-600" />
                Default Billing & Consultation Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Default New Consultation Fee (₹)"
                type="number"
                min="0"
                value={settings.billingRules?.defaultConsultationFee || 500}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    billingRules: {
                      ...settings.billingRules,
                      defaultConsultationFee: Number(e.target.value)
                    }
                  })
                }
              />
              <Input
                label="Follow-Up Free / Concessional Window (Days)"
                type="number"
                min="0"
                max="30"
                value={settings.billingRules?.followUpValidityDays || 7}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    billingRules: {
                      ...settings.billingRules,
                      followUpValidityDays: Number(e.target.value)
                    }
                  })
                }
                helperText="Days from initial visit where follow-up rate applies"
              />
              <Input
                label="Follow-Up Consultation Fee (₹)"
                type="number"
                min="0"
                value={settings.billingRules?.followUpConsultationFee || 200}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    billingRules: {
                      ...settings.billingRules,
                      followUpConsultationFee: Number(e.target.value)
                    }
                  })
                }
              />
              <Input
                label="Emergency / After-Hours Markup (%)"
                type="number"
                min="0"
                max="200"
                value={settings.billingRules?.emergencyMarkupPercent || 50}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    billingRules: {
                      ...settings.billingRules,
                      emergencyMarkupPercent: Number(e.target.value)
                    }
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Section 4: Clinic Holidays & Non-Working Days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-medical-600" />
            Clinic Holidays & Scheduled Closures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <Input
              label="Holiday Date"
              type="date"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Occasion / Closure Reason"
                required
                placeholder="e.g. Independence Day, Clinic Annual Maintenance"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={holidayLoading} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add Holiday
            </Button>
          </form>

          {/* Holiday Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!settings.holidays || settings.holidays.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400">
                      No upcoming clinic holidays registered.
                    </td>
                  </tr>
                ) : (
                  settings.holidays.map((h) => (
                    <tr key={h._id || h.date} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-navy-900">
                        {new Date(h.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{h.reason}</td>
                      <td className="py-2.5 px-3 text-right">
                        {h._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(h._id!)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove Holiday"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

