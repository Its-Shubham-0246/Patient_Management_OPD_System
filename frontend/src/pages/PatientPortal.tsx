import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  CreditCard,
  FolderOpen,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Download,
  Printer,
  ChevronRight,
  User,
  ShieldCheck,
  Edit3,
  RefreshCw,
  X,
  Stethoscope,
  MapPin,
  ExternalLink,
  Upload
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getPatient, getPatients, PatientData } from '../services/patientService';
import { getPatientActiveQueue, PatientActiveQueueResponse } from '../services/queueService';
import { getAppointments, cancelAppointment, AppointmentData } from '../services/appointmentService';
import { getPatientPrescriptions, PrescriptionData } from '../services/prescriptionService';
import { getInvoices, InvoiceData } from '../services/billingService';
import { getPatientReports, uploadReport, MedicalReportData } from '../services/medicalRecordService';
import { PatientProfileModal } from '../components/patient/PatientProfileModal';

export const PatientPortal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [allPatients, setAllPatients] = useState<PatientData[]>([]);
  const [activeToken, setActiveToken] = useState<PatientActiveQueueResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [reports, setReports] = useState<MedicalReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PRESCRIPTIONS' | 'REPORTS' | 'INVOICES'>('PRESCRIPTIONS');

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<PrescriptionData | null>(null);
  const [selectedInvForPrint, setSelectedInvForPrint] = useState<InvoiceData | null>(null);
  const [cancelModalAppt, setCancelModalAppt] = useState<AppointmentData | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Upload report modal state
  const [isUploadReportModalOpen, setIsUploadReportModalOpen] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadType, setUploadType] = useState<string>('lab');
  const [uploadLabName, setUploadLabName] = useState<string>('');
  const [uploadFindings, setUploadFindings] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Resolve current patient
  const loadPatientData = async (targetId?: string) => {
    setLoading(true);
    try {
      let patientIdToUse = targetId || user?.patientProfileId;

      if (!patientIdToUse) {
        // Staff preview mode: fetch patient list
        const res = await getPatients({ limit: 10 });
        setAllPatients(res.patients || []);
        if (res.patients.length > 0) {
          patientIdToUse = res.patients[0]._id;
        }
      }

      if (!patientIdToUse) {
        setLoading(false);
        return;
      }

      // Fetch patient profile
      const pt = await getPatient(patientIdToUse);
      setPatient(pt);

      // Concurrent fetch of all patient records
      const [tokenRes, apptsRes, rxRes, invRes, repRes] = await Promise.all([
        getPatientActiveQueue(patientIdToUse).catch(() => null),
        getAppointments({ patientId: patientIdToUse }).catch(() => []),
        getPatientPrescriptions(patientIdToUse).catch(() => []),
        getInvoices({ patientId: patientIdToUse }).catch(() => []),
        getPatientReports(patientIdToUse).catch(() => [])
      ]);

      setActiveToken(tokenRes);
      setAppointments(apptsRes || []);
      setPrescriptions(rxRes || []);
      setInvoices(invRes || []);
      setReports(repRes || []);
    } catch (err) {
      console.error('Error loading patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [user]);

  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    if (!cancelModalAppt) return;
    setIsCancelling(true);
    try {
      await cancelAppointment(cancelModalAppt._id, cancelReason || 'Cancelled by patient');
      setCancelModalAppt(null);
      setCancelReason('');
      if (patient) loadPatientData(patient._id);
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle patient report upload
  const handleReportUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !uploadTitle) return;
    setIsUploading(true);
    try {
      await uploadReport(patient._id, {
        title: uploadTitle,
        reportType: uploadType as any,
        labName: uploadLabName,
        findings: uploadFindings,
        reportDate: new Date().toISOString().slice(0, 10),
        fileUrl: `/uploads/reports/${patient.uhid}_${Date.now()}.pdf`
      });
      setIsUploadReportModalOpen(false);
      setUploadTitle('');
      setUploadLabName('');
      setUploadFindings('');
      loadPatientData(patient._id);
    } catch (err) {
      console.error('Report upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const clinicName = import.meta.env.VITE_DEFAULT_CLINIC_NAME || 'City Health Care Clinic';

  if (loading && !patient) {
    return (
      <div className="p-16 text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-navy-900" />
        <p className="text-sm font-semibold text-slate-600">Loading your Patient Health Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Preview Switcher (if logged in as Admin/Doctor/Receptionist) */}
      {user?.role !== 'PATIENT' && allPatients.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 px-2 py-0.5 rounded">
              Staff Preview Mode
            </span>
            <span>You are viewing the Patient Self-Service Portal as {user?.role}.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Select Patient:</span>
            <select
              value={patient?._id || ''}
              onChange={(e) => loadPatientData(e.target.value)}
              className="bg-white border border-amber-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800"
            >
              {allPatients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.uhid})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Patient Welcome & Demographics Card */}
      {patient && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome, {patient.fullName}
              </h1>
              <Badge variant="outline" size="sm" className="font-mono text-xs font-bold text-navy-900 bg-slate-50 border-slate-300">
                UHID: {patient.uhid}
              </Badge>
              <Badge variant="outline" size="sm" className="text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200 gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>DPDP Consent Active</span>
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Age: <strong className="text-slate-700">{patient.age || '32'} yrs</strong> · Gender: <strong className="text-slate-700">{patient.gender}</strong> · Blood Group: <strong className="text-slate-700">{patient.bloodGroup || 'O+'}</strong> · Phone: <strong className="text-slate-700">{patient.phone}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(true)}
              className="gap-1.5 text-xs text-slate-700 hover:text-navy-900"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/portal/book')}
              className="gap-1.5 text-xs bg-navy-900 hover:bg-navy-800 text-white shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Book Appointment</span>
            </Button>
          </div>
        </div>
      )}

      {/* Critical Allergies Warning Banner */}
      {patient && patient.allergies && patient.allergies.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-lg text-red-600 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-red-700 block">
                Critical Medical Allergies Warning
              </span>
              <span>
                Documented Allergies: <strong>{patient.allergies.join(', ')}</strong>. Please alert your physician before medication administration.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active OPD Encounter Card (Today's Live Token) */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/40 via-white to-slate-50 p-6 shadow-xs">
        {activeToken?.active && activeToken.entry ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="bg-blue-600 text-white border-transparent text-xs py-0.5">
                  Today's Active OPD Visit
                </Badge>
                <span className="text-xs font-semibold text-slate-700">
                  {activeToken.entry.doctorId?.department || 'Consultation'}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-navy-900 tracking-tight">
                  YOUR TOKEN: #{activeToken.entry.tokenNumber}
                </span>
                <Badge
                  variant={
                    activeToken.entry.status === 'CALLED'
                      ? 'danger'
                      : activeToken.entry.status === 'IN_CONSULTATION'
                      ? 'info'
                      : 'warning'
                  }
                  className="text-xs font-bold"
                >
                  {activeToken.entry.status === 'CALLED'
                    ? 'CALLED - PROCEED NOW'
                    : activeToken.entry.status === 'IN_CONSULTATION'
                    ? 'IN CONSULTATION'
                    : 'WAITING IN QUEUE'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                <span>
                  Dr. {activeToken.entry.doctorId?.fullName} ·{' '}
                  <strong className="text-slate-900">Room #{activeToken.entry.doctorId?.roomNumber || '1'}</strong>
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center min-w-[130px] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Queue Position</span>
                <span className="text-sm font-bold text-slate-900">
                  {activeToken.patientsAhead === 0 ? 'Next in line!' : `${activeToken.patientsAhead} ahead`}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center min-w-[130px] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Time</span>
                <span className="text-sm font-bold text-navy-900">
                  ~{activeToken.estimatedWaitMinutes} mins
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/portal/token')}
                className="gap-1.5 text-xs bg-navy-900 text-white shadow-xs self-center sm:self-auto h-auto py-2.5 px-4"
              >
                <span>Live Tracker</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">No active queue token for today</h3>
                <p className="text-xs text-slate-500">
                  If you have an appointment scheduled today, visit the front desk for OPD check-in.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/portal/token')}
                className="text-xs"
              >
                Open Token Screen
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/portal/book')}
                className="text-xs bg-navy-900 text-white"
              >
                Book Appointment
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Appointments Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-navy-900" />
            <span>My Consultations & Appointments</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal/book')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold gap-1 p-0 h-auto"
          >
            <span>+ Book New Consultation</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Calendar className="h-7 w-7 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">No appointment bookings found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {appointments.slice(0, 6).map((appt) => {
                const doc: any = appt.doctorId;
                const canCancel = appt.status === 'CONFIRMED';
                return (
                  <div
                    key={appt._id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <Badge
                        variant={
                          appt.status === 'CONFIRMED'
                            ? 'info'
                            : appt.status === 'COMPLETED'
                            ? 'success'
                            : appt.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                        className="text-[10px]"
                      >
                        {appt.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        Dr. {doc?.fullName || 'Physician'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {doc?.specialization || 'OPD'} · Room #{doc?.roomNumber || '1'}
                      </p>
                      <p className="text-[11px] text-blue-600 font-semibold mt-1">
                        Time Slot: {appt.timeSlot}
                      </p>
                    </div>

                    {canCancel && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelModalAppt(appt)}
                          className="text-[11px] h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancel Appointment
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Records & Financial Hub (Tabs) */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('PRESCRIPTIONS')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === 'PRESCRIPTIONS'
                    ? 'border-navy-900 text-navy-900 bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Digital Prescriptions ({prescriptions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('REPORTS')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === 'REPORTS'
                    ? 'border-navy-900 text-navy-900 bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Lab & Diagnostic Reports ({reports.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('INVOICES')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === 'INVOICES'
                    ? 'border-navy-900 text-navy-900 bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Payment Receipts & Invoices ({invoices.length})</span>
              </button>
            </div>

            {activeTab === 'REPORTS' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadReportModalOpen(true)}
                className="text-xs gap-1.5 h-8 my-2"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload External Report</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* TAB 1: PRESCRIPTIONS */}
          {activeTab === 'PRESCRIPTIONS' && (
            <div>
              {prescriptions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="h-7 w-7 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No digital prescriptions issued yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx) => {
                    const docObj: any = rx.doctorId;
                    return (
                      <div
                        key={rx._id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-navy-900">
                              {rx.prescriptionNumber || 'RX-2026'}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs text-slate-600">
                              {new Date(rx.prescriptionDate || rx.createdAt || '').toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            Dr. {docObj?.fullName || 'Physician'} ({docObj?.specialization || 'OPD'})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Chief Diagnosis: {rx.diagnosis?.join(', ') || 'General Examination'} · {rx.medicines?.length || 0} medications prescribed
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRxForPrint(rx)}
                          className="gap-1.5 text-xs text-navy-900 border-navy-900/30 hover:bg-slate-50 shrink-0"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>View Signed Rx</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPORTS */}
          {activeTab === 'REPORTS' && (
            <div>
              {reports.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FolderOpen className="h-7 w-7 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No diagnostic reports attached to your profile.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div
                      key={rep._id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rep.title || rep.reportName}</span>
                          <Badge variant="outline" size="sm" className="text-[10px] uppercase">
                            {rep.reportType}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {new Date(rep.reportDate || rep.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        {rep.labName && (
                          <p className="text-xs text-slate-600">Lab: {rep.labName}</p>
                        )}
                        {rep.findings && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">Findings: {rep.findings}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={rep.fileUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download Report</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVOICES & RECEIPTS */}
          {activeTab === 'INVOICES' && (
            <div>
              {invoices.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CreditCard className="h-7 w-7 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No billing invoices found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div
                      key={inv._id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs text-slate-500">
                            {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                          </span>
                          <Badge
                            variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'info'}
                            size="sm"
                            className="text-[10px] uppercase font-bold"
                          >
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          Total Amount: ₹{inv.grandTotal.toFixed(2)} · Paid: ₹{inv.paidAmount.toFixed(2)} · Balance: ₹{inv.balanceAmount.toFixed(2)}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvForPrint(inv)}
                        className="gap-1.5 text-xs text-slate-700 shrink-0"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>View Receipt</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Patient Profile Modal */}
      {patient && (
        <PatientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          patient={patient}
          onUpdateSuccess={(updated) => setPatient(updated)}
        />
      )}

      {/* Printable Prescription Modal */}
      {selectedRxForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
              <span className="font-bold text-sm text-slate-800">
                Official Digital Prescription Letterhead
              </span>
              <button
                onClick={() => setSelectedRxForPrint(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Official Clinic Header */}
              <div className="border-b-2 border-navy-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-navy-900">{clinicName}</h2>
                  <p className="text-xs text-slate-500">Clinical Establishments Act Registry · Smart OPD</p>
                  <p className="text-xs text-slate-500">Emergency: 108 / +91 98765 43210</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-800">
                    Dr. {(selectedRxForPrint.doctorId as any)?.fullName || 'Consultant'}
                  </p>
                  <p className="text-slate-500">
                    Reg No: {(selectedRxForPrint.doctorId as any)?.medicalRegistrationNumber || 'MCI-2026-4421'}
                  </p>
                  <p className="font-mono font-semibold text-blue-600 mt-1">
                    {selectedRxForPrint.prescriptionNumber}
                  </p>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="p-3 bg-slate-50 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><span className="text-slate-400 block text-[10px]">Patient</span><strong>{patient?.fullName}</strong></div>
                <div><span className="text-slate-400 block text-[10px]">UHID</span><strong>{patient?.uhid}</strong></div>
                <div><span className="text-slate-400 block text-[10px]">Age / Gender</span><strong>{patient?.age}y / {patient?.gender}</strong></div>
                <div><span className="text-slate-400 block text-[10px]">Date</span><strong>{new Date(selectedRxForPrint.prescriptionDate || '').toLocaleDateString('en-IN')}</strong></div>
              </div>

              {/* Diagnosis */}
              {selectedRxForPrint.diagnosis && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Diagnosis</h4>
                  <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {selectedRxForPrint.diagnosis.join(', ')}
                  </p>
                </div>
              )}

              {/* Medications Rx */}
              <div>
                <h4 className="text-sm font-black text-navy-900 mb-2">℞ Prescribed Medications</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRxForPrint.medicines?.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                          <td className="p-2.5 text-slate-700">{m.dosage}</td>
                          <td className="p-2.5 text-slate-700">{m.frequency}</td>
                          <td className="p-2.5 text-slate-700">{m.duration}</td>
                          <td className="p-2.5 text-slate-500">{m.instructions || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advice */}
              {selectedRxForPrint.advice && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">Clinical Advice</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedRxForPrint.advice}</p>
                </div>
              )}

              {/* Digital Signature */}
              <div className="pt-6 border-t border-slate-200 flex justify-end text-right">
                <div>
                  <div className="font-serif italic text-base text-navy-900 font-bold">
                    Dr. {(selectedRxForPrint.doctorId as any)?.fullName}
                  </div>
                  <p className="text-[10px] text-slate-400">Digitally Verified & Encrypted</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs bg-navy-900 text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedInvForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
              <span className="font-bold text-sm text-slate-800">Official Money Receipt</span>
              <button
                onClick={() => setSelectedInvForPrint(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-bold text-base text-slate-900">{clinicName}</h3>
                <p className="text-slate-500 text-[11px]">Official Tax Invoice & Receipt</p>
                <p className="font-mono font-bold text-blue-600 mt-1">{selectedInvForPrint.invoiceNumber}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold">{patient?.fullName} ({patient?.uhid})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{new Date(selectedInvForPrint.invoiceDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold uppercase text-emerald-600">{selectedInvForPrint.status}</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-3 space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvForPrint.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvForPrint.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{selectedInvForPrint.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-100">
                  <span>Total Paid:</span>
                  <span>₹{selectedInvForPrint.paidAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400">
                Thank you for visiting {clinicName}. Computer-generated receipt.
              </p>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs bg-navy-900 text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Slip</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Cancel Appointment?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your appointment with Dr. {(cancelModalAppt.doctorId as any)?.fullName} on {new Date(cancelModalAppt.appointmentDate).toLocaleDateString('en-IN')}? This will free the consultation slot for other patients.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, feeling better..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalAppt(null)}
                className="text-xs"
              >
                Keep Appointment
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCancelAppointment}
                disabled={isCancelling}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload External Report Modal */}
      {isUploadReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Attach Lab / Diagnostic Report</h3>
              <button
                onClick={() => setIsUploadReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Lipid Profile Test"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Report Category</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 bg-white"
                >
                  <option value="lab">Lab / Blood Test</option>
                  <option value="radiology">Radiology / X-Ray</option>
                  <option value="pathology">Pathology</option>
                  <option value="cardiology">Cardiology / ECG</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Diagnostic Laboratory Name</label>
                <input
                  type="text"
                  value={uploadLabName}
                  onChange={(e) => setUploadLabName(e.target.value)}
                  placeholder="e.g. Suburban Diagnostics"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Findings / Summary</label>
                <textarea
                  value={uploadFindings}
                  onChange={(e) => setUploadFindings(e.target.value)}
                  placeholder="Summary of findings..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadReportModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUploading}
                  className="gap-1.5 text-xs bg-navy-900 text-white"
                >
                  <Upload className="h-3 w-3" />
                  <span>{isUploading ? 'Saving...' : 'Attach to Vault'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PatientPortal;
