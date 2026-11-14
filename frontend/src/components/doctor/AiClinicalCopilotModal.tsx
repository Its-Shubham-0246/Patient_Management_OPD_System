import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  History,
  Pill,
  FileText,
  Copy,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  aiService,
  SoapDraftResponse,
  LongitudinalSummaryResponse,
  DrugSafetyCheckResponse
} from '../../services/aiService';
import { MedicineItem } from '../../services/prescriptionService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';

export interface AiClinicalCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: any;
  vitals?: any;
  currentMedicines?: MedicineItem[];
  onApplySoapDraft: (draft: SoapDraftResponse) => void;
}

const SAMPLE_DICTATIONS = [
  {
    title: 'Acute Migraine Case',
    text: 'Patient 38F presents with severe throbbing unilateral headache since yesterday with nausea and photophobia. No fever, no neck stiffness. BP is 125/82, pulse 76. Suspect migraine without aura. Advise dark room rest, hydration, oral analgesics, and follow up in 5 days if not settled.'
  },
  {
    title: 'Viral URTI & Fever',
    text: 'Patient 28M complaints of acute fever for 3 days with dry cough, sore throat, and nasal congestion. Temp 100.4F, SpO2 99%, chest clear. Suggesting viral upper respiratory tract infection. Recommend steam inhalation, saline gargles, antipyretics, and review in 4 days.'
  },
  {
    title: 'Type 2 Diabetes Review',
    text: 'Patient 54M known diabetic for 5 years on Metformin. Reports mild polyuria and generalized fatigue for 2 weeks. Random blood sugar 195 mg/dL, BP 140/90. Advise HbA1c, fasting glucose, dietary carbohydrate restriction, exercise, and follow up in 10 days.'
  }
];

