import { apiClient } from './api';

export interface OverviewAnalytics {
  period: { from: string; to: string };
  totalPatients: number;
  newPatients: number;
  totalAppointments: number;
  completedConsultations: number;
  cancellationRate: number;
  totalRevenue: number;
  totalCollected: number;
  outstandingBalance: number;
  averageWaitTimeMinutes: number;
  totalQueueServed: number;
  emergencyCases: number;
}

export interface AppointmentAnalytics {
  byStatus: Record<string, number>;
  byDay: Array<{ date: string; count: number; completed: number; cancelled: number }>;
  byDoctor: Array<{ doctorId: string; name: string; specialization: string; count: number; completed: number }>;
  byChannel: Array<{ channel: string; count: number }>;
  totalAppointments: number;
  cancellationRate: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  collected: number;
  outstanding: number;
  byMethod: Record<string, number>;
  byDay: Array<{ date: string; invoiced: number; collected: number }>;
  byCategory: Array<{ category: string; revenue: number; count: number }>;
  byDoctor: Array<{ doctorId: string; name: string; revenue: number; count: number }>;
}

export interface DoctorMetric {
  doctorId: string;
  name: string;
  specialization: string;
  department?: string;
  roomNumber?: string;
  consultationFee: number;
  totalAppointments: number;
  completedConsultations: number;
  completionRate: number;
  revenueGenerated: number;
  averageConsultationMinutes: number;
}

export interface PatientAnalytics {
  totalPatients: number;
  newPatientsCount: number;
  returningPatientsCount: number;
  byGender: Record<string, number>;
  byAgeGroup: Record<string, number>;
  topAllergies: Array<{ name: string; count: number }>;
  topChronicConditions: Array<{ condition: string; count: number }>;
}

export interface QueueAnalytics {
  totalTokensIssued: number;
  averageWaitMinutes: number;
  peakHour: string;
  emergencyCount: number;
  skippedCount: number;
  skipRate: number;
  hourlyDistribution: Array<{ hour: number; label: string; count: number }>;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export const analyticsService = {
  getOverview: async (params?: DateRangeParams): Promise<OverviewAnalytics> => {
    const res = await apiClient.get('/analytics/overview', { params });
    return res.data.data;
  },

  getAppointments: async (params?: DateRangeParams): Promise<AppointmentAnalytics> => {
    const res = await apiClient.get('/analytics/appointments', { params });
    return res.data.data;
  },

  getRevenue: async (params?: DateRangeParams): Promise<RevenueAnalytics> => {
    const res = await apiClient.get('/analytics/revenue', { params });
    return res.data.data;
  },

  getDoctors: async (params?: DateRangeParams): Promise<DoctorMetric[]> => {
    const res = await apiClient.get('/analytics/doctors', { params });
    return res.data.data;
  },

  getPatients: async (params?: DateRangeParams): Promise<PatientAnalytics> => {
    const res = await apiClient.get('/analytics/patients', { params });
    return res.data.data;
  },

  getQueue: async (params?: DateRangeParams): Promise<QueueAnalytics> => {
    const res = await apiClient.get('/analytics/queue', { params });
    return res.data.data;
  }
};
