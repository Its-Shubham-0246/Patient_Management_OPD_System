import { apiClient } from './api';

export interface PatientDocument {
  _id?: string;
  title: string;
  docType: 'LAB_REPORT' | 'IMAGING' | 'PREVIOUS_PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'OTHER';
  fileUrl: string;
  uploadedAt: string;
  notes?: string;
}

export interface ChronicCondition {
  _id?: string;
  condition: string;
  diagnosedYear?: number;
  medications?: string;
  notes?: string;
}

export interface PatientData {
  _id: string;
  uhid: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  medicalHistory?: ChronicCondition[];
  documents?: PatientDocument[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
  consentGiven?: boolean;
  consentDate?: string;
  createdAt: string;
}

export interface CreatePatientPayload {
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
}

export const getPatients = async (params?: {
  q?: string;
  bloodGroup?: string;
  gender?: string;
  page?: number;
  limit?: number;
}): Promise<{ patients: PatientData[]; total: number; page: number; totalPages: number }> => {
  const res = await apiClient.get('/patients', { params });
  return res.data.data;
};

export const searchPatients = async (query: string): Promise<PatientData[]> => {
  if (!query.trim()) return [];
  const res = await apiClient.get('/patients/search', { params: { q: query } });
  return res.data.data;
};

export const getPatient = async (id: string): Promise<PatientData> => {
  const res = await apiClient.get(`/patients/${id}`);
  return res.data.data;
};

export const createPatient = async (data: CreatePatientPayload): Promise<PatientData> => {
  const res = await apiClient.post('/patients', data);
  return res.data.data;
};

export const updatePatient = async (id: string, data: Partial<PatientData>): Promise<PatientData> => {
  const res = await apiClient.put(`/patients/${id}`, data);
  return res.data.data;
};

export const addPatientDocument = async (
  id: string,
  doc: { title: string; docType: string; fileUrl: string; notes?: string }
): Promise<PatientDocument[]> => {
  const res = await apiClient.post(`/patients/${id}/documents`, doc);
  return res.data.data;
};

export const addChronicCondition = async (
  id: string,
  condition: { condition: string; diagnosedYear?: number; medications?: string; notes?: string }
): Promise<ChronicCondition[]> => {
  const res = await apiClient.post(`/patients/${id}/medical-history`, condition);
  return res.data.data;
};

export const getPatientMedicalHistory = async (id: string) => {
  const res = await apiClient.get(`/patients/${id}/medical-history`);
  return res.data.data;
};

