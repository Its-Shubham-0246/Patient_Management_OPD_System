import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Phone,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import {
  getPatients,
  createPatient,
  PatientData,
  CreatePatientPayload
} from '../../services/patientService';

export const PatientDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Patient Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [newlyCreatedUHID, setNewlyCreatedUHID] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePatientPayload>({
    fullName: '',
    phone: '',
    email: '',
    age: undefined,
    gender: 'MALE',
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    address: { line1: '', city: '', state: '', pincode: '' },
    emergencyContact: { name: '', relation: '', phone: '' }
  });

  const [allergiesInput, setAllergiesInput] = useState('');
  const [conditionsInput, setConditionsInput] = useState('');
  const [copiedUHID, setCopiedUHID] = useState(false);

  // Keyboard shortcut listener: Alt+C to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch patients on search query or filter change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, bloodGroupFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await getPatients({
        q: searchQuery,
        bloodGroup: bloodGroupFilter || undefined,
        limit: 50
      });
      setPatients(res.patients);
      setTotalCount(res.total);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRegisterLoading(true);
      setErrorMsg(null);

      const payload: CreatePatientPayload = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        allergies: allergiesInput
          .split(',')
          .map((a) => a.trim().toUpperCase())
          .filter(Boolean),
        chronicConditions: conditionsInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      };

      const created = await createPatient(payload);
      setNewlyCreatedUHID(created.uhid);
      setSuccessMsg(`Patient registered with UHID: ${created.uhid}`);
      fetchPatients();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleCopyUHID = () => {
    if (newlyCreatedUHID) {
      navigator.clipboard.writeText(newlyCreatedUHID);
      setCopiedUHID(true);
      setTimeout(() => setCopiedUHID(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      age: undefined,
      gender: 'MALE',
      bloodGroup: '',
      allergies: [],
      chronicConditions: [],
      address: { line1: '', city: '', state: '', pincode: '' },
      emergencyContact: { name: '', relation: '', phone: '' }
    });
    setAllergiesInput('');
    setConditionsInput('');
    setNewlyCreatedUHID(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <Users className="w-6 h-6 text-medical-600" />
            Patient Directory & UHID Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search patient records by name, phone, or UHID. Register new patients and issue unique clinic identifiers.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsRegisterModalOpen(true);
          }}
          className="flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Register New Patient (Alt+N)
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

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="md:col-span-3 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by UHID (OPD-...), Patient Name, or Mobile Phone... (Alt+C to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-16 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-medical-500"
          />
          <kbd className="absolute right-2.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
            Alt+C
          </kbd>
        </div>

        <div>
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500 text-slate-700"
          >
            <option value="">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      {/* Patient List Card */}
      <Card>
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex justify-between items-center">
          <CardTitle className="text-sm font-semibold text-navy-900">
            Registered Patients ({totalCount})
          </CardTitle>
          <span className="text-[11px] text-slate-400">Showing latest records</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <Spinner size="lg" />
              <span className="text-xs text-slate-500">Searching patient database...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No patient records found matching "{searchQuery}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">UHID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                    <th className="py-3 px-4">Demographics</th>
                    <th className="py-3 px-4">Medical Alerts</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((pt) => (
                    <tr
                      key={pt._id}
                      onClick={() => navigate(`/patients/${pt._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-medical-800 bg-medical-50 px-2 py-0.5 rounded border border-medical-200 text-[11px]">
                          {pt.uhid}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy-950 text-xs">{pt.fullName}</div>
                        {pt.email && <div className="text-[10px] text-slate-400">{pt.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{pt.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span>
                          {pt.age ? `${pt.age} yrs` : 'Age N/A'}, {pt.gender}
                        </span>
                        {pt.bloodGroup && (
                          <span className="ml-2 font-bold text-red-700 bg-red-50 border border-red-200 text-[10px] px-1.5 py-0.2 rounded">
                            {pt.bloodGroup}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        {pt.allergies && pt.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pt.allergies.map((allergy, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-800 bg-red-100 border border-red-300 px-1 rounded uppercase"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                {allergy}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">No allergies noted</span>
                        )}
                        {pt.chronicConditions && pt.chronicConditions.length > 0 && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            {pt.chronicConditions.slice(0, 2).join(', ')}
                            {pt.chronicConditions.length > 2 && '...'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(pt.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${pt._id}`);
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-xs text-medical-700 hover:text-medical-900"
                        >
                          View EMR <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Patient"
        maxWidth="2xl"
      >
        {newlyCreatedUHID ? (
          <div className="p-4 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-950">Registration Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                A permanent Unique Health Identification (UHID) has been issued for this patient:
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg max-w-sm mx-auto flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-emerald-950">{newlyCreatedUHID}</span>
              <Button size="sm" variant="outline" onClick={handleCopyUHID} className="flex items-center gap-1 text-xs">
                <Copy className="w-3.5 h-3.5" />
                {copiedUHID ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="flex justify-center gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                }}
              >
                Register Another Patient
              </Button>
              <Button
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  const pt = patients.find((p) => p.uhid === newlyCreatedUHID);
                  if (pt) navigate(`/patients/${pt._id}`);
                }}
              >
                Open Patient Profile
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Patient Full Name"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                label="Mobile Phone Number"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                helperText="Primary identifier for SMS token alerts"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Age (Years)"
                  type="number"
                  min="0"
                  max="125"
                  required
                  placeholder="35"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
                >
                  <option value="">Select (Optional)</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <Input
                label="Official Email (Optional)"
                type="email"
                placeholder="ramesh@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                label="City / Town"
                placeholder="e.g. Pune"
                value={formData.address?.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })
                }
              />
            </div>

            {/* Medical Alerts (High Importance) */}
            <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Critical Clinical Alerts & Allergies
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Documented Drug Allergies"
                  placeholder="e.g. PENICILLIN, SULFA, ASPIRIN"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  helperText="Separate multiple allergies with commas"
                />
                <Input
                  label="Known Chronic Conditions"
                  placeholder="e.g. Hypertension, Diabetes Type 2"
                  value={conditionsInput}
                  onChange={(e) => setConditionsInput(e.target.value)}
                  helperText="Pre-existing medical conditions"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Emergency Contact Name"
                placeholder="Relative / Kin name"
                value={formData.emergencyContact?.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })
                }
              />
              <Input
                label="Relationship"
                placeholder="e.g. Spouse / Parent"
                value={formData.emergencyContact?.relation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                  })
                }
              />
              <Input
                label="Emergency Phone"
                placeholder="Phone number"
                value={formData.emergencyContact?.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })
                }
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="consentCheck"
                defaultChecked
                required
                className="rounded border-slate-300 text-medical-600"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-700">
                Patient has provided explicit DPDP Act 2023 digital consent for outpatient care and SMS notifications.
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="ghost" onClick={() => setIsRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={registerLoading}>
                Generate UHID & Register
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

