import React, { useState } from 'react';
import {
  Stethoscope,
  Clock,
  AlertTriangle,
  Play,
  SkipForward,
  Printer,
  FileCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export const DoctorDashboard: React.FC = () => {
  const [activeToken, setActiveToken] = useState<number>(14);
  const [calledTokens, setCalledTokens] = useState<number[]>([14]);
  const [activeTab, setActiveTab] = useState<'consultation' | 'history'>('consultation');

  const queuedPatients = [
    { token: 14, name: 'Rahul Mehta', uhid: 'OPD-2611-00042', time: '10:15 AM', status: 'IN_ROOM' },
    { token: 15, name: 'Priya Singh', uhid: 'OPD-2611-00043', time: '10:30 AM', status: 'WAITING' },
    { token: 16, name: 'Amit Kumar', uhid: 'OPD-2611-00044', time: '10:45 AM', status: 'WAITING' },
    { token: 17, name: 'Suresh Patel', uhid: 'OPD-2611-00045', time: '11:00 AM', status: 'WAITING' },
  ];

  const [medications, setMedications] = useState([
    { name: 'Tab. Paracetamol 650mg', dose: '1 Tab', freq: '1-0-1', days: '3 Days', timing: 'After Food' },
    { name: 'Cap. Cefixime 200mg', dose: '1 Cap', freq: '1-0-1', days: '5 Days', timing: 'After Food' },
  ]);

  const handleCallNext = () => {
    const nextToken = activeToken + 1;
    setActiveToken(nextToken);
    setCalledTokens([...calledTokens, nextToken]);
  };

  return (
    <div className="space-y-4">
      {/* Consultation Room Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Workspace: Room 1</h1>
            <Badge variant="info">General Medicine</Badge>
          </div>
          <p className="text-xs text-slate-500">Dr. Rajesh Sharma (MCI-2012-45892) · Attending Physician</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" className="text-xs gap-1.5 bg-red-600 hover:bg-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Emergency Bump</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleCallNext} className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Call Next Patient ▶</span>
          </Button>
        </div>
      </div>

      {/* Split-Screen Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Queue Roster */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Queue Roster</span>
              <Badge variant="default" size="sm">{queuedPatients.length} Waiting</Badge>
            </div>
            <div className="divide-y divide-slate-100 mt-2">
              {queuedPatients.map((pt) => {
                const isCurrent = pt.token === activeToken;
                return (
                  <div
                    key={pt.token}
                    onClick={() => setActiveToken(pt.token)}
                    className={`p-3 rounded-md transition-all cursor-pointer flex items-center justify-between my-1 ${
                      isCurrent
                        ? 'bg-navy-900 text-white shadow-xs font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-amber-300' : 'text-navy-900'}`}>
                          Token #{pt.token}
                        </span>
                        <span className="text-xs truncate">{pt.name}</span>
                      </div>
                      <div className={`text-[11px] ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>
                        {pt.uhid} · {pt.time}
                      </div>
                    </div>
                    {isCurrent ? (
                      <Badge variant="warning" size="sm">IN ROOM</Badge>
                    ) : (
                      <Badge variant="outline" size="sm">WAITING</Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                <SkipForward className="h-3 w-3" />
                <span>Skip (3rd Call)</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column (8 cols): Clinical Consultation Form */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-5">
            {/* Active Patient Demographics Bar */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Rahul Mehta</span>
                  <Badge variant="default" size="sm">34 Y / Male</Badge>
                  <Badge variant="outline" size="sm">Blood: B+</Badge>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">UHID: OPD-2611-00042 · Ph: 9876543210</div>
              </div>

              {/* Critical Allergy Alert Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 border border-red-300 rounded text-red-800 font-bold text-xs animate-pulse">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>ALLERGY: PENICILLIN</span>
              </div>
            </div>

            {/* Vitals Summary Strip */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs my-4 bg-slate-50/70 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Blood Pressure</span>
                <span className="font-bold text-slate-800">128/82 mmHg</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pulse Rate</span>
                <span className="font-bold text-slate-800">74 bpm</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Body Temp</span>
                <span className="font-bold text-slate-800">98.6 °F</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">BMI / SpO2</span>
                <span className="font-bold text-slate-800">23.4 / 99%</span>
              </div>
            </div>

            {/* Consultation Note & Prescribing Workspace */}
            <div className="space-y-4">
              <Input
                label="Chief Complaints & Duration"
                defaultValue="Fever with chills for 3 days, dry cough, generalized malaise"
              />

              <Input
                label="Provisional Diagnosis (ICD-10)"
                defaultValue="J06.9 - Acute Upper Respiratory Infection"
              />

              {/* Medication Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Rx Medications ({medications.length})
                  </label>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    <span>Add Medicine</span>
                  </Button>
                </div>
                <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2.5">Drug Name</th>
                        <th className="p-2.5">Dose</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Timing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medications.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-semibold text-slate-800">{med.name}</td>
                          <td className="p-2.5">{med.dose}</td>
                          <td className="p-2.5">{med.freq}</td>
                          <td className="p-2.5">{med.days}</td>
                          <td className="p-2.5">{med.timing}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advice and Follow-up */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Clinical Advice"
                  defaultValue="Steam inhalation twice daily. Adequate hydration."
                />
                <Input
                  label="Follow-Up Window"
                  defaultValue="Review after 5 days or SOS"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <Button variant="outline" className="text-xs gap-1.5">
                  <Printer className="h-3.5 w-3.5" />
                  <span>Preview PDFKit Rx</span>
                </Button>
                <Button variant="primary" className="text-xs gap-1.5 bg-navy-900 hover:bg-navy-800">
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Finalize & Sign Prescription</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

