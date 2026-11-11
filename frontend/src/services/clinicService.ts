import { apiClient } from './api';

export interface ClinicSettingData {
  _id?: string;
  clinicName: string;
  clinicPrefix: string;
  tagline?: string;
  logoUrl?: string;
  registrationNumber?: string;
  gstin?: string;
  contact?: {
    phone?: string;
    emergencyPhone?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  operatingHours?: {
    monday?: { isOpen: boolean; openTime: string; closeTime: string };
    tuesday?: { isOpen: boolean; openTime: string; closeTime: string };
    wednesday?: { isOpen: boolean; openTime: string; closeTime: string };
    thursday?: { isOpen: boolean; openTime: string; closeTime: string };
    friday?: { isOpen: boolean; openTime: string; closeTime: string };
    saturday?: { isOpen: boolean; openTime: string; closeTime: string };
    sunday?: { isOpen: boolean; openTime: string; closeTime: string };
  };
  departments?: string[];
  appointmentRules?: {
    defaultSlotDurationMinutes?: number;
    maxBookingDaysInAdvance?: number;
    cancellationCutoffHours?: number;
    allowWalkIns?: boolean;
    walkInReservedSlots?: number;
  };
  billingRules?: {
    defaultConsultationFee?: number;
    followUpValidityDays?: number;
    followUpConsultationFee?: number;
    emergencyMarkupPercent?: number;
    taxEnabled?: boolean;
    taxRatePercent?: number;
  };
  holidays?: Array<{
    _id?: string;
    date: string;
    reason: string;
    isRecurringYearly?: boolean;
  }>;
}

export interface DoctorData {
  _id: string;
  userId?: string;
  fullName: string;
  phone: string;
  email?: string;
  medicalCouncilRegNo: string;
  department: string;
  specialization: string;
  qualifications: string[];
  roomNumber: string;
  consultationFee: number;
  averageConsultationMinutes: number;
  maxDailyPatients: number;
  isAutoAllocatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  rating?: number;
}

export interface ShiftData {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatientsPerShift: number;
}

export interface DoctorScheduleData {
  _id?: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  shifts: ShiftData[];
  isActive: boolean;
}

export interface DoctorLeaveData {
  _id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface StaffData {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'RECEPTIONIST' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
}

// Clinic Profile & Settings
export const getClinicSettings = async (): Promise<ClinicSettingData> => {
  const res = await apiClient.get('/clinic');
  return res.data.data;
};

export const updateClinicSettings = async (data: Partial<ClinicSettingData>): Promise<ClinicSettingData> => {
  const res = await apiClient.put('/clinic', data);
  return res.data.data;
};

export const getHolidays = async () => {
  const res = await apiClient.get('/clinic/holidays');
  return res.data.data;
};

export const addHoliday = async (holiday: { date: string; reason: string; isRecurringYearly?: boolean }) => {
  const res = await apiClient.post('/clinic/holidays', holiday);
  return res.data.data;
};

export const deleteHoliday = async (id: string) => {
  const res = await apiClient.delete(`/clinic/holidays/${id}`);
  return res.data.data;
};

// Doctors
export const getDoctors = async (params?: { department?: string; status?: string }): Promise<DoctorData[]> => {
  const res = await apiClient.get('/doctors', { params });
  return res.data.data;
};

export const getDoctor = async (id: string): Promise<DoctorData> => {
  const res = await apiClient.get(`/doctors/${id}`);
  return res.data.data;
};

export const createDoctor = async (data: any): Promise<DoctorData> => {
  const res = await apiClient.post('/doctors', data);
  return res.data.data;
};

export const updateDoctor = async (id: string, data: Partial<DoctorData>): Promise<DoctorData> => {
  const res = await apiClient.put(`/doctors/${id}`, data);
  return res.data.data;
};

export const getDoctorSchedule = async (id: string): Promise<DoctorScheduleData[]> => {
  const res = await apiClient.get(`/doctors/${id}/schedule`);
  return res.data.data;
};

export const updateDoctorSchedule = async (id: string, schedules: Partial<DoctorScheduleData>[]): Promise<DoctorScheduleData[]> => {
  const res = await apiClient.put(`/doctors/${id}/schedule`, { schedules });
  return res.data.data;
};

export const getDoctorLeaves = async (id: string): Promise<DoctorLeaveData[]> => {
  const res = await apiClient.get(`/doctors/${id}/leaves`);
  return res.data.data;
};

export const requestDoctorLeave = async (id: string, data: { startDate: string; endDate: string; reason: string; allDay?: boolean }): Promise<DoctorLeaveData> => {
  const res = await apiClient.post(`/doctors/${id}/leaves`, data);
  return res.data.data;
};

export const updateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED'): Promise<DoctorLeaveData> => {
  const res = await apiClient.put(`/doctors/leaves/${leaveId}/status`, { status });
  return res.data.data;
};

// Staff
export const getStaff = async (): Promise<StaffData[]> => {
  const res = await apiClient.get('/staff');
  return res.data.data;
};

export const createStaff = async (data: { fullName: string; phone: string; email?: string; password: string; role?: 'RECEPTIONIST' | 'ADMIN' }): Promise<StaffData> => {
  const res = await apiClient.post('/staff', data);
  return res.data.data;
};

export const updateStaff = async (id: string, data: { fullName?: string; email?: string; status?: string }): Promise<StaffData> => {
  const res = await apiClient.put(`/staff/${id}`, data);
  return res.data.data;
};

