import { apiClient } from './api';

export interface SoapDraftResponse {
  subjective: {
    chiefComplaints: string[];
    historyOfPresentIllness: string;
  };
  objective: {
    physicalExamination: string;
    observedVitalsSummary: string;
  };
  assessment: {
    primaryImpression: string;
    differentialDiagnosisSuggestions: Array<{
      condition: string;
      icd10Hint: string;
      reasoning: string;
    }>;
  };
  plan: {
    nonPharmacologicalAdvice: string[];
    suggestedInvestigations: string[];
    followUpRecommendation: string;
  };
  metadata: {
    aiDraft: true;
    confidenceScore: number;
    disclaimer: string;
    generatedAt: string;
    tokensProcessed: number;
  };
}

export interface LongitudinalSummaryResponse {
  briefSummary: string;
  keyChronicConditions: string[];
  frequentComplaints: string[];
  activeMedicationsSummary: string[];
  riskAlerts: string[];
}

export interface DrugSafetyAlert {
  type: 'ALLERGY_CONFLICT' | 'CONDITION_CONTRAINDICATION' | 'DUPLICATE_THERAPY';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  drug: string;
  trigger: string;
  description: string;
  recommendation: string;
}

export interface DrugSafetyCheckResponse {
  hasConflict: boolean;
  maxSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  alerts: DrugSafetyAlert[];
}

export interface OperationalForecastResponse {
  expectedFootfallToday: number;
  predictedPeakHours: string;
  recommendedStaffing: string;
  averageWaitForecastMinutes: number;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  actorUserId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  actorRole: string;
  patientId?: {
    _id: string;
    fullName: string;
    uhid: string;
  };
  details: Record<string, any>;
  timestamp: string;
}

export const aiService = {
  structureSoapNotes: async (payload: {
    rawNotes: string;
    age?: number;
    gender?: string;
    vitals?: any;
    patientId?: string;
  }): Promise<SoapDraftResponse> => {
    const res = await apiClient.post('/ai/soap-assist', payload);
    return res.data.data;
  },

  summarizeHistory: async (payload: {
    patientId?: string;
    age?: number;
    gender?: string;
    chronicConditions?: string[];
    allergies?: string[];
  }): Promise<LongitudinalSummaryResponse> => {
    const res = await apiClient.post('/ai/summarize-history', payload);
    return res.data.data;
  },

  checkDrugInteractions: async (payload: {
    medications: Array<{ name: string; dosage?: string; frequency?: string }>;
    allergies?: string[];
    chronicConditions?: string[];
    patientId?: string;
  }): Promise<DrugSafetyCheckResponse> => {
    const res = await apiClient.post('/ai/drug-interaction-check', payload);
    return res.data.data;
  },

  getOperationalForecast: async (): Promise<OperationalForecastResponse> => {
    const res = await apiClient.post('/ai/operational-forecast', {});
    return res.data.data;
  },

  recordAuditAccept: async (payload: {
    action: 'ACCEPTED' | 'DISCARDED';
    feature: string;
    patientId?: string;
    doctorEditedBeforeSave?: boolean;
    notes?: string;
  }): Promise<{ status: string; auditId: string }> => {
    const res = await apiClient.post('/ai/audit-accept', payload);
    return res.data.data;
  },

  getAuditLogs: async (params?: { page?: number; limit?: number }): Promise<{
    logs: AuditLogItem[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const res = await apiClient.get('/ai/audit-logs', { params });
    return res.data.data;
  }
};
