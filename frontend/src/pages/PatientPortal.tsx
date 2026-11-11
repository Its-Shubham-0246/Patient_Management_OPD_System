import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  CreditCard,
  FolderOpen,
  Sparkles,
  CheckCircle,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const PatientPortal: React.FC = () => {
  const [allocationMode, setAllocationMode] = useState<'AUTO' | 'CHOICE'>('AUTO');
  const [selectedSpecialty, setSelectedSpecialty] = useState('General Medicine');

  return (
    <div className="space-y-6">
      {/* Patient Welcome Header */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welcome, Rahul Mehta</h1>
          <p className="text-xs text-slate-500">UHID: OPD-2611-00042 · Registered Patient</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-50">
            DPDP Consent Active (Bilingual)
          </Badge>
        </div>
      </div>

      {/* Active OPD Encounter Card (Today) */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="info" className="bg-blue-600 text-white border-transparent">
                Active OPD Visit Today
              </Badge>
              <span className="text-xs font-semibold text-slate-700">General Medicine</span>
            </div>
            <div className="text-2xl font-black text-navy-900 tracking-tight">
              YOUR TOKEN: #14
            </div>
            <p className="text-xs text-slate-600">
              Assigned Physician: <strong className="text-slate-900">Dr. Rajesh Sharma (Room 1)</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center min-w-[140px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Queue Position</span>
              <span className="text-sm font-bold text-emerald-600">Now In Consultation</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center min-w-[140px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Time</span>
              <span className="text-sm font-bold text-slate-800">~0 mins</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Book Future Appointment Wizard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-navy-900" />
            <span>Book Outpatient Consultation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Select Medical Department
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Doctor Allocation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAllocationMode('AUTO')}
                  className={`p-2.5 rounded-md border text-left text-xs transition-all ${
                    allocationMode === 'AUTO'
                      ? 'border-navy-900 bg-navy-50/50 text-navy-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-navy-900">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Auto-Allocate</span>
                  </div>
                  <span className="text-[11px] text-slate-500">System picks lowest wait doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAllocationMode('CHOICE')}
                  className={`p-2.5 rounded-md border text-left text-xs transition-all ${
                    allocationMode === 'CHOICE'
                      ? 'border-navy-900 bg-navy-50/50 text-navy-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div className="font-bold text-slate-800">Choose Doctor</div>
                  <span className="text-[11px] text-slate-500">Select specific specialist</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="3. Pick Date" type="date" defaultValue="2026-11-12" />
            <Input label="4. Preferred Slot" type="time" defaultValue="10:15" />
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full sm:w-auto text-xs px-6">
              Confirm Appointment Reservation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Clinical History & Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Digital Prescriptions</div>
              <div className="text-[11px] text-slate-500">3 Signed PDF records</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 text-xs gap-1">
            <Download className="h-3 w-3" />
            <span>View Prescriptions</span>
          </Button>
        </Card>

        <Card className="p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Lab & Diagnostic Reports</div>
              <div className="text-[11px] text-slate-500">Lipid Profile, Complete Blood Count</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 text-xs gap-1">
            <Download className="h-3 w-3" />
            <span>Download Reports</span>
          </Button>
        </Card>

        <Card className="p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Payment Receipts</div>
              <div className="text-[11px] text-slate-500">Itemized billing receipts</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 text-xs gap-1">
            <Download className="h-3 w-3" />
            <span>View Receipts</span>
          </Button>
        </Card>
      </div>
    </div>
  );
};
