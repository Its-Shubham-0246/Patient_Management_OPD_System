import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  User,
  Clock,
  AlertTriangle,
  Activity,
  FileText,
  Pill,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Save,
  Phone,
  Calendar,
  ChevronRight,
  RefreshCw,
  Search,
  History,
  Check,
  X,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDoctorQueue, callNextToken, startConsultation, QueueEntryData } from '../../services/queueService';
import {
  savePrescription,
  getPrescriptionByVisit,
  getPatientPrescriptions,
  getFormularyCatalog,
  MedicineItem,
  Icd10Item,
  VitalsData,
  PrescriptionData
} from '../../services/prescriptionService';
import { getDoctors, DoctorData } from '../../services/clinicService';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

const QUICK_CHIEF_COMPLAINTS = [
  'Fever',
  'Cough',
  'Cold / Coryza',
  'Headache',
  'Sore Throat',
  'Abdominal Pain',
  'Nausea / Vomiting',
  'Body Ache',
  'Diarrhea',
  'Chest Tightness',
  'Dizziness',
  'Skin Rash'
];

const COMMON_LAB_TESTS = [
  'Complete Blood Count (CBC)',
  'Fasting Blood Sugar (FBS)',
  'Post-Prandial Blood Sugar (PPBS)',
  'HbA1c',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Urine Routine & Microscopic',
  'Thyroid Stimulating Hormone (TSH)',
  'Chest X-Ray (PA View)',
  '12-Lead ECG'
];

