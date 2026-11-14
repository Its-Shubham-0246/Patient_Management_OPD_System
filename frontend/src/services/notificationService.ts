import { apiClient } from './api';

export interface IDeliveryLog {
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  timestamp: string;
  messageId?: string;
  error?: string;
  dltTemplateId?: string;
}

export interface INotification {
  _id: string;
  clinicId: string;
  recipientUserId?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string;
  };
  recipientPatientId?: {
    _id: string;
    fullName: string;
    uhid: string;
    phone?: string;
  };
  recipientRole: 'ALL' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  type: 'APPOINTMENT' | 'QUEUE' | 'PRESCRIPTION' | 'REPORT' | 'BILLING' | 'SYSTEM';
  event: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'MULTI';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  deliveryLogs: IDeliveryLog[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  channel?: string;
  recipientRole?: string;
}

export interface NotificationListResponse {
  notifications: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface DltTemplateInfo {
  key: string;
  templateId: string;
  header: string;
  title: string;
  templatePattern: string;
}

export const getNotifications = async (
  params?: NotificationQueryParams
): Promise<NotificationListResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.isRead !== undefined) query.append('isRead', String(params.isRead));
  if (params?.type) query.append('type', params.type);
  if (params?.channel) query.append('channel', params.channel);
  if (params?.recipientRole) query.append('recipientRole', params.recipientRole);

  const res = await apiClient.get(`/notifications?${query.toString()}`);
  return res.data?.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await apiClient.get('/notifications/unread-count');
  return res.data?.data?.count || 0;
};

export const getDltTemplates = async (): Promise<DltTemplateInfo[]> => {
  const res = await apiClient.get('/notifications/templates');
  return res.data?.data?.templates || [];
};

export const markAsRead = async (id: string): Promise<INotification> => {
  const res = await apiClient.put(`/notifications/${id}/read`);
  return res.data?.data;
};

export const markAllAsRead = async (): Promise<{ updatedCount: number }> => {
  const res = await apiClient.put('/notifications/read-all');
  return res.data?.data;
};

export const createNotification = async (data: {
  title: string;
  message: string;
  type?: string;
  event?: string;
  channel?: string;
  recipientRole?: string;
  recipientUserId?: string;
  recipientPatientId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  email?: string;
  phone?: string;
}): Promise<INotification> => {
  const res = await apiClient.post('/notifications/send', data);
  return res.data?.data;
};

export const testTemplate = async (data: {
  templateKey: string;
  variables?: Record<string, any>;
  dispatch?: boolean;
  testEmail?: string;
  testPhone?: string;
}) => {
  const res = await apiClient.post('/notifications/test-template', data);
  return res.data?.data;
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};

