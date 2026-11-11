import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Stethoscope,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { getDoctors, DoctorData } from '../../services/clinicService';
import {
  createAppointment,
  getAvailableSlots,
  autoAllocateDoctor,
  bookAutoAllocatedAppointment,
  SlotData,
  AppointmentData
} from '../../services/appointmentService';

export const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<string[]>([
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'ENT',
    'Dermatology',
    'Gynecology'
  ]);
  const [selectedDept, setSelectedDept] = useState('General Medicine');

  // Mode: AUTO vs MANUAL
  const [bookingMode, setBookingMode] = useState<'AUTO' | 'MANUAL'>('AUTO');

  // Doctors
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);

  // Date & Slots
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const [selectedDate, setSelectedDate] = useState(() => tomorrowStr());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Symptoms & Notes
  const [notes, setNotes] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<AppointmentData | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [selectedDept]);

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors({ department: selectedDept, status: 'ACTIVE' });
      setDoctors(data);
      if (data.length > 0) {
        setSelectedDoctorId(data[0]._id);
        setSelectedDoctor(data[0]);
      } else {
        setSelectedDoctorId('');
        setSelectedDoctor(null);
      }
    } catch (err) {
      console.error('Failed to load department doctors');
    }
  };

  useEffect(() => {
    if (selectedDoctorId && selectedDate && bookingMode === 'MANUAL') {
      fetchSlots(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate, bookingMode]);

  const fetchSlots = async (docId: string, date: string) => {
    try {
      setSlotsLoading(true);
      setSelectedSlot('');
      const res = await getAvailableSlots(docId, date);
      setSlots(res.slots || []);
      const firstAvail = res.slots?.find((s) => s.isAvailable);
      if (firstAvail) setSelectedSlot(firstAvail.time);
    } catch (err) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.patientProfileId) {
      setErrorMsg('You must have an active patient profile to book an appointment.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      let appt: AppointmentData;

      if (bookingMode === 'AUTO') {
        appt = await bookAutoAllocatedAppointment({
          patientId: user.patientProfileId,
          department: selectedDept,
          appointmentDate: selectedDate,
          preferredTimeSlot: selectedSlot || undefined,
          bookingChannel: 'ONLINE_PATIENT',
          notes
        });
      } else {
        if (!selectedDoctorId || !selectedSlot) {
          setErrorMsg('Please select a physician and consultation slot.');
          setSubmitting(false);
          return;
        }
        appt = await createAppointment({
          patientId: user.patientProfileId,
          doctorId: selectedDoctorId,
          appointmentDate: selectedDate,
          timeSlot: selectedSlot,
          bookingChannel: 'ONLINE_PATIENT',
          notes
        });
      }

      setConfirmedAppointment(appt);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to complete appointment booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedAppointment) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <Card className="text-center p-8 space-y-4 border-emerald-200 bg-white shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Appointment Confirmed
            </span>
            <h2 className="text-2xl font-bold text-navy-950 mt-3">Consultation Scheduled!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your appointment reservation has been registered at City Health Care Clinic.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-navy-950">{user?.fullName} ({user?.uhid})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attending Physician:</span>
              <span className="font-bold text-navy-950">{confirmedAppointment.doctorId?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department / Room:</span>
              <span className="font-bold text-navy-950">
                {confirmedAppointment.doctorId?.department} ({confirmedAppointment.doctorId?.roomNumber})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time Slot:</span>
              <span className="font-bold text-navy-950 font-mono">
                {new Date(confirmedAppointment.appointmentDate).toLocaleDateString()} at {confirmedAppointment.timeSlot}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consultation Fee:</span>
              <span className="font-bold text-emerald-700">₹{confirmedAppointment.doctorId?.consultationFee}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Please arrive 10 minutes before your slot. You will receive an SMS reminder on your registered mobile.
          </p>

          <div className="flex justify-center gap-3 pt-3">
            <Button variant="outline" onClick={() => navigate('/portal/dashboard')}>
              Go to Dashboard
            </Button>
            <Button
              onClick={() => {
                setConfirmedAppointment(null);
                setSelectedSlot('');
                setNotes('');
              }}
            >
              Book Another Visit
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-medical-600" />
          Book Outpatient Consultation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Reserve a clinical appointment with our specialist physicians or let Smart OPD auto-allocate the shortest queue.
        </p>
      </div>

      {errorMsg && <Alert type="error" title="Booking Error">{errorMsg}</Alert>}

      <form onSubmit={handleConfirmBooking} className="space-y-6">
        {/* Step 1: Select Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-medical-600" />
              1. Choose Clinical Specialty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`p-3 text-left rounded-lg border text-xs font-semibold transition-all ${
                    selectedDept === dept
                      ? 'border-medical-600 bg-medical-50/60 text-medical-900 ring-1 ring-medical-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 mb-1 text-slate-400" />
                  {dept}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Choose Allocation Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              2. Allocation Preference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBookingMode('AUTO')}
                className={`p-4 text-left rounded-lg border transition-all ${
                  bookingMode === 'AUTO'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-navy-950">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Smart OPD Auto-Allocation (Recommended)
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Our algorithm automatically matches you with the specialist having the shortest waiting queue ($W_i$ load index).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBookingMode('MANUAL')}
                className={`p-4 text-left rounded-lg border transition-all ${
                  bookingMode === 'MANUAL'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-navy-950">
                  <User className="w-4 h-4 text-medical-600" />
                  Choose Specific Doctor
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Select your preferred clinician from our department roster and view their individual consulting room slots.
                </p>
              </button>
            </div>

            {/* Doctor picker if MANUAL */}
            {bookingMode === 'MANUAL' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Select Practicing Physician</span>
                {doctors.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3">No doctors currently practicing in {selectedDept}.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {doctors.map((doc) => (
                      <button
                        key={doc._id}
                        type="button"
                        onClick={() => {
                          setSelectedDoctorId(doc._id);
                          setSelectedDoctor(doc);
                        }}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          selectedDoctorId === doc._id
                            ? 'border-navy-900 bg-slate-50 text-navy-950 ring-1 ring-navy-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-navy-950">{doc.fullName}</div>
                        <div className="text-[10px] text-slate-500">{doc.specialization} · {doc.roomNumber}</div>
                        <div className="text-[11px] font-semibold text-emerald-700 mt-1">Fee: ₹{doc.consultationFee}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Date & Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-medical-600" />
              3. Date & Time Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Input
                label="Appointment Date"
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {bookingMode === 'MANUAL' && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Available Time Slots</span>
                {slotsLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    <Spinner size="sm" /> Loading available slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                    No open slots available on {selectedDate}. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors ${
                          selectedSlot === s.time
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
            )}
          </CardContent>
        </Card>

        {/* Step 4: Symptoms & Confirm */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-medical-600" />
              4. Symptoms & Consultation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Primary Symptoms / Reason for Visit"
              placeholder="e.g. Cough and throat irritation for 3 days"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              helperText="Brief details assist the physician prior to examination"
            />

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero pre-payment required. Consultation fee payable at reception cashier.</span>
              </div>
              <Button type="submit" isLoading={submitting} className="gap-2 shadow-sm">
                Confirm Reservation <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

