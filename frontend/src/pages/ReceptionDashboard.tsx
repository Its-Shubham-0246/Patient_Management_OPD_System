import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  PlusCircle,
  Search,
  Printer,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import {
  getAppointments,
  updateAppointmentStatus,
  autoAllocateDoctor,
  AppointmentData,
  AutoAllocationResponse
} from '../services/appointmentService';
import { QuickPatientModal } from '../components/dashboard/QuickPatientModal';
import { QuickBookingModal } from '../components/dashboard/QuickBookingModal';
import { PatientData } from '../services/patientService';

export const ReceptionDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter tab
  const [filterTab, setFilterTab] = useState<'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Auto Allocation recommendation banner
  const [allocationInfo, setAllocationInfo] = useState<AutoAllocationResponse | null>(null);

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<PatientData | null>(null);

  // Keyboard shortcut: Alt+N to open New Patient Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsPatientModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchTodayData();
    fetchAutoAllocationRecommendation();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const data = await getAppointments({ date: todayStr });
      setAppointments(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoAllocationRecommendation = async () => {
    try {
      const res = await autoAllocateDoctor('General Medicine', todayStr);
      setAllocationInfo(res);
    } catch (err) {
      // Non-blocking
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      setErrorMsg(null);
      const updated = await updateAppointmentStatus(appointmentId, 'CHECKED_IN');
      setAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? updated : a))
      );
      setSuccessMsg(
        `Patient ${updated.patientId?.fullName || ''} checked in! Assigned Queue Token #${updated.tokenNumber}`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to check in patient');
    }
  };

  const handlePrintSlip = (appt: AppointmentData) => {
    window.alert(
      `--- SMART OPD INGRESS SLIP ---\n\nTOKEN NUMBER: #${appt.tokenNumber || 'WAIT'}\nPatient: ${appt.patientId?.fullName}\nUHID: ${appt.patientId?.uhid}\nDoctor: ${appt.doctorId?.fullName}\nRoom: ${appt.doctorId?.roomNumber}\nTime Slot: ${appt.timeSlot}\n\nPlease proceed to Waiting Lounge.`
    );
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((appt) => {
    if (filterTab !== 'ALL' && appt.status !== filterTab) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const ptName = appt.patientId?.fullName?.toLowerCase() || '';
      const uhid = appt.patientId?.uhid?.toLowerCase() || '';
      const phone = appt.patientId?.phone || '';
      const token = String(appt.tokenNumber || '');
      return ptName.includes(q) || uhid.includes(q) || phone.includes(q) || token.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-navy-900" />
            Front-Desk Reception Console
          </h1>
          <p className="text-xs text-slate-500">
            Patient arrival check-in, token dispatching, walk-in allocation, and cashier billing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTodayData}
            isLoading={loading}
            className="text-xs gap-1 border-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPatientForBooking(null);
              setIsPatientModalOpen(true);
            }}
            className="text-xs gap-1.5 border-slate-300"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>New Patient Drawer (Alt+N)</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedPatientForBooking(null);
              setIsBookingModalOpen(true);
            }}
            className="text-xs gap-1.5 bg-navy-900"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Quick Walk-In Ingress</span>
          </Button>
        </div>
      </div>

      {successMsg && (
        <Alert type="success" title="Check-In Success">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert type="error" title="Ingress Error">
          {errorMsg}
        </Alert>
      )}

      {/* Smart Specialist Doctor Auto-Allocation Ingress Banner */}
      {allocationInfo && allocationInfo.recommendedDoctor && (
        <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm" className="bg-blue-600 text-white border-transparent">
                  Smart Doctor Allocation ($W_i$)
                </Badge>
                <span className="text-xs font-bold text-slate-900">Optimal Specialist Recommendation</span>
              </div>
              <p className="text-xs text-slate-600">
                Department: <strong className="text-slate-800">{allocationInfo.department}</strong> · Recommended:{' '}
                <strong className="text-slate-900">
                  {allocationInfo.recommendedDoctor.fullName} ({allocationInfo.recommendedDoctor.roomNumber})
                </strong>{' '}
                · Current Workload Score:{' '}
                <strong className="text-emerald-700 font-mono">
                  {allocationInfo.recommendedDoctor.workloadIndex}
                </strong>{' '}
                · Fee: ₹{allocationInfo.recommendedDoctor.consultationFee}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedPatientForBooking(null);
                  setIsBookingModalOpen(true);
                }}
                className="text-xs bg-blue-600 hover:bg-blue-500 shadow-xs"
              >
                1-Click Auto-Allocate Walk-in
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/reception/patients')}
                className="text-xs"
              >
                Search Patient (Alt+C)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Ingress & Token Issuance Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-navy-900" />
              <span>Today's Outpatient Arrival & Token Dispatch</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical check-in issues daily sequential queue token and notifies consulting rooms
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-md text-xs">
              {(['ALL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    filterTab === tab ? 'bg-white text-navy-950 shadow-xs' : 'text-slate-500 hover:text-navy-900'
                  }`}
                >
                  {tab === 'CONFIRMED' ? 'Pre-Booked' : tab === 'CHECKED_IN' ? 'In Queue' : tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter by name, phone, token..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-medical-500 bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <Spinner size="lg" />
              <span className="text-xs text-slate-500">Loading today's ingress appointments...</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No appointments found for today matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token #</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Patient Details</TableHead>
                    <TableHead>Attending Doctor</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Check-In Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt._id} className="hover:bg-slate-50/80">
                      <TableCell>
                        {apt.tokenNumber ? (
                          <span className="inline-flex items-center justify-center font-mono font-bold text-sm bg-medical-50 text-medical-800 border border-medical-200 px-2.5 py-1 rounded">
                            #{apt.tokenNumber}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Not Checked In</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-navy-950 text-xs">{apt.timeSlot}</TableCell>
                      <TableCell>
                        <div
                          onClick={() => apt.patientId?._id && navigate(`/patients/${apt.patientId._id}`)}
                          className="font-bold text-navy-950 text-xs hover:text-medical-700 cursor-pointer flex items-center gap-1.5"
                        >
                          {apt.patientId?.fullName || 'Walk-In Patient'}
                          {apt.patientId?.allergies && apt.patientId.allergies.length > 0 && (
                            <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 font-bold px-1 rounded">
                              ALLERGY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {apt.patientId?.uhid} · {apt.patientId?.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 text-xs">{apt.doctorId?.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {apt.doctorId?.roomNumber} · {apt.doctorId?.specialization}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {apt.bookingChannel.replace('RECEPTIONIST_', '').replace('ONLINE_', '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            apt.status === 'CHECKED_IN'
                              ? 'warning'
                              : apt.status === 'COMPLETED'
                              ? 'success'
                              : apt.status === 'CANCELLED'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCheckIn(apt._id)}
                            className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Check In
                          </Button>
                        ) : apt.status === 'CHECKED_IN' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintSlip(apt)}
                            className="text-xs gap-1 border-slate-300"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Slip
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Done</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchTodayData}
        preSelectedPatient={selectedPatientForBooking}
      />

      {/* Quick Patient Registration Modal */}
      <QuickPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {
          fetchTodayData();
        }}
        onBookAppointment={(pt) => {
          setSelectedPatientForBooking(pt);
          setIsBookingModalOpen(true);
        }}
      />
    </div>
  );
};
