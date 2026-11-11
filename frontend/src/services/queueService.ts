import { apiClient } from './api';

export interface QueueEntryData {
  _id: string;
  tokenNumber: number;
  queueDate: string;
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED';
  isEmergency: boolean;
  priorityOrder: number;
  callCount: number;
  calledAt?: string;
  estimatedWaitMinutes?: number;
  patientId: {
    _id: string;
    fullName: string;
    uhid: string;
    phone: string;
    gender: string;
    age?: number;
    bloodGroup?: string;
    allergies?: string[];
  };
  doctorId: {
    _id: string;
    fullName: string;
    specialization: string;
    roomNumber: string;
    department: string;
    averageConsultationMinutes?: number;
  };
  visitId?: {
    _id: string;
    checkInTime: string;
    consultationStartTime?: string;
    consultationEndTime?: string;
    visitType: string;
    status: string;
  };
  createdAt: string;
}

export interface RoomDisplayData {
  doctorId: string;
  doctorName: string;
  department: string;
  roomNumber: string;
  currentServing: {
    tokenNumber: number;
    status: 'CALLED' | 'IN_CONSULTATION';
    isEmergency: boolean;
    maskedName: string;
    uhid: string;
    calledAt?: string;
  } | null;
  upcomingTokens: Array<{
    tokenNumber: number;
    isEmergency: boolean;
    maskedName: string;
    uhid: string;
  }>;
  waitingCount: number;
}

export interface DisplayQueueResponse {
  clinicName: string;
  timestamp: string;
  rooms: RoomDisplayData[];
}

export const getDoctorQueue = async (doctorId: string = 'ALL'): Promise<QueueEntryData[]> => {
  const res = await apiClient.get(`/queue/${doctorId}`);
  return res.data.data;
};

export const getDisplayQueue = async (): Promise<DisplayQueueResponse> => {
  const res = await apiClient.get('/queue/display');
  return res.data.data;
};

export const checkInPatient = async (data: {
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  isEmergency?: boolean;
}): Promise<QueueEntryData> => {
  const res = await apiClient.post('/queue/checkin', data);
  return res.data.data;
};

export const callNextToken = async (entryId: string): Promise<QueueEntryData> => {
  const res = await apiClient.put(`/queue/${entryId}/call-next`);
  return res.data.data;
};

export const startConsultation = async (entryId: string): Promise<QueueEntryData> => {
  const res = await apiClient.put(`/queue/${entryId}/start`);
  return res.data.data;
};

export const completeConsultation = async (entryId: string): Promise<QueueEntryData> => {
  const res = await apiClient.put(`/queue/${entryId}/complete`);
  return res.data.data;
};

export const skipToken = async (entryId: string): Promise<QueueEntryData> => {
  const res = await apiClient.put(`/queue/${entryId}/skip`);
  return res.data.data;
};

export const recallToken = async (entryId: string): Promise<QueueEntryData> => {
  const res = await apiClient.put(`/queue/${entryId}/recall`);
  return res.data.data;
};

export const markEmergency = async (entryId: string): Promise<QueueEntryData> => {
  const res = await apiClient.put(`/queue/${entryId}/emergency`);
  return res.data.data;
};
