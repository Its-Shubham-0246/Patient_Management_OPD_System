import { apiClient } from './api';

export interface VitalsData {
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bloodPressure?: string;
  pulseRate?: number;
  temperatureF?: number;
  respiratoryRate?: number;
  spo2Percent?: number;
  bloodGlucose?: number;
}

export interface MedicineItem {
  name: string;
  genericName?: string;
  dosage: string;
  form: 'Tablet' | 'Syrup' | 'Capsule' | 'Injection' | 'Ointment' | 'Drops' | 'Inhaler' | 'Other';
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface Icd10Item {
  code: string;
  description: string;
}

export interface PrescriptionData {
  _id?: string;
  prescriptionNumber?: string;
  clinicId?: any;
  visitId: string;
  patientId: any;
  doctorId: any;
  prescriptionDate?: string;
  vitals?: VitalsData;
  chiefComplaints?: string[];
  clinicalObservations?: string;
  diagnosis?: string[];
  icd10Codes?: Icd10Item[];
  medicines: MedicineItem[];
  labTests?: string[];
  advice?: string;
  dietaryRestrictions?: string;
  followUpDays?: number;
  followUpDate?: string;
  isFinalized?: boolean;
  finalizedAt?: string;
  digitalSignature?: string;
  doctorRegNumber?: string;
  pdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormularyCatalog {
  medications: MedicineItem[];
  icd10: Icd10Item[];
}

export const getFormularyCatalog = async (): Promise<FormularyCatalog> => {
  const res = await apiClient.get('/prescriptions/formulary');
  return res.data.data;
};

export const savePrescription = async (
  visitId: string,
  payload: Partial<PrescriptionData>
): Promise<PrescriptionData> => {
  const res = await apiClient.post(`/prescriptions/${visitId}`, payload);
  return res.data.data;
};

export const getPrescriptionById = async (id: string): Promise<PrescriptionData> => {
  const res = await apiClient.get(`/prescriptions/${id}`);
  return res.data.data;
};

export const getPrescriptionByVisit = async (visitId: string): Promise<PrescriptionData | null> => {
  const res = await apiClient.get(`/prescriptions/visit/${visitId}`);
  return res.data.data;
};

export const getPatientPrescriptions = async (patientId: string): Promise<PrescriptionData[]> => {
  const res = await apiClient.get(`/prescriptions/patient/${patientId}`);
  return res.data.data;
};

export const getDoctorTodayPrescriptions = async (doctorId?: string): Promise<PrescriptionData[]> => {
  const res = await apiClient.get('/prescriptions/doctor/today', {
    params: doctorId ? { doctorId } : {}
  });
  return res.data.data;
};

