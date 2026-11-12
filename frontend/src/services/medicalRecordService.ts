import { apiClient } from './api';
import { PrescriptionData } from './prescriptionService';

export interface MedicalReportData {
  _id: string;
  clinicId: string;
  patientId: any;
  visitId?: string;
  doctorId?: any;
  uploadedBy: any;
  reportType: 'lab' | 'radiology' | 'pathology' | 'cardiology' | 'other';
  reportName: string;
  title: string;
  reportDate: string;
  fileUrl: string;
  filePublicId?: string;
  thumbnailUrl?: string;
  fileSizeBytes: number;
  mimeType: string;
  labName?: string;
  referringDoctor?: string;
  findings?: string;
  isSharedWithPatient: boolean;
  isDeleted: boolean;
  retentionUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpData {
  _id: string;
  clinicId: string;
  patientId: any;
  doctorId: any;
  visitId?: any;
  prescriptionId?: any;
  followUpDate: string;
  reason: string;
  instructions?: string;
  status: 'scheduled' | 'reminder_sent' | 'completed' | 'missed' | 'cancelled';
  reminderSentAt?: string;
  linkedAppointmentId?: any;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'ENCOUNTER' | 'PRESCRIPTION' | 'DIAGNOSTIC_REPORT' | 'FOLLOW_UP';
  date: string;
  title: string;
  summary: string;
  badgeText: string;
  data: any;
}

export interface PatientTimelineResponse {
  patient: {
    _id: string;
    uhid: string;
    fullName: string;
    phone: string;
    gender: string;
    age?: number;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
  };
  metrics: {
    totalEncounters: number;
    totalPrescriptions: number;
    totalReports: number;
    totalFollowUps: number;
  };
  vitalsTrend: Array<{
    date?: string;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
    bloodPressure?: string;
    pulseRate?: number;
    temperatureF?: number;
    spo2Percent?: number;
  }>;
  timeline: TimelineEvent[];
}

// 1. Get Unified Longitudinal Patient Timeline
export const getPatientTimeline = async (patientId: string): Promise<PatientTimelineResponse> => {
  const res = await apiClient.get(`/records/patient/${patientId}/timeline`);
  return res.data.data;
};

// 2. Upload Diagnostic Report
export const uploadReport = async (
  patientId: string,
  payload: {
    title: string;
    reportType: 'lab' | 'radiology' | 'pathology' | 'cardiology' | 'other';
    reportDate?: string;
    fileUrl: string;
    fileSizeBytes?: number;
    mimeType?: string;
    labName?: string;
    referringDoctor?: string;
    findings?: string;
    isSharedWithPatient?: boolean;
    doctorId?: string;
    visitId?: string;
  }
): Promise<MedicalReportData> => {
  const res = await apiClient.post(`/reports/patient/${patientId}`, payload);
  return res.data.data;
};

// 3. Get Patient Diagnostic Reports
export const getPatientReports = async (
  patientId: string,
  type?: string
): Promise<MedicalReportData[]> => {
  const res = await apiClient.get(`/reports/patient/${patientId}`, {
    params: type && type !== 'all' ? { type } : {}
  });
  return res.data.data;
};

// 4. Get Report Details by ID
export const getReportById = async (id: string): Promise<MedicalReportData> => {
  const res = await apiClient.get(`/reports/reports/${id}`);
  return res.data.data;
};

// 5. Delete Report
export const deleteReport = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/reports/reports/${id}`);
  return res.data.data;
};

// 6. Get Follow-Ups
export const getFollowUps = async (params?: {
  patientId?: string;
  doctorId?: string;
  status?: string;
}): Promise<FollowUpData[]> => {
  const res = await apiClient.get('/followups/followups', { params });
  return res.data.data;
};

// 7. Create Follow-Up
export const createFollowUp = async (payload: {
  patientId: string;
  doctorId: string;
  followUpDate: string;
  reason: string;
  instructions?: string;
  visitId?: string;
  prescriptionId?: string;
}): Promise<FollowUpData> => {
  const res = await apiClient.post('/followups/followups', payload);
  return res.data.data;
};

// 8. Update Follow-Up Status
export const updateFollowUpStatus = async (
  id: string,
  status: string,
  linkedAppointmentId?: string
): Promise<FollowUpData> => {
  const res = await apiClient.put(`/followups/followups/${id}/status`, {
    status,
    linkedAppointmentId
  });
  return res.data.data;
};