export const DoctorWorkspacePage: React.FC = () => {
  const { user } = useAuth();

  // State: Doctors & active Doctor
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [activeDoctor, setActiveDoctor] = useState<DoctorData | null>(null);

  // State: Queue
  const [queue, setQueue] = useState<QueueEntryData[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntryData | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [callingToken, setCallingToken] = useState(false);

  // State: Active Consultation Form
  const [activeTab, setActiveTab] = useState<'consultation' | 'history'>('consultation');
  const [vitals, setVitals] = useState<VitalsData>({
    weightKg: undefined,
    heightCm: undefined,
    bmi: undefined,
    bloodPressure: '',
    pulseRate: undefined,
    temperatureF: undefined,
    respiratoryRate: undefined,
    spo2Percent: undefined,
    bloodGlucose: undefined
  });
  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [customComplaint, setCustomComplaint] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [diagnosisList, setDiagnosisList] = useState<string[]>([]);
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [selectedIcd10, setSelectedIcd10] = useState<Icd10Item[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [labTests, setLabTests] = useState<string[]>([]);
  const [advice, setAdvice] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [followUpDays, setFollowUpDays] = useState<number | undefined>(undefined);
  const [followUpDate, setFollowUpDate] = useState<string>('');

  // Catalog / Autocomplete
  const [catalog, setCatalog] = useState<{ medications: MedicineItem[]; icd10: Icd10Item[] }>({
    medications: [],
    icd10: []
  });

  // State: Patient History
  const [patientPrescriptions, setPatientPrescriptions] = useState<PrescriptionData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Save / Print State
  const [saving, setSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printableRx, setPrintableRx] = useState<PrescriptionData | null>(null);

  // 1. Initial Load: Doctors list & Formulary Catalog
  useEffect(() => {
    const init = async () => {
      try {
        const [docs, cat] = await Promise.all([getDoctors(), getFormularyCatalog()]);
        setDoctors(docs);
        setCatalog(cat);

        // Preselect doctor if user is doctor
        if (user?.role === 'DOCTOR' && user.doctorProfileId) {
          setSelectedDoctorId(user.doctorProfileId);
          const currentDoc = docs.find((d) => d._id === user.doctorProfileId);
          if (currentDoc) setActiveDoctor(currentDoc);
        } else if (docs.length > 0) {
          setSelectedDoctorId(docs[0]._id);
          setActiveDoctor(docs[0]);
        }
      } catch (err) {
        console.error('Failed to load initial workspace data:', err);
      }
    };
    init();
  }, [user]);

  // 2. Fetch Queue when selected doctor changes
  const fetchQueue = async () => {
    if (!selectedDoctorId) return;
    setLoadingQueue(true);
    try {
      const q = await getDoctorQueue(selectedDoctorId);
      setQueue(q);

      // Auto-select patient currently CALLED or IN_CONSULTATION if no selection yet
      if (!selectedEntry && q.length > 0) {
        const active = q.find((e) => e.status === 'IN_CONSULTATION' || e.status === 'CALLED') || q[0];
        handleSelectEntry(active);
      } else if (selectedEntry) {
        // Refresh active entry status in-place
        const updated = q.find((e) => e._id === selectedEntry._id);
        if (updated) setSelectedEntry(updated);
      }
    } catch (err) {
      console.error('Failed to fetch doctor queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // Polling queue every 15s
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  // 3. Dynamic BMI Calculation
  useEffect(() => {
    if (vitals.weightKg && vitals.heightCm && vitals.heightCm > 0) {
      const heightM = vitals.heightCm / 100;
      const bmiVal = +(vitals.weightKg / (heightM * heightM)).toFixed(1);
      setVitals((prev) => ({ ...prev, bmi: bmiVal }));
    } else {
      setVitals((prev) => ({ ...prev, bmi: undefined }));
    }
  }, [vitals.weightKg, vitals.heightCm]);

  // 4. Select Patient Entry from Queue & Load Existing Consultation/Prescription
  const handleSelectEntry = async (entry: QueueEntryData) => {
    setSelectedEntry(entry);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    // Reset Form
    setVitals({
      weightKg: undefined,
      heightCm: undefined,
      bmi: undefined,
      bloodPressure: '',
      pulseRate: undefined,
      temperatureF: undefined,
      respiratoryRate: undefined,
      spo2Percent: undefined,
      bloodGlucose: undefined
    });
    setChiefComplaints([]);
    setClinicalObservations('');
    setDiagnosisList([]);
    setSelectedIcd10([]);
    setMedicines([]);
    setLabTests([]);
    setAdvice('');
    setDietaryRestrictions('');
    setFollowUpDays(undefined);
    setFollowUpDate('');

    // Fetch existing prescription if present
    if (entry.visitId?._id) {
      try {
        const existing = await getPrescriptionByVisit(entry.visitId._id);
        if (existing) {
          if (existing.vitals) setVitals(existing.vitals);
          if (existing.chiefComplaints) setChiefComplaints(existing.chiefComplaints);
          if (existing.clinicalObservations) setClinicalObservations(existing.clinicalObservations);
          if (existing.diagnosis) setDiagnosisList(existing.diagnosis);
          if (existing.icd10Codes) setSelectedIcd10(existing.icd10Codes);
          if (existing.medicines) setMedicines(existing.medicines);
          if (existing.labTests) setLabTests(existing.labTests);
          if (existing.advice) setAdvice(existing.advice);
          if (existing.dietaryRestrictions) setDietaryRestrictions(existing.dietaryRestrictions);
          if (existing.followUpDays) setFollowUpDays(existing.followUpDays);
          if (existing.followUpDate) setFollowUpDate(existing.followUpDate.split('T')[0]);
        }
      } catch (e) {
        console.error('Error fetching prescription for visit:', e);
      }
    }

    // Load Patient Longitudinal History
    if (entry.patientId?._id) {
      setLoadingHistory(true);
      try {
        const hist = await getPatientPrescriptions(entry.patientId._id);
        setPatientPrescriptions(hist);
      } catch (e) {
        console.error('Error fetching patient prescriptions history:', e);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  // 5. Call Next Token
  const handleCallNext = async () => {
    const nextWaiting = queue.find((e) => e.status === 'WAITING');
    if (!nextWaiting) {
      alert('No waiting patients in the queue right now.');
      return;
    }
    setCallingToken(true);
    try {
      const updated = await callNextToken(nextWaiting._id);
      await fetchQueue();
      handleSelectEntry(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to call token');
    } finally {
      setCallingToken(false);
    }
  };

  // 6. Start Consultation
  const handleStartConsultation = async () => {
    if (!selectedEntry) return;
    try {
      const updated = await startConsultation(selectedEntry._id);
      setSelectedEntry(updated);
      fetchQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start consultation');
    }
  };

  // 7. Add Medicine Row
  const handleAddMedicine = (template?: Partial<MedicineItem>) => {
    const newMed: MedicineItem = {
      name: template?.name || '',
      genericName: template?.genericName || '',
      dosage: template?.dosage || '1 tablet',
      form: (template?.form as any) || 'Tablet',
      frequency: template?.frequency || '1-0-1',
      duration: template?.duration || '5 days',
      instructions: template?.instructions || 'After food',
      quantity: template?.quantity || 10
    };
    setMedicines([...medicines, newMed]);
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicineItem, value: any) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // 8. Toggle Chief Complaint
  const handleToggleComplaint = (complaint: string) => {
    if (chiefComplaints.includes(complaint)) {
      setChiefComplaints(chiefComplaints.filter((c) => c !== complaint));
    } else {
      setChiefComplaints([...chiefComplaints, complaint]);
    }
  };

  const handleAddCustomComplaint = () => {
    if (customComplaint.trim() && !chiefComplaints.includes(customComplaint.trim())) {
      setChiefComplaints([...chiefComplaints, customComplaint.trim()]);
      setCustomComplaint('');
    }
  };

  // 9. Toggle ICD-10 Diagnosis
  const handleToggleIcd = (icd: Icd10Item) => {
    const exists = selectedIcd10.some((i) => i.code === icd.code);
    if (exists) {
      setSelectedIcd10(selectedIcd10.filter((i) => i.code !== icd.code));
      setDiagnosisList(diagnosisList.filter((d) => !d.startsWith(`[${icd.code}]`)));
    } else {
      setSelectedIcd10([...selectedIcd10, icd]);
      setDiagnosisList([...diagnosisList, `[${icd.code}] ${icd.description}`]);
    }
  };

  const handleAddCustomDiagnosis = () => {
    if (customDiagnosis.trim() && !diagnosisList.includes(customDiagnosis.trim())) {
      setDiagnosisList([...diagnosisList, customDiagnosis.trim()]);
      setCustomDiagnosis('');
    }
  };

  // 10. Toggle Lab Test
  const handleToggleLabTest = (test: string) => {
    if (labTests.includes(test)) {
      setLabTests(labTests.filter((t) => t !== test));
    } else {
      setLabTests([...labTests, test]);
    }
  };

  // 11. Follow-up Quick Days
  const handleQuickFollowUp = (days: number) => {
    setFollowUpDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  // 12. Save Draft or Finalize Consultation
  const handleSavePrescription = async (isFinalized: boolean) => {
    if (!selectedEntry || !selectedEntry.visitId?._id) {
      setSaveErrorMessage('No active patient visit record found');
      return;
    }

    if (isFinalized && medicines.length === 0 && !advice.trim() && diagnosisList.length === 0) {
      if (!confirm('No diagnosis or medications specified. Do you want to finalize this consultation?')) {
        return;
      }
    }

    setSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    try {
      const payload: Partial<PrescriptionData> = {
        vitals,
        chiefComplaints,
        clinicalObservations,
        diagnosis: diagnosisList,
        icd10Codes: selectedIcd10,
        medicines,
        labTests,
        advice,
        dietaryRestrictions,
        followUpDays,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        isFinalized
      };

      const result = await savePrescription(selectedEntry.visitId._id, payload);
      setPrintableRx(result);

      if (isFinalized) {
        setSaveSuccessMessage(`Consultation completed and Rx #${result.prescriptionNumber} digitally signed!`);
        await fetchQueue();
        setPrintModalOpen(true);
      } else {
        setSaveSuccessMessage(`Prescription draft saved successfully!`);
      }
    } catch (err: any) {
      setSaveErrorMessage(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  // BMI Status Badge Helper
  const getBmiBadge = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5) return <Badge variant="info">Underweight ({bmi})</Badge>;
    if (bmi <= 24.9) return <Badge variant="success">Normal ({bmi})</Badge>;
    if (bmi <= 29.9) return <Badge variant="warning">Overweight ({bmi})</Badge>;
    return <Badge variant="danger">Obese ({bmi})</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Doctor selector & Room Indicator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Doctor Consultation Desk</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeDoctor
                ? `${activeDoctor.fullName} | ${activeDoctor.specialization} (${activeDoctor.roomNumber})`
                : 'Select Doctor Roster'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {user?.role === 'ADMIN' && (
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                const d = doctors.find((doc) => doc._id === e.target.value);
                if (d) setActiveDoctor(d);
              }}
              className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName} ({d.specialization})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="primary"
            onClick={handleCallNext}
            disabled={callingToken || queue.filter((e) => e.status === 'WAITING').length === 0}
            className="flex items-center space-x-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Call Next Token</span>
          </Button>

          <Button variant="outline" size="sm" onClick={fetchQueue} title="Refresh Queue">
            <RefreshCw className={`w-4 h-4 ${loadingQueue ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Today's OPD Waiting Queue (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-700 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-600" />
                <span>Today's Queue ({queue.length})</span>
              </CardTitle>
              <div className="flex items-center space-x-1">
                <Badge variant="warning">{queue.filter((q) => q.status === 'WAITING').length} Waiting</Badge>
                <Badge variant="success">{queue.filter((q) => q.status === 'COMPLETED').length} Done</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2 divide-y divide-gray-100 dark:divide-gray-800 max-h-[calc(100vh-230px)] overflow-y-auto">
              {queue.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No patients in today's queue for this doctor.
                </div>
              ) : (
                queue.map((entry) => {
                  const isSelected = selectedEntry?._id === entry._id;
                  const isEmergency = entry.isEmergency;
                  const isCalled = entry.status === 'CALLED';
                  const isInConsultation = entry.status === 'IN_CONSULTATION';
                  const isDone = entry.status === 'COMPLETED';

                  return (
                    <div
                      key={entry._id}
                      onClick={() => handleSelectEntry(entry)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-l-4 border-primary-600 shadow-sm'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded ${
                              isEmergency
                                ? 'bg-red-600 text-white animate-pulse'
                                : isCalled || isInConsultation
                                ? 'bg-amber-500 text-white'
                                : isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            #{entry.tokenNumber}
                          </span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {entry.patientId?.fullName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            isDone
                              ? 'success'
                              : isInConsultation
                              ? 'info'
                              : isCalled
                              ? 'warning'
                              : isEmergency
                              ? 'danger'
                              : 'default'
                          }
                          size="sm"
                        >
                          {entry.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pl-8">
                        <span>{entry.patientId?.uhid}</span>
                        <span>
                          {entry.patientId?.gender?.[0]} / {entry.patientId?.age || '--'} yrs
                        </span>
                      </div>

                      {entry.patientId?.allergies && entry.patientId.allergies.length > 0 && (
                        <div className="mt-1.5 pl-8 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] font-medium text-red-600 dark:text-red-400 truncate">
                            Allergies: {entry.patientId.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Clinical Consultation Desk & e-Rx Builder (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedEntry ? (
            <Card className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
              <Stethoscope className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No Patient Selected</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Select a patient from the queue or click "Call Next Token" to begin consultation and issue digital prescriptions.
              </p>
            </Card>
          ) : (
            <>
              {/* Patient Banner with Demographics & Critical Allergy Alert */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 font-bold">
                      {selectedEntry.patientId?.fullName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">
                          {selectedEntry.patientId?.fullName}
                        </h2>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono px-2 py-0.5 rounded">
                          {selectedEntry.patientId?.uhid}
                        </span>
                        <span className="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold px-2 py-0.5 rounded">
                          Token #{selectedEntry.tokenNumber}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedEntry.patientId?.age} yrs • {selectedEntry.patientId?.gender} • Blood Group:{' '}
                        {selectedEntry.patientId?.bloodGroup || 'N/A'} • Phone: {selectedEntry.patientId?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedEntry.status === 'CALLED' && (
                      <Button size="sm" variant="primary" onClick={handleStartConsultation}>
                        Start In-Consultation
                      </Button>
                    )}
                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
                      <button
                        onClick={() => setActiveTab('consultation')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          activeTab === 'consultation'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Prescription Builder
                      </button>
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
                          activeTab === 'history'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <History className="w-3 h-3" />
                        <span>Past History ({patientPrescriptions.length})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* CRITICAL DRUG ALLERGY WARNING BANNER */}
                {selectedEntry.patientId?.allergies && selectedEntry.patientId.allergies.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-lg p-2.5 flex items-center space-x-2.5 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wide">
                        Critical Allergy Alert:
                      </span>{' '}
                      <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                        {selectedEntry.patientId.allergies.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Success / Error Alerts */}
                {saveSuccessMessage && (
                  <Alert type="success">
                    {saveSuccessMessage}
                  </Alert>
                )}
                {saveErrorMessage && (
                  <Alert type="error">
                    {saveErrorMessage}
                  </Alert>
                )}
              </div>

              {/* TAB 1: ACTIVE CONSULTATION & PRESCRIPTION BUILDER */}
              {activeTab === 'consultation' && (
                <div className="space-y-4">
                  {/* 1. Vitals Card */}
                  <Card>
                    <CardHeader className="py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex flex-row items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 text-primary-600" />
                        <span>Patient Vitals</span>
                      </span>
                      {getBmiBadge(vitals.bmi)}
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">BP (mmHg)</label>
                          <input
                            type="text"
                            placeholder="120/80"
                            value={vitals.bloodPressure || ''}
                            onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">Pulse (bpm)</label>
                          <input
                            type="number"
                            placeholder="72"
                            value={vitals.pulseRate ?? ''}
                            onChange={(e) => setVitals({ ...vitals, pulseRate: Number(e.target.value) || undefined })}
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">Temp (°F)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="98.6"
                            value={vitals.temperatureF ?? ''}
                            onChange={(e) => setVitals({ ...vitals, temperatureF: Number(e.target.value) || undefined })}
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">SpO2 (%)</label>
                          <input
                            type="number"
                            placeholder="99"
                            value={vitals.spo2Percent ?? ''}
                            onChange={(e) => setVitals({ ...vitals, spo2Percent: Number(e.target.value) || undefined })}
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            placeholder="70"
                            value={vitals.weightKg ?? ''}
                            onChange={(e) => setVitals({ ...vitals, weightKg: Number(e.target.value) || undefined })}
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">Height (cm)</label>
                          <input
                            type="number"
                            placeholder="172"
                            value={vitals.heightCm ?? ''}
                            onChange={(e) => setVitals({ ...vitals, heightCm: Number(e.target.value) || undefined })}
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 2. Chief Complaints & Examination */}
                  <Card>
                    <CardHeader className="py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Chief Complaints & Examination
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {QUICK_CHIEF_COMPLAINTS.map((comp) => {
                            const isSelected = chiefComplaints.includes(comp);
                            return (
                              <button
                                key={comp}
                                type="button"
                                onClick={() => handleToggleComplaint(comp)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {comp}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add other complaint..."
                            value={customComplaint}
                            onChange={(e) => setCustomComplaint(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomComplaint())}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                          <Button size="sm" variant="outline" onClick={handleAddCustomComplaint}>
                            Add
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-500 font-medium block mb-1">
                          Clinical Observations / System Examination
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Chest clear, P/A soft, heart sounds normal, throat congested..."
                          value={clinicalObservations}
                          onChange={(e) => setClinicalObservations(e.target.value)}
                          className="w-full text-xs p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. Diagnosis & ICD-10 */}
                  <Card>
                    <CardHeader className="py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Provisional / Final Diagnosis
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-500 font-medium block mb-1.5">Common ICD-10 Codes:</span>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {catalog.icd10.map((icd) => {
                            const isSelected = selectedIcd10.some((i) => i.code === icd.code);
                            return (
                              <button
                                key={icd.code}
                                type="button"
                                onClick={() => handleToggleIcd(icd)}
                                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                                }`}
                              >
                                {isSelected ? '✓ ' : ''}
                                {icd.code} - {icd.description.slice(0, 30)}...
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add custom diagnosis..."
                            value={customDiagnosis}
                            onChange={(e) => setCustomDiagnosis(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomDiagnosis())}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                          <Button size="sm" variant="outline" onClick={handleAddCustomDiagnosis}>
                            Add
                          </Button>
                        </div>

                        {diagnosisList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {diagnosisList.map((diag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded"
                              >
                                <span>{diag}</span>
                                <button
                                  type="button"
                                  onClick={() => setDiagnosisList(diagnosisList.filter((_, i) => i !== idx))}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4. Rx Digital Medications */}
                  <Card>
                    <CardHeader className="py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex flex-row items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                        <Pill className="w-3.5 h-3.5 text-primary-600" />
                        <span>Rx Prescribed Medicines ({medicines.length})</span>
                      </span>
                      <Button size="sm" variant="outline" onClick={() => handleAddMedicine()}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Medicine
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      {/* Common Medication Presets */}
                      <div>
                        <span className="text-[10px] text-gray-500 font-medium block mb-1">
                          Quick Presets from Formulary:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {catalog.medications.slice(0, 8).map((m, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddMedicine(m)}
                              className="text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                            >
                              + {m.name} ({m.dosage})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Medicines List Table */}
                      {medicines.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 text-xs">
                          No medications added yet. Click "+ Add Medicine" or choose a quick preset above.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {medicines.map((med, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
                            >
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-12 sm:col-span-5">
                                  <input
                                    type="text"
                                    placeholder="Medicine Name (e.g. Paracetamol)"
                                    value={med.name}
                                    onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                                    className="w-full text-xs font-semibold px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                  />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                  <select
                                    value={med.form}
                                    onChange={(e) => handleUpdateMedicine(idx, 'form', e.target.value)}
                                    className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                  >
                                    <option value="Tablet">Tablet</option>
                                    <option value="Syrup">Syrup</option>
                                    <option value="Capsule">Capsule</option>
                                    <option value="Injection">Injection</option>
                                    <option value="Drops">Drops</option>
                                    <option value="Ointment">Ointment</option>
                                    <option value="Inhaler">Inhaler</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                  <input
                                    type="text"
                                    placeholder="Dosage (500mg)"
                                    value={med.dosage}
                                    onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                                    className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                  />
                                </div>
                                <div className="col-span-3 sm:col-span-2">
                                  <input
                                    type="text"
                                    placeholder="Duration (5d)"
                                    value={med.duration}
                                    onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                                    className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                  />
                                </div>
                                <div className="col-span-1 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedicine(idx)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete medicine"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-gray-100 dark:border-gray-700">
                                <div className="col-span-6 sm:col-span-3">
                                  <div className="flex gap-1">
                                    {['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS'].map((freq) => (
                                      <button
                                        key={freq}
                                        type="button"
                                        onClick={() => handleUpdateMedicine(idx, 'frequency', freq)}
                                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          med.frequency === freq
                                            ? 'bg-primary-600 text-white font-bold'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                      >
                                        {freq}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="col-span-6 sm:col-span-9">
                                  <input
                                    type="text"
                                    placeholder="Instructions (e.g. After food with warm water)"
                                    value={med.instructions || ''}
                                    onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                                    className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 5. Investigations & Advice */}
                  <Card>
                    <CardHeader className="py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Investigations, Advice & Follow-Up
                      </span>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-500 font-medium block mb-1">
                          Ordered Investigations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_LAB_TESTS.map((test) => {
                            const isSelected = labTests.includes(test);
                            return (
                              <button
                                key={test}
                                type="button"
                                onClick={() => handleToggleLabTest(test)}
                                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {test}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium block mb-1">
                            General Advice & Lifestyle
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Adequate hydration, bed rest for 2 days, avoid spicy/oily food..."
                            value={advice}
                            onChange={(e) => setAdvice(e.target.value)}
                            className="w-full text-xs p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium block mb-1">
                            Dietary Restrictions
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Low salt diet, sugar restriction, high fiber intake..."
                            value={dietaryRestrictions}
                            onChange={(e) => setDietaryRestrictions(e.target.value)}
                            className="w-full text-xs p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                      </div>

                      {/* Follow-up Planning */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Follow-Up Review:
                          </span>
                          <div className="flex gap-1">
                            {[3, 5, 7, 14, 30].map((days) => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => handleQuickFollowUp(days)}
                                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                                  followUpDays === days
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                +{days}d
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions Bar */}
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSavePrescription(false)}
                      disabled={saving}
                      className="flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save as Draft</span>
                    </Button>

                    <div className="flex items-center space-x-2">
                      {printableRx && (
                        <Button
                          variant="outline"
                          onClick={() => setPrintModalOpen(true)}
                          className="flex items-center space-x-1.5"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Prescription</span>
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        onClick={() => handleSavePrescription(true)}
                        disabled={saving}
                        className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finalize & Sign Consultation</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LONGITUDINAL EMR & PAST VISITS */}
              {activeTab === 'history' && (
                <Card>
                  <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                      <History className="w-4 h-4 text-primary-600" />
                      <span>Longitudinal Medical Records & Past Prescriptions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {loadingHistory ? (
                      <div className="py-8 text-center text-gray-400">
                        <Spinner size="md" />
                        <p className="text-xs mt-2">Loading medical history...</p>
                      </div>
                    ) : patientPrescriptions.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs">
                        No previous finalized prescriptions found for this patient.
                      </div>
                    ) : (
                      patientPrescriptions.map((rx) => (
                        <div
                          key={rx._id}
                          className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-300">
                                {rx.prescriptionNumber}
                              </span>
                              <span className="text-xs text-gray-500">
                                {rx.prescriptionDate ? new Date(rx.prescriptionDate).toLocaleDateString() : ''}
                              </span>
                              <Badge variant="success" size="sm">
                                Finalized
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                              {rx.doctorId?.fullName} ({rx.doctorId?.specialization})
                            </span>
                          </div>

                          {rx.diagnosis && rx.diagnosis.length > 0 && (
                            <div className="text-xs">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Diagnosis: </span>
                              <span className="text-gray-600 dark:text-gray-400">{rx.diagnosis.join(', ')}</span>
                            </div>
                          )}

                          {rx.medicines && rx.medicines.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Prescribed Medicines:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {rx.medicines.map((m, i) => (
                                  <div
                                    key={i}
                                    className="text-xs bg-white dark:bg-gray-700 p-1.5 rounded border border-gray-100 dark:border-gray-600"
                                  >
                                    <span className="font-bold text-gray-900 dark:text-white">{m.name}</span>{' '}
                                    <span className="text-gray-500">({m.dosage})</span> -{' '}
                                    <span className="font-mono text-primary-600">{m.frequency}</span> for {m.duration}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {rx.advice && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-semibold">Advice: </span>
                              {rx.advice}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* PRINTABLE OFFICIAL PRESCRIPTION MODAL */}
      {printModalOpen && printableRx && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            {/* Action Bar (Not Printed) */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 print:hidden">
              <span className="text-sm font-bold text-gray-800">Print Preview: Official Digital Prescription</span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="primary" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" />
                  Print A4
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPrintModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            {/* A4 Letterhead Body */}
            <div className="space-y-4 print:p-0">
              {/* Clinic Header */}
              <div className="flex justify-between items-start border-b-2 border-primary-600 pb-3">
                <div>
                  <h2 className="text-xl font-black text-primary-700 uppercase tracking-wide">
                    {printableRx.clinicId?.clinicName || 'Smart OPD Healthcare Center'}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {printableRx.clinicId?.address?.line1 || 'Main Healthcare Avenue, City Center'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Phone: {printableRx.clinicId?.phone || '+91 98765 43210'} | Email: contact@smartopd.com
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-gray-900">
                    {printableRx.doctorId?.fullName || 'Attending Physician'}
                  </h3>
                  <p className="text-xs text-gray-600">{printableRx.doctorId?.specialization || 'General Physician'}</p>
                  <p className="text-xs font-mono text-gray-500">
                    Reg No: {printableRx.doctorId?.medicalRegistrationNumber || 'NMC-REG-2024'}
                  </p>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">UHID:</span>{' '}
                  <span className="font-bold">{printableRx.patientId?.uhid}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Name:</span>{' '}
                  <span className="font-bold">{printableRx.patientId?.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Age/Sex:</span>{' '}
                  <span>
                    {printableRx.patientId?.age} yrs / {printableRx.patientId?.gender}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Date:</span>{' '}
                  <span>{new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Vitals & Complaints */}
              {printableRx.vitals && (
                <div className="text-xs flex flex-wrap gap-4 p-2 bg-gray-50/50 rounded border border-gray-100">
                  {printableRx.vitals.bloodPressure && (
                    <span>
                      <strong className="text-gray-500">BP:</strong> {printableRx.vitals.bloodPressure}
                    </span>
                  )}
                  {printableRx.vitals.pulseRate && (
                    <span>
                      <strong className="text-gray-500">Pulse:</strong> {printableRx.vitals.pulseRate} bpm
                    </span>
                  )}
                  {printableRx.vitals.temperatureF && (
                    <span>
                      <strong className="text-gray-500">Temp:</strong> {printableRx.vitals.temperatureF} °F
                    </span>
                  )}
                  {printableRx.vitals.weightKg && (
                    <span>
                      <strong className="text-gray-500">Weight:</strong> {printableRx.vitals.weightKg} kg
                    </span>
                  )}
                  {printableRx.vitals.bmi && (
                    <span>
                      <strong className="text-gray-500">BMI:</strong> {printableRx.vitals.bmi}
                    </span>
                  )}
                </div>
              )}

              {/* Diagnosis */}
              {printableRx.diagnosis && printableRx.diagnosis.length > 0 && (
                <div className="text-xs">
                  <span className="font-bold text-gray-800">Diagnosis: </span>
                  <span>{printableRx.diagnosis.join(', ')}</span>
                </div>
              )}

              {/* Rx Medicines Table */}
              <div>
                <div className="text-base font-serif font-black text-primary-800 mb-1">℞</div>
                <table className="w-full text-xs text-left border border-gray-200">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Medicine & Dosage</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {printableRx.medicines.map((m, i) => (
                      <tr key={i}>
                        <td className="p-2 text-gray-400">{i + 1}</td>
                        <td className="p-2 font-bold">
                          {m.name} <span className="font-normal text-gray-600">({m.dosage})</span>
                        </td>
                        <td className="p-2 font-mono font-bold text-primary-700">{m.frequency}</td>
                        <td className="p-2">{m.duration}</td>
                        <td className="p-2 text-gray-600">{m.instructions || 'After food'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Investigations & Advice */}
              {printableRx.labTests && printableRx.labTests.length > 0 && (
                <div className="text-xs">
                  <span className="font-bold text-gray-800">Investigations Ordered: </span>
                  <span>{printableRx.labTests.join(', ')}</span>
                </div>
              )}

              {printableRx.advice && (
                <div className="text-xs">
                  <span className="font-bold text-gray-800">Advice: </span>
                  <span>{printableRx.advice}</span>
                </div>
              )}

              {printableRx.followUpDate && (
                <div className="text-xs text-primary-700 font-semibold">
                  Follow-Up Review: {new Date(printableRx.followUpDate).toLocaleDateString('en-IN')}
                </div>
              )}

              {/* Doctor Digital Signature Block */}
              <div className="pt-8 flex justify-between items-end border-t border-gray-200 text-xs">
                <div className="text-[10px] text-gray-400">
                  Prescription #{printableRx.prescriptionNumber}
                  <br />
                  Generated via Smart OPD Clinic Suite
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-primary-800 font-bold mb-1">
                    {printableRx.doctorId?.fullName}
                  </div>
                  <div className="text-[10px] text-gray-500 border-t border-gray-300 pt-1">
                    Electronically Signed & Authenticated
                    <br />
                    Reg No: {printableRx.doctorId?.medicalRegistrationNumber || 'NMC-REG-2024'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
