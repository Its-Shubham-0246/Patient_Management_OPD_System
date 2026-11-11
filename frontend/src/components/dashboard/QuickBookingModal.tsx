import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Search,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { searchPatients, PatientData } from '../../services/patientService';
import { getDoctors, DoctorData } from '../../services/clinicService';
import {
  createAppointment,
  getAvailableSlots,
  autoAllocateDoctor,
  SlotData
} from '../../services/appointmentService';

export interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedPatient?: PatientData | null;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedPatient
}) => {
  // Step 1: Patient selection
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(preSelectedPatient || null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Step 2: Doctor selection
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);

  // Step 3: Date & Slots
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Channel & Notes
  const [bookingChannel, setBookingChannel] = useState<'RECEPTIONIST_WALKIN' | 'RECEPTIONIST_PHONE' | 'ONLINE_PATIENT'>('RECEPTIONIST_WALKIN');
  const [notes, setNotes] = useState('');

  // Auto Allocation recommendation state
  const [allocating, setAllocating] = useState(false);
  const [allocationMsg, setAllocationMsg] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedPatient) {
      setSelectedPatient(preSelectedPatient);
    }
  }, [preSelectedPatient]);

  useEffect(() => {
    if (isOpen) {
      fetchDoctorsList();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const fetchDoctorsList = async () => {
    try {
      const data = await getDoctors({ status: 'ACTIVE' });
      setDoctors(data);
      if (data.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(data[0]._id);
        setSelectedDoctor(data[0]);
      }
    } catch (err) {
      console.error('Failed to load doctors roster');
    }
  };

  // Search patients
  useEffect(() => {
    if (!patientQuery.trim()) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await searchPatients(patientQuery);
        setPatientResults(res);
      } catch (err) {
        console.error('Patient search error', err);
      } finally {
        setSearchingPatients(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [patientQuery]);

  // Load slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchSlots(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchSlots = async (docId: string, date: string) => {
    try {
      setLoadingSlots(true);
      setSelectedSlot('');
      const res = await getAvailableSlots(docId, date);
      setSlots(res.slots || []);
      // Pre-select first available slot
      const firstAvail = res.slots?.find((s) => s.isAvailable);
      if (firstAvail) setSelectedSlot(firstAvail.time);
    } catch (err: any) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = doctors.find((d) => d._id === docId);
    setSelectedDoctor(doc || null);
    setAllocationMsg(null);
  };

  // Trigger Smart Specialist Auto Allocation
  const handleSmartAllocate = async () => {
    try {
      setAllocating(true);
      setErrorMsg(null);
      const dept = selectedDoctor?.department || 'General Medicine';
      const res = await autoAllocateDoctor(dept, selectedDate);
      if (res.recommendedDoctor) {
        setSelectedDoctorId(res.recommendedDoctor._id);
        const fullDoc = doctors.find((d) => d._id === res.recommendedDoctor._id);
        setSelectedDoctor(fullDoc || null);
        setAllocationMsg(
          `Smart OPD Auto-Allocated: ${res.recommendedDoctor.fullName} (Lowest queue workload: ${res.recommendedDoctor.workloadIndex})`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Auto-allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMsg('Please select or search a registered patient first.');
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg('Please select an attending clinician.');
      return;
    }
    if (!selectedSlot) {
      setErrorMsg('Please select an available consultation slot.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const appt = await createAppointment({
        patientId: selectedPatient._id,
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        bookingChannel,
        notes
      });

      setSuccessMsg(
        `Appointment confirmed! Time: ${appt.timeSlot} · ${appt.doctorId?.fullName}${
          appt.tokenNumber ? ` · Token #${appt.tokenNumber}` : ''
        }`
      );

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to confirm appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Appointment Booking & Ingress" maxWidth="2xl">
      <form onSubmit={handleBook} className="space-y-4">
        {errorMsg && <Alert type="error" title="Booking Error">{errorMsg}</Alert>}
        {successMsg && <Alert type="success" title="Booking Confirmed">{successMsg}</Alert>}

        {/* Section 1: Patient Selection */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <label className="block text-xs font-bold text-navy-900">1. Select Patient</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-medical-50 text-medical-800 border border-medical-200 px-2 py-0.5 rounded">
                  {selectedPatient.uhid}
                </span>
                <div>
                  <span className="text-xs font-bold text-navy-950">{selectedPatient.fullName}</span>
                  <span className="text-[11px] text-slate-500 ml-2">Phone: {selectedPatient.phone}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)}>
                Change Patient
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by UHID, phone number, or patient name..."
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-medical-500 bg-white"
              />
              {searchingPatients && (
                <div className="absolute right-3 top-3">
                  <Spinner size="sm" />
                </div>
              )}
              {patientResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {patientResults.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientQuery('');
                        setPatientResults([]);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-navy-950">{p.fullName}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({p.phone})</span>
                      </div>
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">
                        {p.uhid}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Attending Doctor & Auto-Allocation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-navy-900">2. Select Practicing Physician</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSmartAllocate}
              isLoading={allocating}
              className="text-xs gap-1 border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Smart Auto-Allocate ($W_i$)
            </Button>
          </div>

          {allocationMsg && (
            <div className="text-[11px] bg-blue-50 border border-blue-200 text-blue-900 p-2 rounded flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
              {allocationMsg}
            </div>
          )}

          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
          >
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.fullName} — {doc.department} ({doc.roomNumber}) · Fee: ₹{doc.consultationFee}
              </option>
            ))}
          </select>
        </div>

        {/* Section 3: Date & Discrete Slot Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Consultation Date"
            type="date"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Channel / Flow</label>
            <select
              value={bookingChannel}
              onChange={(e) => setBookingChannel(e.target.value as any)}
              className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
            >
              <option value="RECEPTIONIST_WALKIN">Front-Desk Walk-In (Instant Queue Token)</option>
              <option value="RECEPTIONIST_PHONE">Phone Appointment Booking</option>
              <option value="ONLINE_PATIENT">Scheduled Advance Visit</option>
            </select>
          </div>
        </div>

        {/* Discrete Time Slots Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Available Time Slots</span>
            <span className="text-[11px] text-slate-400">
              {slots.filter((s) => s.isAvailable).length} slots available
            </span>
          </div>

          {loadingSlots ? (
            <div className="text-center py-4 text-xs text-slate-400">
              <Spinner size="sm" /> Loading available schedule slots...
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-4 text-xs text-amber-700 bg-amber-50 rounded border border-amber-200">
              No shifts or working slots available for this doctor on selected date.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors ${
                    selectedSlot === slot.time
                      ? 'bg-navy-900 text-white border-navy-900'
                      : slot.isAvailable
                      ? 'bg-white text-slate-800 border-slate-200 hover:border-medical-500'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Visit Reason / Intake Symptoms (Optional)"
          placeholder="e.g. Headache and fever for 2 days"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Confirm Booking & Issue Slip
          </Button>
        </div>
      </form>
    </Modal>
  );
};
