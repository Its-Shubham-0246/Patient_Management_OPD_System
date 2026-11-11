import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Sparkles,
  RefreshCw,
  CalendarDays,
  UserCheck,
  RotateCcw,
  XCircle,
  Stethoscope,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import {
  getAppointments,
  getCalendarAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  getAvailableSlots,
  AppointmentData,
  SlotData
} from '../../services/appointmentService';
import { getDoctors, DoctorData } from '../../services/clinicService';
import { QuickBookingModal } from '../../components/dashboard/QuickBookingModal';

export const AppointmentSchedulingPage: React.FC = () => {
  const navigate = useNavigate();

  // View state
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK' | 'LIST'>('DAY');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Appointments data
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Reschedule Modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<AppointmentData | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<SlotData[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Cancel Modal
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentData | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchDoctorsList();
  }, []);

  useEffect(() => {
    fetchAppointmentsData();
  }, [selectedDate, selectedDoctorId, viewMode]);

  const fetchDoctorsList = async () => {
    try {
      const data = await getDoctors({ status: 'ACTIVE' });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors');
    }
  };

  const fetchAppointmentsData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      if (viewMode === 'WEEK') {
        const curr = new Date(selectedDate);
        const first = curr.getDate() - curr.getDay(); // Sunday
        const firstDay = new Date(curr.setDate(first)).toISOString().slice(0, 10);
        const lastDay = new Date(curr.setDate(first + 6)).toISOString().slice(0, 10);

        const data = await getCalendarAppointments(
          firstDay,
          lastDay,
          selectedDoctorId !== 'ALL' ? selectedDoctorId : undefined
        );
        setAppointments(data);
      } else {
        const data = await getAppointments({
          date: selectedDate,
          doctorId: selectedDoctorId !== 'ALL' ? selectedDoctorId : undefined
        });
        setAppointments(data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Date Navigation
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'WEEK') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'WEEK') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Check-In Action
  const handleCheckIn = async (id: string) => {
    try {
      setErrorMsg(null);
      const updated = await updateAppointmentStatus(id, 'CHECKED_IN');
      setAppointments((prev) => prev.map((a) => (a._id === id ? updated : a)));
      setSuccessMsg(`Patient checked in! Token #${updated.tokenNumber} issued.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Check-in failed');
    }
  };

  // Reschedule Trigger
  const openRescheduleModal = (appt: AppointmentData) => {
    setAppointmentToReschedule(appt);
    setRescheduleDate(appt.appointmentDate ? appt.appointmentDate.slice(0, 10) : selectedDate);
    setSelectedRescheduleSlot('');
    setRescheduleReason('');
    setIsRescheduleOpen(true);
    if (appt.doctorId?._id) {
      loadRescheduleSlots(appt.doctorId._id, appt.appointmentDate ? appt.appointmentDate.slice(0, 10) : selectedDate);
    }
  };

  const loadRescheduleSlots = async (docId: string, date: string) => {
    try {
      setSlotsLoading(true);
      const res = await getAvailableSlots(docId, date);
      setRescheduleSlots(res.slots || []);
    } catch (err) {
      setRescheduleSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentToReschedule || !selectedRescheduleSlot) return;
    try {
      setRescheduleLoading(true);
      const updated = await rescheduleAppointment(
        appointmentToReschedule._id,
        rescheduleDate,
        selectedRescheduleSlot,
        rescheduleReason
      );
      setAppointments((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setSuccessMsg(`Appointment rescheduled to ${rescheduleDate} at ${selectedRescheduleSlot}`);
      setIsRescheduleOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Rescheduling failed');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Cancel Trigger
  const openCancelModal = (appt: AppointmentData) => {
    setAppointmentToCancel(appt);
    setCancellationReason('');
    setIsCancelOpen(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentToCancel) return;
    try {
      setCancelLoading(true);
      await cancelAppointment(appointmentToCancel._id, cancellationReason);
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointmentToCancel._id
            ? { ...a, status: 'CANCELLED', cancellationReason }
            : a
        )
      );
      setSuccessMsg('Appointment cancelled and consultation slot released.');
      setIsCancelOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Cancellation failed');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-medical-600" />
            Clinic Appointment Scheduling & Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage advance consultations, slot calendars, double-booking prevention, cancellations, and doctor availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsBookingModalOpen(true)} className="flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Book Appointment
          </Button>
        </div>
      </div>

      {successMsg && <Alert type="success" title="Success">{successMsg}</Alert>}
      {errorMsg && <Alert type="error" title="Error">{errorMsg}</Alert>}

      {/* Control Bar: Date Navigation & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDate} className="p-1.5">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs font-semibold">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextDate} className="p-1.5">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1.5 ml-2 font-bold text-navy-950 text-sm">
            <CalendarDays className="w-4 h-4 text-medical-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-medical-500"
            />
          </div>
        </div>

        {/* View Mode & Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-md text-xs font-semibold">
            {(['DAY', 'WEEK', 'LIST'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === m ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-500 hover:text-navy-900'
                }`}
              >
                {m === 'DAY' ? 'Day Agenda' : m === 'WEEK' ? 'Week Grid' : 'All List'}
              </button>
            ))}
          </div>

          {/* Doctor Filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Practicing Physicians</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.fullName} ({d.department})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed / Pre-Booked</option>
            <option value="CHECKED_IN">Checked-In (Queue)</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button variant="ghost" size="sm" onClick={fetchAppointmentsData} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Appointments Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500">Loading appointment schedules...</span>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card className="text-center py-16 space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-navy-900">No Appointments Scheduled</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No outpatient consultations found for {selectedDate} with the active filters.
          </p>
          <Button size="sm" onClick={() => setIsBookingModalOpen(true)}>
            Schedule New Patient
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-3 px-4 border-b border-slate-100 flex justify-between items-center">
            <CardTitle className="text-sm font-semibold text-navy-900">
              Scheduled Outpatient Consultations ({filteredAppointments.length})
            </CardTitle>
            <span className="text-[11px] text-slate-400">
              Double-booking protected by ACID unique compound indexes
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Patient Information</th>
                    <th className="py-3 px-4">Attending Clinician</th>
                    <th className="py-3 px-4">Booking Channel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-navy-950 text-xs">{appt.timeSlot}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {appt.tokenNumber ? (
                          <span className="font-mono font-bold text-xs bg-medical-50 text-medical-800 border border-medical-200 px-2 py-0.5 rounded">
                            #{appt.tokenNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          onClick={() => appt.patientId?._id && navigate(`/patients/${appt.patientId._id}`)}
                          className="font-bold text-navy-950 hover:text-medical-700 cursor-pointer flex items-center gap-1.5"
                        >
                          {appt.patientId?.fullName || 'Walk-In Patient'}
                          {appt.patientId?.allergies && appt.patientId.allergies.length > 0 && (
                            <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 font-bold px-1 rounded">
                              ALLERGY
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {appt.patientId?.uhid} · {appt.patientId?.phone}
                        </div>
                        {appt.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">"{appt.notes}"</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{appt.doctorId?.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {appt.doctorId?.roomNumber} · {appt.doctorId?.department}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {appt.bookingChannel.replace('RECEPTIONIST_', '').replace('ONLINE_', '')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            appt.status === 'CHECKED_IN'
                              ? 'warning'
                              : appt.status === 'COMPLETED'
                              ? 'success'
                              : appt.status === 'CANCELLED'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {appt.status}
                        </Badge>
                        {appt.cancellationReason && (
                          <div className="text-[10px] text-red-600 mt-0.5">"{appt.cancellationReason}"</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                          <>
                            {appt.status !== 'CHECKED_IN' && (
                              <button
                                type="button"
                                onClick={() => handleCheckIn(appt._id)}
                                className="font-semibold text-xs text-emerald-700 hover:text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-50"
                              >
                                Check In
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openRescheduleModal(appt)}
                              className="font-semibold text-xs text-blue-700 hover:text-blue-900 px-1.5 py-0.5 rounded hover:bg-blue-50"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => openCancelModal(appt)}
                              className="font-semibold text-xs text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchAppointmentsData}
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Outpatient Appointment"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Rescheduling patient <strong className="text-slate-800">{appointmentToReschedule?.patientId?.fullName}</strong> with <strong className="text-slate-800">{appointmentToReschedule?.doctorId?.fullName}</strong>.
          </p>

          <Input
            label="New Target Date"
            type="date"
            required
            value={rescheduleDate}
            onChange={(e) => {
              setRescheduleDate(e.target.value);
              if (appointmentToReschedule?.doctorId?._id) {
                loadRescheduleSlots(appointmentToReschedule.doctorId._id, e.target.value);
              }
            }}
          />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">Select Open Slot</span>
            {slotsLoading ? (
              <div className="text-center py-4 text-xs text-slate-400">
                <Spinner size="sm" /> Calculating clinician schedule...
              </div>
            ) : rescheduleSlots.length === 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                No open slots available for this doctor on the selected date.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1">
                {rescheduleSlots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.isAvailable}
                    onClick={() => setSelectedRescheduleSlot(s.time)}
                    className={`py-1 px-1.5 text-xs font-semibold rounded border transition-colors ${
                      selectedRescheduleSlot === s.time
                        ? 'bg-navy-900 text-white border-navy-900'
                        : s.isAvailable
                        ? 'bg-white text-slate-800 border-slate-200 hover:border-medical-500'
                        : 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Reschedule Reason (Optional)"
            placeholder="e.g. Patient requested morning instead of evening"
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={rescheduleLoading} disabled={!selectedRescheduleSlot}>
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Appointment Modal */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Outpatient Appointment"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel the appointment for <strong className="text-slate-900">{appointmentToCancel?.patientId?.fullName}</strong> on <strong className="text-slate-900">{appointmentToCancel?.timeSlot}</strong>?
          </p>
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
            Cancelling will immediately release this time slot in the calendar for other patients to book.
          </p>

          <Input
            label="Reason for Cancellation"
            required
            placeholder="e.g. Patient unavailable / Symptoms resolved / Emergency"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsCancelOpen(false)}>
              Keep Appointment
            </Button>
            <Button type="submit" variant="danger" isLoading={cancelLoading}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

