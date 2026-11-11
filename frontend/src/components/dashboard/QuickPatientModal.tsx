import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle,
  Copy,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { createPatient, PatientData, CreatePatientPayload } from '../../services/patientService';

export interface QuickPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: PatientData) => void;
  onBookAppointment?: (patient: PatientData) => void;
}

export const QuickPatientModal: React.FC<QuickPatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onBookAppointment
}) => {
  const [formData, setFormData] = useState<CreatePatientPayload>({
    fullName: '',
    phone: '',
    age: undefined,
    gender: 'MALE',
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    emergencyContact: { name: '', relation: '', phone: '' }
  });

  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdPatient, setCreatedPatient] = useState<PatientData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const payload: CreatePatientPayload = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        allergies: allergiesText
          .split(',')
          .map((a) => a.trim().toUpperCase())
          .filter(Boolean),
        chronicConditions: conditionsText
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      };

      const pt = await createPatient(payload);
      setCreatedPatient(pt);
      onSuccess?.(pt);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdPatient) {
      navigator.clipboard.writeText(createdPatient.uhid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      phone: '',
      age: undefined,
      gender: 'MALE',
      bloodGroup: '',
      allergies: [],
      chronicConditions: [],
      emergencyContact: { name: '', relation: '', phone: '' }
    });
    setAllergiesText('');
    setConditionsText('');
    setCreatedPatient(null);
    setErrorMsg(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Patient Ingress & Registration" maxWidth="xl">
      {createdPatient ? (
        <div className="p-4 space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-950">Patient Registered Successfully!</h3>
            <p className="text-xs text-slate-500 mt-1">Unique Patient Identifier (UHID) Generated:</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg max-w-xs mx-auto flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-emerald-950">{createdPatient.uhid}</span>
            <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs gap-1">
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={handleReset}>
              Register Another
            </Button>
            {onBookAppointment && (
              <Button
                onClick={() => {
                  onBookAppointment(createdPatient);
                  onClose();
                }}
                className="gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Book Appointment Now
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && <Alert type="error" title="Registration Error">{errorMsg}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Ramesh Kulkarni"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Input
              label="Mobile Phone Number"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Age (Years)"
                type="number"
                min="0"
                max="125"
                required
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
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
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
            <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Critical Drug Allergies
            </span>
            <Input
              placeholder="e.g. PENICILLIN, CIPROFLOXACIN"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              helperText="Separate multiple allergies with commas"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Register & Issue UHID
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

