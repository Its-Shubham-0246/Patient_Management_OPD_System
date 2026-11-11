import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  AlertTriangle,
  HeartPulse,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  Save,
  Plus,
  Upload,
  Calendar,
  ExternalLink,
  ShieldCheck,
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
  getPatient,
  updatePatient,
  addPatientDocument,
  addChronicCondition,
  PatientData
} from '../../services/patientService';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'documents' | 'visits'>('overview');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<Partial<PatientData>>({});

  // Add Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'LAB_REPORT' | 'IMAGING' | 'PREVIOUS_PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'OTHER'>('LAB_REPORT');
  const [docUrl, setDocUrl] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Add Condition Modal
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [conditionName, setConditionName] = useState('');
  const [diagnosedYear, setDiagnosedYear] = useState('');
  const [medications, setMedications] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [conditionLoading, setConditionLoading] = useState(false);

  // New Allergy Pill
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    if (id) fetchPatientDetails(id);
  }, [id]);

  const fetchPatientDetails = async (patientId: string) => {
    try {
      setLoading(true);
      const data = await getPatient(patientId);
      setPatient(data);
      setFormData(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch patient profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      const updated = await updatePatient(patient._id, formData);
      setPatient(updated);
      setSuccessMsg('Patient profile updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim() || !patient) return;
    const trimmed = newAllergy.trim().toUpperCase();
    if (!patient.allergies?.includes(trimmed)) {
      const updatedAllergies = [...(patient.allergies || []), trimmed];
      try {
        const updated = await updatePatient(patient._id, { allergies: updatedAllergies });
        setPatient(updated);
        setFormData(updated);
        setNewAllergy('');
      } catch (err) {
        setErrorMsg('Failed to add allergy');
      }
    }
  };

  const handleRemoveAllergy = async (allergyToRemove: string) => {
    if (!patient) return;
    const updatedAllergies = (patient.allergies || []).filter((a) => a !== allergyToRemove);
    try {
      const updated = await updatePatient(patient._id, { allergies: updatedAllergies });
      setPatient(updated);
      setFormData(updated);
    } catch (err) {
      setErrorMsg('Failed to remove allergy');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !docTitle || !docUrl) return;
    try {
      setDocLoading(true);
      const docs = await addPatientDocument(patient._id, {
        title: docTitle,
        docType,
        fileUrl: docUrl,
        notes: docNotes
      });
      setPatient({ ...patient, documents: docs });
      setIsDocModalOpen(false);
      setDocTitle('');
      setDocUrl('');
      setDocNotes('');
      setSuccessMsg('Medical report attached to patient vault.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to attach document');
    } finally {
      setDocLoading(false);
    }
  };

  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !conditionName) return;
    try {
      setConditionLoading(true);
      const history = await addChronicCondition(patient._id, {
        condition: conditionName,
        diagnosedYear: diagnosedYear ? Number(diagnosedYear) : undefined,
        medications,
        notes: conditionNotes
      });
      setPatient({
        ...patient,
        medicalHistory: history,
        chronicConditions: Array.from(new Set([...(patient.chronicConditions || []), conditionName]))
      });
      setIsConditionModalOpen(false);
      setConditionName('');
      setDiagnosedYear('');
      setMedications('');
      setConditionNotes('');
      setSuccessMsg('Chronic medical condition recorded.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to record condition');
    } finally {
      setConditionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-slate-500">Loading patient longitudinal profile...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <Alert type="error" title="Record Not Found">
          Unable to locate a patient profile with the requested ID.
        </Alert>
        <Button variant="outline" onClick={() => navigate('/reception/patients')}>
          Return to Patient Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back button and navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/reception/appointments', { state: { patientId: patient._id } })}
          >
            <Calendar className="w-3.5 h-3.5 mr-1" /> Book Appointment
          </Button>
        </div>
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

      {/* Patient Header Card */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-navy-50 text-navy-800 rounded-full flex items-center justify-center border border-navy-200 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-navy-950">{patient.fullName}</h1>
                  <span className="font-mono text-xs font-bold bg-medical-50 text-medical-800 border border-medical-200 px-2.5 py-0.5 rounded">
                    {patient.uhid}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>
                    {patient.age ? `${patient.age} yrs` : 'Age Unspecified'}, {patient.gender}
                  </span>
                  {patient.bloodGroup && (
                    <span className="font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded text-[11px]">
                      Blood Group: {patient.bloodGroup}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-700">
                    <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Registered: {new Date(patient.createdAt).toLocaleDateString()}</div>
              {patient.consentGiven && (
                <div className="flex items-center gap-1 text-emerald-700 font-medium justify-end mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> DPDP Consent Active
                </div>
              )}
            </div>
          </div>

          {/* CRITICAL MEDICAL ALERTS */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-red-950 uppercase tracking-wide block">
                  Critical Drug Allergy Warning
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {patient.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 px-2 py-0.5 rounded"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="text-red-500 hover:text-red-800 ml-1"
                        title="Remove Allergy"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {patient.chronicConditions && patient.chronicConditions.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <HeartPulse className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide block">
                  Documented Chronic Conditions
                </span>
                <div className="text-xs text-amber-900 mt-1 font-medium">
                  {patient.chronicConditions.join(' • ')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-slate-200 px-4 bg-slate-50 gap-2">
          {[
            { id: 'overview', label: 'Demographics & Overview', icon: User },
            { id: 'history', label: 'Medical History & Allergies', icon: HeartPulse },
            { id: 'documents', label: `Reports Vault (${patient.documents?.length || 0})`, icon: FileText },
            { id: 'visits', label: 'Visit History', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-medical-600 text-medical-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab 1: Overview & Demographics */}
      {activeTab === 'overview' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Patient Contact & Demographic Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Full Name"
                required
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                label="Mobile Phone"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Age (Years)"
                type="number"
                min="0"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender || 'MALE'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup || ''}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
                >
                  <option value="">Unspecified</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Address Line"
                  value={formData.address?.line1 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line1: e.target.value }
                    })
                  }
                />
              </div>
              <Input
                label="City"
                value={formData.address?.city || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Emergency Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contact Person Name"
                value={formData.emergencyContact?.name || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })
                }
              />
              <Input
                label="Relationship to Patient"
                value={formData.emergencyContact?.relation || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                  })
                }
              />
              <Input
                label="Emergency Phone"
                value={formData.emergencyContact?.phone || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })
                }
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Demographics
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Medical History & Allergies */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Allergies Card */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Drug & Substance Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {!patient.allergies || patient.allergies.length === 0 ? (
                  <span className="text-xs text-slate-400">No known drug allergies reported.</span>
                ) : (
                  patient.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-900 border border-red-300 rounded-md text-xs font-bold"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex gap-2 max-w-sm pt-2">
                <Input
                  placeholder="e.g. SULFAMETHOXAZOLE"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAllergy();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddAllergy}>
                  <Plus className="w-4 h-4 mr-1" /> Add Allergy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chronic Conditions Table */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-medical-600" />
                Chronic Conditions & Medical History
              </CardTitle>
              <Button size="sm" onClick={() => setIsConditionModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Record Condition
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Condition</th>
                      <th className="py-2.5 px-4">Diagnosed Year</th>
                      <th className="py-2.5 px-4">Active Medications</th>
                      <th className="py-2.5 px-4">Clinical Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!patient.medicalHistory || patient.medicalHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-400">
                          No previous medical conditions recorded.
                        </td>
                      </tr>
                    ) : (
                      patient.medicalHistory.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-navy-950">{item.condition}</td>
                          <td className="py-2.5 px-4 text-slate-600">{item.diagnosedYear || 'N/A'}</td>
                          <td className="py-2.5 px-4 text-slate-700">{item.medications || 'None recorded'}</td>
                          <td className="py-2.5 px-4 text-slate-500">{item.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Diagnostic Documents Vault */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-600" />
              Patient Diagnostic Reports & Document Vault
            </CardTitle>
            <Button size="sm" onClick={() => setIsDocModalOpen(true)}>
              <Upload className="w-3.5 h-3.5 mr-1" /> Attach Document
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Attached Date</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!patient.documents || patient.documents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No diagnostic reports or scans uploaded yet.
                      </td>
                    </tr>
                  ) : (
                    patient.documents.map((doc, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-navy-950">{doc.title}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{doc.docType.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{doc.notes || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-medical-700 hover:text-medical-900"
                          >
                            Open File <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Visits History */}
      {activeTab === 'visits' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-medical-600" />
              Longitudinal Outpatient Consultations & Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-slate-400 text-xs">
              Consultation and prescription records appear here automatically once consultations are conducted in Phase 8.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attach Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Attach Diagnostic Report"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <Input
            label="Document Title"
            required
            placeholder="e.g. Complete Blood Count (CBC) Report"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
            >
              <option value="LAB_REPORT">Pathology / Lab Report</option>
              <option value="IMAGING">Radiology / X-Ray / MRI / Ultrasound</option>
              <option value="PREVIOUS_PRESCRIPTION">Previous External Prescription</option>
              <option value="DISCHARGE_SUMMARY">Hospital Discharge Summary</option>
              <option value="OTHER">Other Clinical Document</option>
            </select>
          </div>
          <Input
            label="Document Link / File URL"
            required
            placeholder="https://storage.clinic.in/reports/cbc-982.pdf"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            helperText="Cloud storage URL or scanned report path"
          />
          <Input
            label="Clinical Notes / Findings"
            placeholder="e.g. Mildly elevated ESR, Hb 13.2"
            value={docNotes}
            onChange={(e) => setDocNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsDocModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={docLoading}>
              Attach to Patient Vault
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Chronic Condition Modal */}
      <Modal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        title="Record Chronic Medical Condition"
      >
        <form onSubmit={handleAddCondition} className="space-y-4">
          <Input
            label="Condition Name"
            required
            placeholder="e.g. Type 2 Diabetes Mellitus"
            value={conditionName}
            onChange={(e) => setConditionName(e.target.value)}
          />
          <Input
            label="Year of Diagnosis (Approximate)"
            type="number"
            min="1950"
            max="2030"
            placeholder="e.g. 2019"
            value={diagnosedYear}
            onChange={(e) => setDiagnosedYear(e.target.value)}
          />
          <Input
            label="Active Medications"
            placeholder="e.g. Metformin 500mg BD"
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
          />
          <Input
            label="Clinical Notes"
            placeholder="e.g. Controlled on oral hypoglycemics"
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsConditionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={conditionLoading}>
              Record Condition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

