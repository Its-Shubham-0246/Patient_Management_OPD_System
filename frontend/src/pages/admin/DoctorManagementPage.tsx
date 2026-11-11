import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Edit2,
  CalendarDays,
  ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  getDoctorSchedule,
  updateDoctorSchedule,
  getDoctorLeaves,
  requestDoctorLeave,
  updateLeaveStatus,
  DoctorData,
  DoctorScheduleData,
  DoctorLeaveData
} from '../../services/clinicService';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DoctorManagementPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Doctor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    medicalCouncilRegNo: '',
    department: 'General Medicine',
    specialization: 'Internal Medicine',
    qualifications: 'MBBS, MD',
    roomNumber: 'Room 101',
    consultationFee: 500,
    averageConsultationMinutes: 15,
    maxDailyPatients: 25,
    isAutoAllocatable: true
  });

  // Schedule Modal
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<DoctorScheduleData[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaves, setLeaves] = useState<DoctorLeaveData[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [newLeaveStartDate, setNewLeaveStartDate] = useState('');
  const [newLeaveEndDate, setNewLeaveEndDate] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await getDoctors();
      setDoctors(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch doctor roster');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      setErrorMsg(null);
      const payload = {
        ...newDoctor,
        qualifications: newDoctor.qualifications
          .split(',')
          .map((q) => q.trim())
          .filter(Boolean),
        consultationFee: Number(newDoctor.consultationFee),
        averageConsultationMinutes: Number(newDoctor.averageConsultationMinutes),
        maxDailyPatients: Number(newDoctor.maxDailyPatients)
      };

      await createDoctor(payload);
      setSuccessMsg(`Doctor ${newDoctor.fullName} added successfully.`);
      setIsAddModalOpen(false);
      setNewDoctor({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        medicalCouncilRegNo: '',
        department: 'General Medicine',
        specialization: 'Internal Medicine',
        qualifications: 'MBBS, MD',
        roomNumber: 'Room 101',
        consultationFee: 500,
        averageConsultationMinutes: 15,
        maxDailyPatients: 25,
        isAutoAllocatable: true
      });
      fetchDoctors();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to create doctor record');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (doctor: DoctorData) => {
    try {
      const newStatus = doctor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateDoctor(doctor._id, { status: newStatus });
      setDoctors((prev) =>
        prev.map((d) => (d._id === doctor._id ? { ...d, status: newStatus } : d))
      );
    } catch (err: any) {
      setErrorMsg('Failed to update doctor status');
    }
  };

  const openScheduleEditor = async (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
    setIsScheduleModalOpen(true);
    try {
      setScheduleLoading(true);
      const data = await getDoctorSchedule(doctor._id);
      // Ensure days 1 to 6 exist
      const fullList: DoctorScheduleData[] = [];
      for (let day = 1; day <= 6; day++) {
        const found = data.find((s) => s.dayOfWeek === day);
        if (found) {
          fullList.push(found);
        } else {
          fullList.push({
            dayOfWeek: day,
            isActive: true,
            shifts: [
              { startTime: '09:00', endTime: '13:00', slotDurationMinutes: 15, maxPatientsPerShift: 16 }
            ]
          });
        }
      }
      setSchedules(fullList);
    } catch (err) {
      setErrorMsg('Failed to load doctor weekly schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor) return;
    try {
      setScheduleSaving(true);
      await updateDoctorSchedule(selectedDoctor._id, schedules);
      setSuccessMsg(`Schedule for ${selectedDoctor.fullName} updated.`);
      setIsScheduleModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Failed to save doctor schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  const openLeavesManager = async (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
    setIsLeaveModalOpen(true);
    try {
      setLeaveLoading(true);
      const data = await getDoctorLeaves(doctor._id);
      setLeaves(data);
    } catch (err) {
      setErrorMsg('Failed to load doctor leave records');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !newLeaveStartDate || !newLeaveEndDate || !newLeaveReason) return;
    try {
      const added = await requestDoctorLeave(selectedDoctor._id, {
        startDate: newLeaveStartDate,
        endDate: newLeaveEndDate,
        reason: newLeaveReason,
        allDay: true
      });
      setLeaves([added, ...leaves]);
      setNewLeaveStartDate('');
      setNewLeaveEndDate('');
      setNewLeaveReason('');
      setSuccessMsg('Leave logged successfully');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to submit doctor leave');
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await updateLeaveStatus(leaveId, status);
      setLeaves(leaves.map((l) => (l._id === leaveId ? updated : l)));
    } catch (err) {
      setErrorMsg('Failed to update leave status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-medical-600" />
            Doctor Roster & Clinical Staff
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage practicing clinicians, consulting rooms, consultation fees, weekly shift rosters, and leave approvals.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add Practicing Doctor
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

      {/* Doctor Cards / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500">Loading clinicians...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Card key={doc._id} className="relative overflow-hidden flex flex-col justify-between border-slate-200 shadow-xs hover:border-medical-300 transition-colors">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-navy-950 text-base">{doc.fullName}</h3>
                    <div className="text-xs text-medical-700 font-medium">{doc.specialization}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{doc.department}</div>
                  </div>
                  <Badge variant={doc.status === 'ACTIVE' ? 'success' : 'default'}>
                    {doc.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Room Number</span>
                    <span className="font-semibold text-navy-900">{doc.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Consultation Fee</span>
                    <span className="font-semibold text-navy-900">₹{doc.consultationFee}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Max Patients/Day</span>
                    <span className="font-semibold text-navy-900">{doc.maxDailyPatients}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Auto-Allocation</span>
                    <span className="font-semibold text-navy-900">
                      {doc.isAutoAllocatable ? 'Enabled' : 'Manual Only'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div><span className="font-medium">Council Reg:</span> {doc.medicalCouncilRegNo}</div>
                  <div><span className="font-medium">Phone:</span> {doc.phone}</div>
                  <div><span className="font-medium">Degrees:</span> {doc.qualifications?.join(', ') || 'MBBS'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => openScheduleEditor(doc)}
                  className="inline-flex items-center gap-1.5 font-medium text-medical-700 hover:text-medical-900"
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Shifts
                </button>
                <button
                  type="button"
                  onClick={() => openLeavesManager(doc)}
                  className="inline-flex items-center gap-1.5 font-medium text-amber-700 hover:text-amber-900"
                >
                  <Calendar className="w-3.5 h-3.5" /> Leaves
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(doc)}
                  className={`font-medium ${
                    doc.status === 'ACTIVE' ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'
                  }`}
                >
                  {doc.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Practicing Clinician"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor Full Name"
              required
              placeholder="e.g. Dr. Priya Nair"
              value={newDoctor.fullName}
              onChange={(e) => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
            />
            <Input
              label="Phone Number (Login & SMS)"
              required
              placeholder="e.g. 9876543219"
              value={newDoctor.phone}
              onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
            />
            <Input
              label="Portal Password"
              type="password"
              required
              placeholder="Min 6 characters"
              value={newDoctor.password}
              onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
            />
            <Input
              label="Official Email"
              type="email"
              placeholder="priya.nair@clinic.in"
              value={newDoctor.email}
              onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
            />
            <Input
              label="State/NMC Registration Number"
              required
              placeholder="e.g. MMC-2018-99214"
              value={newDoctor.medicalCouncilRegNo}
              onChange={(e) => setNewDoctor({ ...newDoctor, medicalCouncilRegNo: e.target.value })}
            />
            <Input
              label="Department"
              required
              placeholder="e.g. Pediatrics"
              value={newDoctor.department}
              onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
            />
            <Input
              label="Specialization"
              required
              placeholder="e.g. Pediatric Pulmonology"
              value={newDoctor.specialization}
              onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
            />
            <Input
              label="Qualifications (Comma Separated)"
              placeholder="MBBS, MD (Pediatrics), DNB"
              value={newDoctor.qualifications}
              onChange={(e) => setNewDoctor({ ...newDoctor, qualifications: e.target.value })}
            />
            <Input
              label="Consultation Room Number"
              required
              placeholder="e.g. Room 102"
              value={newDoctor.roomNumber}
              onChange={(e) => setNewDoctor({ ...newDoctor, roomNumber: e.target.value })}
            />
            <Input
              label="Standard Consultation Fee (₹)"
              type="number"
              min="0"
              required
              value={newDoctor.consultationFee}
              onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: Number(e.target.value) })}
            />
            <Input
              label="Average Consultation Time (Minutes)"
              type="number"
              min="5"
              max="60"
              value={newDoctor.averageConsultationMinutes}
              onChange={(e) => setNewDoctor({ ...newDoctor, averageConsultationMinutes: Number(e.target.value) })}
            />
            <Input
              label="Max Daily Patient Quota"
              type="number"
              min="5"
              max="100"
              value={newDoctor.maxDailyPatients}
              onChange={(e) => setNewDoctor({ ...newDoctor, maxDailyPatients: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="autoAlloc"
              checked={newDoctor.isAutoAllocatable}
              onChange={(e) => setNewDoctor({ ...newDoctor, isAutoAllocatable: e.target.checked })}
              className="rounded border-slate-300 text-medical-600 focus:ring-medical-500"
            />
            <label htmlFor="autoAlloc" className="text-xs text-slate-700 font-medium">
              Enable Smart Specialist Auto-Allocation ($W_i$ load balancing queue score)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addLoading}>
              Save Doctor Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Weekly Schedule Editor Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Weekly Shift Schedule: ${selectedDoctor?.fullName || ''}`}
        maxWidth="2xl"
      >
        {scheduleLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Configure daily OPD shifts, morning/evening session hours, and maximum patient capacity per shift.
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {schedules.map((daySched, idx) => (
                <div key={daySched.dayOfWeek} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-navy-900">
                      {DAYS_OF_WEEK[daySched.dayOfWeek]}
                    </span>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={daySched.isActive}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[idx].isActive = e.target.checked;
                          setSchedules(updated);
                        }}
                        className="rounded border-slate-300 text-medical-600"
                      />
                      Active Working Day
                    </label>
                  </div>

                  {daySched.isActive && (
                    <div className="space-y-2 pt-1 border-t border-slate-200">
                      {daySched.shifts.map((shift, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-4 gap-2 text-xs items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Start Time</span>
                            <input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx].shifts[sIdx].startTime = e.target.value;
                                setSchedules(updated);
                              }}
                              className="w-full text-xs p-1 border rounded bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">End Time</span>
                            <input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx].shifts[sIdx].endTime = e.target.value;
                                setSchedules(updated);
                              }}
                              className="w-full text-xs p-1 border rounded bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Slot (Mins)</span>
                            <input
                              type="number"
                              min="5"
                              max="60"
                              value={shift.slotDurationMinutes}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx].shifts[sIdx].slotDurationMinutes = Number(e.target.value);
                                setSchedules(updated);
                              }}
                              className="w-full text-xs p-1 border rounded bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Shift Max Pts</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={shift.maxPatientsPerShift}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx].shifts[sIdx].maxPatientsPerShift = Number(e.target.value);
                                setSchedules(updated);
                              }}
                              className="w-full text-xs p-1 border rounded bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule} isLoading={scheduleSaving}>
                Save Weekly Schedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Leaves & Absence Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={`Doctor Leaves: ${selectedDoctor?.fullName || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddLeave} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <span className="text-xs font-semibold text-navy-900 block">Record Approved Doctor Absence</span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                required
                value={newLeaveStartDate}
                onChange={(e) => setNewLeaveStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={newLeaveEndDate}
                onChange={(e) => setNewLeaveEndDate(e.target.value)}
              />
            </div>
            <Input
              label="Reason / Conference / Personal"
              required
              placeholder="e.g. Annual Medical Conference attendance"
              value={newLeaveReason}
              onChange={(e) => setNewLeaveReason(e.target.value)}
            />
            <Button type="submit" size="sm" className="w-full">
              Log Doctor Absence
            </Button>
          </form>

          {/* Existing leaves */}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {leaveLoading ? (
              <div className="text-center py-4"><Spinner size="sm" /></div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No leaves logged for this clinician.</div>
            ) : (
              leaves.map((l) => (
                <div key={l._id} className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-navy-900">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 block text-[11px]">{l.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {l.status}
                    </Badge>
                    {l.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLeaveStatus(l._id, 'APPROVED')}
                          className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold hover:bg-emerald-200"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLeaveStatus(l._id, 'REJECTED')}
                          className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

