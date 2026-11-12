import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Activity,
  Calendar,
  Clock,
  AlertTriangle,
  Upload,
  Search,
  ExternalLink,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus,
  Stethoscope,
  Printer,
  Pill,
  HeartPulse,
  Eye,
  X,
  FileCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { searchPatients, getPatient, PatientData } from '../../services/patientService';
import {
  getPatientTimeline,
  uploadReport,
  getPatientReports,
  deleteReport,
  createFollowUp,
  updateFollowUpStatus,
  PatientTimelineResponse,
  MedicalReportData,
  FollowUpData,
  TimelineEvent
} from '../../services/medicalRecordService';
import { getDoctors, DoctorData } from '../../services/clinicService';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

export const MedicalRecordsPage: React.FC = () => {
  const { id: routePatientId } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Selected Patient
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(routePatientId || '');
  const [timelineData, setTimelineData] = useState<PatientTimelineResponse | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'timeline' | 'reports' | 'followups'>('timeline');

  // Reports state
  const [reports, setReports] = useState<MedicalReportData[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    reportType: 'lab' as const,
    reportDate: new Date().toISOString().split('T')[0],
    fileUrl: '',
    labName: '',
    findings: '',
    isSharedWithPatient: true
  });

  // Follow-Up modal state
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [newFollowUp, setNewFollowUp] = useState({
    doctorId: '',
    followUpDate: '',
    reason: '',
    instructions: ''
  });

  // Prescription preview modal
  const [previewRx, setPreviewRx] = useState<any | null>(null);

  // Feedback alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load doctors for follow-up scheduling
  useEffect(() => {
    getDoctors().then(setDoctors).catch(console.error);
  }, []);

  // Set patient if user is PATIENT
  useEffect(() => {
    if (user?.role === 'PATIENT' && user.patientProfileId) {
      setSelectedPatientId(user.patientProfileId);
    } else if (routePatientId) {
      setSelectedPatientId(routePatientId);
    }
  }, [user, routePatientId]);

  // Load timeline data when selected patient changes
  useEffect(() => {
    if (!selectedPatientId) return;
    loadPatientRecords(selectedPatientId);
  }, [selectedPatientId]);

  const loadPatientRecords = async (patientId: string) => {
    setLoadingTimeline(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const [tl, reps] = await Promise.all([
        getPatientTimeline(patientId),
        getPatientReports(patientId, selectedReportType)
      ]);
      setTimelineData(tl);
      setReports(reps);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load patient records');
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Instant Debounced Patient Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPatients(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatientId(patient._id);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle Report Upload
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    if (!newReport.title.trim()) {
      alert('Report title is required');
      return;
    }

    setUploading(true);
    try {
      // Default sample file URL if empty
      const fileUrl = newReport.fileUrl.trim() || `https://example.com/reports/${Date.now()}_report.pdf`;
      await uploadReport(selectedPatientId, {
        ...newReport,
        fileUrl
      });
      setSuccessMsg('Diagnostic report uploaded and attached to patient EMR successfully!');
      setUploadModalOpen(false);
      setNewReport({
        title: '',
        reportType: 'lab',
        reportDate: new Date().toISOString().split('T')[0],
        fileUrl: '',
        labName: '',
        findings: '',
        isSharedWithPatient: true
      });
      loadPatientRecords(selectedPatientId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete Report
  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report? An audit log entry will be recorded.')) {
      return;
    }
    try {
      await deleteReport(id);
      setSuccessMsg('Report deleted successfully');
      if (selectedPatientId) loadPatientRecords(selectedPatientId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  // Handle Create Follow-Up
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    if (!newFollowUp.doctorId || !newFollowUp.followUpDate || !newFollowUp.reason) {
      alert('Please fill Doctor, Review Date, and Clinical Reason');
      return;
    }
    try {
      await createFollowUp({
        patientId: selectedPatientId,
        doctorId: newFollowUp.doctorId,
        followUpDate: newFollowUp.followUpDate,
        reason: newFollowUp.reason,
        instructions: newFollowUp.instructions
      });
      setSuccessMsg('Follow-up scheduled successfully!');
      setFollowUpModalOpen(false);
      setNewFollowUp({ doctorId: '', followUpDate: '', reason: '', instructions: '' });
      loadPatientRecords(selectedPatientId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule follow-up');
    }
  };

  // Handle Mark Follow-Up Completed
  const handleCompleteFollowUp = async (id: string) => {
    try {
      await updateFollowUpStatus(id, 'completed');
      setSuccessMsg('Follow-up marked as completed');
      if (selectedPatientId) loadPatientRecords(selectedPatientId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update follow-up');
    }
  };

  return (
    <div className="space-y-5">
      {/* Search Header for Staff / Doctor */}
      {user?.role !== 'PATIENT' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient by UHID (e.g. OPD-2611-00001), name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            {searching && (
              <div className="absolute right-3 top-2.5">
                <Spinner size="sm" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {searchResults.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => handleSelectPatient(p)}
                    className="p-3 hover:bg-primary-50 dark:hover:bg-primary-950/40 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
                        <span>{p.fullName}</span>
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {p.uhid}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {p.gender} • {p.age} yrs • Phone: {p.phone}
                      </p>
                    </div>
                    {p.allergies && p.allergies.length > 0 && (
                      <Badge variant="danger" size="sm">
                        Allergies: {p.allergies.length}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {successMsg && <Alert type="success">{successMsg}</Alert>}
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}

      {!selectedPatientId ? (
        <Card className="p-12 text-center text-gray-400">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No Patient Selected</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Search and select a patient above to view their unified longitudinal medical history, diagnostic reports, and digital prescriptions.
          </p>
        </Card>
      ) : loadingTimeline ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Retrieving patient longitudinal medical timeline...</p>
        </div>
      ) : timelineData ? (
        <div className="space-y-5">
          {/* Patient Profile Card & Critical Allergy Banner */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {timelineData.patient.fullName[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                      {timelineData.patient.fullName}
                    </h1>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-bold">
                      {timelineData.patient.uhid}
                    </span>
                    <Badge variant="info">{timelineData.patient.gender}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Age: {timelineData.patient.age || 'N/A'} yrs • Blood Group:{' '}
                    <strong className="text-red-600 font-bold">{timelineData.patient.bloodGroup || 'N/A'}</strong> •
                    Phone: {timelineData.patient.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center space-x-1"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Report</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setFollowUpModalOpen(true)}
                  className="flex items-center space-x-1"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Follow-Up</span>
                </Button>
              </div>
            </div>

            {/* CRITICAL ALLERGY ALERT BANNER */}
            {timelineData.patient.allergies && timelineData.patient.allergies.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-lg p-3 flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wide">
                    CRITICAL DRUG ALLERGY WARNING:
                  </span>{' '}
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                    {timelineData.patient.allergies.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Total OPD Visits</span>
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {timelineData.metrics.totalEncounters}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Finalized Prescriptions</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {timelineData.metrics.totalPrescriptions}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Diagnostic Reports</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {timelineData.metrics.totalReports}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Follow-Up Reviews</span>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {timelineData.metrics.totalFollowUps}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'timeline'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Longitudinal Timeline ({timelineData.timeline.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'reports'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Diagnostic Reports Vault ({reports.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'followups'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Follow-Up Reviews</span>
            </button>
          </div>

          {/* TAB 1: LONGITUDINAL CHRONOLOGICAL TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Vitals Trend Header if available */}
              {timelineData.vitalsTrend.length > 0 && (
                <Card>
                  <CardHeader className="py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                      <HeartPulse className="w-4 h-4 text-red-500" />
                      <span>Recent Vitals History</span>
                    </span>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                      {timelineData.vitalsTrend.slice(0, 3).map((vt, i) => (
                        <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700/40 rounded border border-gray-100 dark:border-gray-700">
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {vt.date ? new Date(vt.date).toLocaleDateString('en-IN') : 'Encounter'}
                          </span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            BP: {vt.bloodPressure || '--'}
                          </span>
                          <span className="text-gray-500 block">Pulse: {vt.pulseRate ? `${vt.pulseRate} bpm` : '--'}</span>
                          <span className="text-gray-500 block">BMI: {vt.bmi || '--'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chronological Vertical Feed */}
              {timelineData.timeline.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No longitudinal encounters recorded yet for this patient.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6 my-4">
                  {timelineData.timeline.map((event) => {
                    const isRx = event.type === 'PRESCRIPTION';
                    const isReport = event.type === 'DIAGNOSTIC_REPORT';
                    const isEncounter = event.type === 'ENCOUNTER';
                    const isFollowUp = event.type === 'FOLLOW_UP';

                    return (
                      <div key={event.id} className="relative group">
                        {/* Circle bullet on timeline */}
                        <div
                          className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                            isRx
                              ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950'
                              : isReport
                              ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950'
                              : isFollowUp
                              ? 'bg-amber-600 ring-4 ring-amber-100 dark:ring-amber-950'
                              : 'bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-950'
                          }`}
                        >
                          {isRx ? (
                            <Pill className="w-3.5 h-3.5" />
                          ) : isReport ? (
                            <FileCheck className="w-3.5 h-3.5" />
                          ) : isFollowUp ? (
                            <Calendar className="w-3.5 h-3.5" />
                          ) : (
                            <Stethoscope className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Event Card */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs hover:border-primary-400 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-gray-400">
                                {new Date(event.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <Badge
                                variant={
                                  isRx
                                    ? 'success'
                                    : isReport
                                    ? 'info'
                                    : isFollowUp
                                    ? 'warning'
                                    : 'default'
                                }
                                size="sm"
                              >
                                {event.badgeText}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{event.title}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            {event.summary}
                          </p>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end space-x-2">
                            {isRx && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewRx(event.data)}
                                className="flex items-center space-x-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Prescription Slip</span>
                              </Button>
                            )}

                            {isReport && (
                              <a
                                href={event.data.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                              >
                                <span>Open Diagnostic PDF</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIAGNOSTIC REPORTS VAULT */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'lab', 'radiology', 'pathology', 'cardiology', 'other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedReportType(t);
                        getPatientReports(selectedPatientId, t).then(setReports);
                      }}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                        selectedReportType === t
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>

                <Button size="sm" variant="primary" onClick={() => setUploadModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Upload Report
                </Button>
              </div>

              {/* Reports Grid */}
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No diagnostic reports uploaded under this category.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((rep) => (
                    <Card key={rep._id} className="hover:border-primary-400 transition-all flex flex-col justify-between">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                {rep.reportName || rep.title}
                              </h4>
                              <span className="text-[10px] text-gray-400">
                                {new Date(rep.reportDate).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <Badge variant="info" size="sm">
                            {rep.reportType.toUpperCase()}
                          </Badge>
                        </div>

                        {rep.labName && (
                          <div className="text-xs text-gray-500 flex items-center space-x-1">
                            <Building className="w-3.5 h-3.5" />
                            <span>{rep.labName}</span>
                          </div>
                        )}

                        {rep.findings && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                            {rep.findings}
                          </p>
                        )}

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                          <a
                            href={rep.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-primary-600 font-semibold hover:underline"
                          >
                            <span>View Document</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {user?.role !== 'PATIENT' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(rep._id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FOLLOW-UP REVIEWS TRACKER */}
          {activeTab === 'followups' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Scheduled Follow-Up Consultations
                </h3>
                <Button size="sm" variant="primary" onClick={() => setFollowUpModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Schedule Follow-Up
                </Button>
              </div>

              {timelineData.timeline.filter((e) => e.type === 'FOLLOW_UP').length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No scheduled follow-up consultations for this patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineData.timeline
                    .filter((e) => e.type === 'FOLLOW_UP')
                    .map((item) => {
                      const f = item.data;
                      const isCompleted = f.status === 'completed';
                      return (
                        <div
                          key={f._id}
                          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-primary-600" />
                              <span className="font-bold text-sm text-gray-900 dark:text-white">
                                Due Date: {new Date(f.followUpDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <Badge variant={isCompleted ? 'success' : 'warning'} size="sm">
                                {f.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              <strong>Reason:</strong> {f.reason}
                            </p>
                            {f.instructions && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                <strong>Instructions:</strong> {f.instructions}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteFollowUp(f._id)}
                                className="flex items-center space-x-1 text-emerald-600"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Done</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => navigate('/portal/book')}
                            >
                              Book Appointment
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* UPLOAD REPORT MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Upload className="w-5 h-5 text-primary-600" />
                <span>Upload Diagnostic Report</span>
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReport} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray PA View"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={newReport.reportType}
                    onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <option value="lab">Lab Report (Pathology)</option>
                    <option value="radiology">Radiology (X-Ray / CT / MRI)</option>
                    <option value="cardiology">Cardiology (ECG / Echo)</option>
                    <option value="pathology">Histopathology</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={newReport.reportDate}
                    onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Laboratory / Diagnostic Facility Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Diagnostics / In-house Pathology"
                  value={newReport.labName}
                  onChange={(e) => setNewReport({ ...newReport, labName: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Document File URL / Attachment
                </label>
                <input
                  type="text"
                  placeholder="https://... (or leave blank to generate sample secure PDF URL)"
                  value={newReport.fileUrl}
                  onChange={(e) => setNewReport({ ...newReport, fileUrl: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Key Findings / Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hemoglobin 13.8 g/dL, Platelets 2.5 lakhs, normal differential count"
                  value={newReport.findings}
                  onChange={(e) => setNewReport({ ...newReport, findings: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Save & Attach to EMR'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOW-UP MODAL */}
      {followUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>Schedule Follow-Up Review</span>
              </h3>
              <button onClick={() => setFollowUpModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Attending Doctor *
                </label>
                <select
                  required
                  value={newFollowUp.doctorId}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, doctorId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fullName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Follow-Up Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={newFollowUp.followUpDate}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, followUpDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Clinical Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blood pressure review, Post-fever recovery check"
                  value={newFollowUp.reason}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, reason: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Bring fasting blood sugar report, check BP diary..."
                  value={newFollowUp.instructions}
                  onChange={(e) => setNewFollowUp({ ...newFollowUp, instructions: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFollowUpModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Schedule Follow-Up
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRESCRIPTION PREVIEW MODAL */}
      {previewRx && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-800">Prescription #{previewRx.prescriptionNumber}</span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="primary" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreviewRx(null)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 text-xs">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="font-bold text-base text-primary-700">
                  {previewRx.doctorId?.fullName || 'Attending Physician'}
                </h3>
                <p className="text-gray-500">
                  {previewRx.doctorId?.specialization} • Reg No: {previewRx.doctorId?.medicalRegistrationNumber || 'NMC-REG'}
                </p>
                <p className="text-gray-400">
                  Date: {previewRx.prescriptionDate ? new Date(previewRx.prescriptionDate).toLocaleDateString('en-IN') : ''}
                </p>
              </div>

              {previewRx.vitals && (
                <div className="bg-gray-50 p-2 rounded flex flex-wrap gap-3">
                  <span><strong>BP:</strong> {previewRx.vitals.bloodPressure || '--'}</span>
                  <span><strong>Pulse:</strong> {previewRx.vitals.pulseRate || '--'} bpm</span>
                  <span><strong>Temp:</strong> {previewRx.vitals.temperatureF || '--'} °F</span>
                  <span><strong>BMI:</strong> {previewRx.vitals.bmi || '--'}</span>
                </div>
              )}

              {previewRx.diagnosis && (
                <div>
                  <strong>Diagnosis: </strong>
                  <span>{previewRx.diagnosis.join(', ')}</span>
                </div>
              )}

              {previewRx.medicines && previewRx.medicines.length > 0 && (
                <div>
                  <h4 className="font-bold text-primary-800 font-serif text-sm mb-1">℞ Prescribed Medicines:</h4>
                  <table className="w-full text-left border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1.5">Medicine</th>
                        <th className="p-1.5">Dosage</th>
                        <th className="p-1.5">Frequency</th>
                        <th className="p-1.5">Duration</th>
                        <th className="p-1.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRx.medicines.map((m: any, i: number) => (
                        <tr key={i}>
                          <td className="p-1.5 font-bold">{m.name}</td>
                          <td className="p-1.5">{m.dosage}</td>
                          <td className="p-1.5 font-mono text-primary-700 font-bold">{m.frequency}</td>
                          <td className="p-1.5">{m.duration}</td>
                          <td className="p-1.5 text-gray-500">{m.instructions || 'After food'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {previewRx.advice && (
                <div>
                  <strong>Advice: </strong>
                  <span>{previewRx.advice}</span>
                </div>
              )}

              {previewRx.digitalSignature && (
                <div className="pt-4 border-t border-gray-200 text-right text-[11px] text-gray-500 italic">
                  {previewRx.digitalSignature}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

