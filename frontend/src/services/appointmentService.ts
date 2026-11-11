import { apiClient } from './api';

export interface AppointmentData {
  _id: string;
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
    consultationFee: number;
  };
  appointmentDate: string;
  timeSlot: string;
  slotDurationMinutes: number;
  bookingChannel: 'ONLINE_PATIENT' | 'RECEPTIONIST_WALKIN' | 'RECEPTIONIST_PHONE' | 'DOCTOR_FOLLOWUP';
  status: 'SCHEDULED' | 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancellationReason?: string;
  notes?: string;
  tokenNumber?: number;
  createdAt: string;
}

export interface SlotData {
  time: string;
  isAvailable: boolean;
}

export interface AvailableSlotsResponse {
  doctorId: string;
  date: string;
  isWorkingDay: boolean;
  isDoctorOnLeave?: boolean;
  leaveReason?: string;
  totalSlots: number;
  availableSlotsCount: number;
  slots: SlotData[];
}

export interface AutoAllocationResponse {
  department: string;
  date: string;
  recommendedDoctor: {
    _id: string;
    fullName: string;
    department: string;
    specialization: string;
    roomNumber: string;
    consultationFee: number;
    workloadIndex: number;
    confirmedCount: number;
    waitingCount: number;
  };
  eligibleDoctors: Array<{
    _id: string;
    fullName: string;
    workloadIndex: number;
    confirmedCount: number;
    waitingCount: number;
    isRecommended: boolean;
  }>;
}

export interface DashboardStatsResponse {
  kpi: {
    totalPatients: number;
    newPatientsToday: number;
    todayTotalAppointments: number;
    todayCheckedIn: number;
    todayCompleted: number;
    todayWaitingLounge: number;
    activeDoctorsCount: number;
    avgWaitMinutes: number;
    estimatedRevenue: number;
  };
  doctorWorkload: Array<{
    _id: string;
    fullName: string;
    department: string;
    specialization: string;
    roomNumber: string;
    consultationFee: number;
    status: string;
    todayTotalBookings: number;
    todayWaiting: number;
    todayCompleted: number;
  }>;
  todayAppointments: Array<{
    _id: string;
    timeSlot: string;
    status: string;
    tokenNumber?: number;
    bookingChannel: string;
    patient?: {
      _id: string;
      fullName: string;
      uhid: string;
      phone: string;
      bloodGroup?: string;
      allergies?: string[];
    };
    doctor?: {
      _id: string;
      fullName: string;
      specialization: string;
      roomNumber: string;
    };
  }>;
}

export const getAppointments = async (params?: {
  date?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
}): Promise<AppointmentData[]> => {
  const res = await apiClient.get('/appointments', { params });
  return res.data.data;
};

export const getAppointment = async (id: string): Promise<AppointmentData> => {
  const res = await apiClient.get(`/appointments/${id}`);
  return res.data.data;
};

export const createAppointment = async (data: {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  timeSlot: string;
  bookingChannel?: string;
  notes?: string;
}): Promise<AppointmentData> => {
  const res = await apiClient.post('/appointments', data);
  return res.data.data;
};

export const updateAppointmentStatus = async (
  id: string,
  status: string,
  cancellationReason?: string
): Promise<AppointmentData> => {
  const res = await apiClient.put(`/appointments/${id}/status`, { status, cancellationReason });
  return res.data.data;
};

export const getAvailableSlots = async (doctorId: string, date: string): Promise<AvailableSlotsResponse> => {
  const res = await apiClient.get(`/appointments/doctor/${doctorId}/slots`, { params: { date } });
  return res.data.data;
};

export const autoAllocateDoctor = async (department: string, date?: string): Promise<AutoAllocationResponse> => {
  const res = await apiClient.get('/appointments/auto-allocate', { params: { department, date } });
  return res.data.data;
};

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const res = await apiClient.get('/analytics/dashboard');
  return res.data.data;
};