export const AiClinicalCopilotModal: React.FC<AiClinicalCopilotModalProps> = ({
  isOpen,
  onClose,
  patient,
  vitals,
  currentMedicines = [],
  onApplySoapDraft
}) => {
  const [activeTab, setActiveTab] = useState<'soap' | 'summary' | 'safety'>('soap');

  // Tab 1: SOAP Structuring State
  const [dictationText, setDictationText] = useState('');
  const [loadingSoap, setLoadingSoap] = useState(false);
  const [soapDraft, setSoapDraft] = useState<SoapDraftResponse | null>(null);
  const [soapError, setSoapError] = useState<string | null>(null);
  const [isEdited, setIsEdited] = useState(false);

  // Tab 2: Longitudinal Summary State
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [historySummary, setHistorySummary] = useState<LongitudinalSummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Tab 3: Drug Safety State
  const [loadingSafety, setLoadingSafety] = useState(false);
  const [safetyResult, setSafetyResult] = useState<DrugSafetyCheckResponse | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'safety' && currentMedicines.length > 0) {
      runSafetyCheck();
    }
  }, [isOpen, activeTab, currentMedicines]);

  if (!isOpen) return null;

  // Handle SOAP generation
  const handleGenerateSoap = async (customPrompt?: string) => {
    const textToProcess = customPrompt || dictationText;
    if (!textToProcess.trim()) {
      setSoapError('Please type or select a clinical dictation snippet');
      return;
    }

    setLoadingSoap(true);
    setSoapError(null);
    try {
      const res = await aiService.structureSoapNotes({
        rawNotes: textToProcess,
        age: patient?.age,
        gender: patient?.gender,
        vitals,
        patientId: patient?._id
      });
      setSoapDraft(res);
      setIsEdited(false);
    } catch (err: any) {
      setSoapError(err.response?.data?.error?.message || 'Failed to structure SOAP notes');
    } finally {
      setLoadingSoap(false);
    }
  };

  // Accept and insert draft into doctor form
  const handleAcceptSoap = async () => {
    if (!soapDraft) return;

    try {
      // Record HITL acceptance audit event
      await aiService.recordAuditAccept({
        action: 'ACCEPTED',
        feature: 'DICTATION_TO_SOAP',
        patientId: patient?._id,
        doctorEditedBeforeSave: isEdited,
        notes: `Accepted primary impression: ${soapDraft.assessment.primaryImpression}`
      });
    } catch (e) {
      console.warn('Audit record error:', e);
    }

    onApplySoapDraft(soapDraft);
    onClose();
  };

  // Discard draft
  const handleDiscardSoap = async () => {
    if (soapDraft) {
      try {
        await aiService.recordAuditAccept({
          action: 'DISCARDED',
          feature: 'DICTATION_TO_SOAP',
          patientId: patient?._id,
          notes: 'Doctor discarded AI suggestion'
        });
      } catch (e) {
        console.warn('Audit record error:', e);
      }
    }
    setSoapDraft(null);
  };

  // Fetch Longitudinal Summary
  const handleFetchSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await aiService.summarizeHistory({
        patientId: patient?._id,
        age: patient?.age,
        gender: patient?.gender,
        chronicConditions: patient?.chronicConditions,
        allergies: patient?.allergies
      });
      setHistorySummary(res);
    } catch (err: any) {
      setSummaryError(err.response?.data?.error?.message || 'Failed to generate longitudinal summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Run Drug Interaction Check
  const runSafetyCheck = async () => {
    setLoadingSafety(true);
    try {
      const res = await aiService.checkDrugInteractions({
        medications: currentMedicines.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency })),
        allergies: patient?.allergies,
        chronicConditions: patient?.chronicConditions,
        patientId: patient?._id
      });
      setSafetyResult(res);
    } catch (err: any) {
      console.error('Safety check failed:', err);
    } finally {
      setLoadingSafety(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-navy-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-wide">Clinical AI Co-Pilot</h3>
                <Badge variant="outline" className="text-[10px] bg-indigo-900/80 text-indigo-200 border-indigo-700">
                  Non-Autonomous · HITL
                </Badge>
              </div>
              <p className="text-xs text-indigo-200/80">
                Cognitive assistant for registered medical practitioners · DPDP Act 2023 Compliant De-identification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('soap')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'soap'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-md'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Voice / Text Dictation to SOAP
          </button>
          <button
            onClick={() => {
              setActiveTab('summary');
              if (!historySummary && patient) handleFetchSummary();
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-md'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Longitudinal EMR Summary
          </button>
          <button
            onClick={() => {
              setActiveTab('safety');
              runSafetyCheck();
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'safety'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-md'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Drug Safety & Allergy Screen
            {currentMedicines.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                {currentMedicines.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* TAB 1: SOAP STRUCTURING */}
          {activeTab === 'soap' && (
            <div className="space-y-4">
              {/* Quick Sample Selector */}
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Insert Sample Clinical Dictation or Paste Dictation:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_DICTATIONS.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => {
                        setDictationText(s.text);
                        handleGenerateSoap(s.text);
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dictation Textarea */}
              <div>
                <textarea
                  value={dictationText}
                  onChange={(e) => setDictationText(e.target.value)}
                  placeholder="e.g. 45M complains of dry cough and low grade fever for 4 days, BP 130/85, no wheezing, advise chest X-ray and symptomatic cough syrup..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11px] text-slate-400">
                    {dictationText.length} characters · PII will be de-identified automatically
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateSoap()}
                    disabled={loadingSoap || !dictationText.trim()}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loadingSoap ? (
                      <>
                        <Spinner size="sm" />
                        Structuring SOAP...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Structured SOAP
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {soapError && (
                <Alert type="error">
                  {soapError}
                </Alert>
              )}

              {/* Structured Output in Distinct UI Safeguard (Blue Dashed Border & AI Draft Badge) */}
              {soapDraft && (
                <div className="p-4 rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/40 space-y-4">
                  {/* Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-200">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-xs font-bold uppercase tracking-wider">
                        AI Draft · Subject to Doctor Approval
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Confidence: {(soapDraft.metadata.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDiscardSoap}
                        className="text-xs text-red-600 hover:bg-red-50"
                      >
                        Discard
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAcceptSoap}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept & Insert to Form
                      </Button>
                    </div>
                  </div>

                  {/* 4 Quadrants of SOAP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* S: Subjective */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-2">
                        <span>[S] Subjective</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-1.5">
                        <div>
                          <strong className="text-slate-900">Chief Complaints:</strong>
                          <ul className="list-disc pl-4 mt-0.5">
                            {soapDraft.subjective.chiefComplaints.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-1">
                          <strong className="text-slate-900">History of Present Illness (HPI):</strong>
                          <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                            {soapDraft.subjective.historyOfPresentIllness}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* O: Objective */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-2">
                        <span>[O] Objective</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-2">
                        <div>
                          <strong className="text-slate-900">Observed Vitals:</strong>
                          <p className="text-slate-600 mt-0.5 text-[11px]">
                            {soapDraft.objective.observedVitalsSummary}
                          </p>
                        </div>
                        <div>
                          <strong className="text-slate-900">Physical Examination:</strong>
                          <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                            {soapDraft.objective.physicalExamination}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* A: Assessment */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-2">
                        <span>[A] Assessment</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-2">
                        <div>
                          <strong className="text-slate-900">Primary Impression:</strong>
                          <span className="ml-1 font-semibold text-indigo-900">
                            {soapDraft.assessment.primaryImpression}
                          </span>
                        </div>
                        <div>
                          <strong className="text-slate-900">Differential Diagnoses & ICD-10 Hints:</strong>
                          <div className="space-y-1.5 mt-1">
                            {soapDraft.assessment.differentialDiagnosisSuggestions.map((d, i) => (
                              <div key={i} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                                <div className="flex items-center justify-between font-semibold text-slate-800">
                                  <span>{d.condition}</span>
                                  <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">
                                    {d.icd10Hint}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{d.reasoning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* P: Plan */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-2">
                        <span>[P] Plan</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-2">
                        {soapDraft.plan.suggestedInvestigations.length > 0 && (
                          <div>
                            <strong className="text-slate-900">Suggested Investigations:</strong>
                            <ul className="list-disc pl-4 mt-0.5 text-[11px] text-slate-600">
                              {soapDraft.plan.suggestedInvestigations.map((inv, i) => (
                                <li key={i}>{inv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <strong className="text-slate-900">Non-Pharmacological Advice:</strong>
                          <ul className="list-disc pl-4 mt-0.5 text-[11px] text-slate-600">
                            {soapDraft.plan.nonPharmacologicalAdvice.map((adv, i) => (
                              <li key={i}>{adv}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-900">Follow-Up:</strong>
                          <p className="text-slate-600 text-[11px] mt-0.5">
                            {soapDraft.plan.followUpRecommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal / Medical Governance Footer */}
                  <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      {soapDraft.metadata.disclaimer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LONGITUDINAL SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Longitudinal EMR Briefing: {patient?.fullName || 'Current Patient'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Synthesizes past consultations, chronic history, and active medications
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchSummary}
                  disabled={loadingSummary}
                  className="flex items-center gap-1 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                  Refresh Summary
                </Button>
              </div>

              {loadingSummary ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-2">
                  <Spinner size="md" />
                  <span className="text-xs text-slate-500">Aggregating patient EMR records...</span>
                </div>
              ) : summaryError ? (
                <Alert type="error">{summaryError}</Alert>
              ) : historySummary ? (
                <div className="space-y-4">
                  {/* Executive Briefing Card */}
                  <div className="p-4 bg-navy-50/60 rounded-xl border border-navy-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-900 block mb-1">
                      Physician 3-Sentence Executive Briefing
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {historySummary.briefSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Chronic Conditions */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-1.5">
                        Identified Chronic Conditions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {historySummary.keyChronicConditions.length > 0 ? (
                          historySummary.keyChronicConditions.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No chronic diseases on file</span>
                        )}
                      </div>
                    </div>

                    {/* Active Medications */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-1.5">
                        Active Regimens / Recent Medications
                      </span>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                        {historySummary.activeMedicationsSummary.length > 0 ? (
                          historySummary.activeMedicationsSummary.map((m, i) => <li key={i}>{m}</li>)
                        ) : (
                          <li className="list-none text-slate-400 -ml-4">No active prescriptions on file</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Safety Risk Alerts */}
                  {historySummary.riskAlerts.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <span className="text-xs font-bold text-red-900 flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Clinical Surveillance Alerts
                      </span>
                      <ul className="text-xs text-red-800 space-y-1 list-disc pl-4">
                        {historySummary.riskAlerts.map((a, i) => (
                          <li key={i} className="font-semibold">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: DRUG SAFETY & ALLERGY SCREEN */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Prescription Safety Cross-Reaction Screen
                  </h4>
                  <p className="text-xs text-slate-500">
                    Cross-references active prescription drugs against patient allergies and chronic conditions
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={runSafetyCheck}
                  disabled={loadingSafety}
                  className="text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSafety ? 'animate-spin' : ''}`} />
                  Re-check Now
                </Button>
              </div>

              {loadingSafety ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-2">
                  <Spinner size="md" />
                  <span className="text-xs text-slate-500">Running pharmacovigilance checks...</span>
                </div>
              ) : currentMedicines.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                  No medications have been added to the prescription builder yet. Add medicines in the consultation form to run safety checks.
                </div>
              ) : safetyResult ? (
                <div className="space-y-4">
                  {safetyResult.hasConflict ? (
                    <div className="space-y-3">
                      <Alert
                        type="error"
                        title={`${safetyResult.alerts.length} Potential Clinical Conflict(s) Detected`}
                      >
                        Please review the flagged medications and recommendations below before finalizing the prescription.
                      </Alert>

                      {safetyResult.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-red-200 bg-red-50/50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-red-900">{alert.drug}</span>
                              <span className="text-xs text-slate-400">vs</span>
                              <span className="font-semibold text-xs text-slate-700">{alert.trigger}</span>
                            </div>
                            <Badge
                              variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}
                              className="text-[10px]"
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>
                          <div className="pt-1 text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                            <span className="font-bold">Recommendation:</span> {alert.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-emerald-900 text-sm">
                        Zero Drug-Allergy or Disease Contraindications Detected
                      </h4>
                      <p className="text-xs text-emerald-700">
                        All {currentMedicines.length} prescribed medication(s) safely cleared against documented allergies and chronic diseases.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Smart OPD AI Co-Pilot · Non-Autonomous Advisory
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
