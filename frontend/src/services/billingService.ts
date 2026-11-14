import { apiClient } from './api';

export interface InvoiceItem {
  description: string;
  category: 'consultation' | 'procedure' | 'lab' | 'medicine' | 'registration' | 'other';
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
}

export interface PaymentData {
  _id: string;
  receiptNumber: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'cheque' | 'other';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transactionRef?: string;
  receivedBy: {
    _id: string;
    fullName: string;
    role: string;
  };
  paymentDate: string;
  notes?: string;
}

export interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  clinicId: any;
  patientId: {
    _id: string;
    fullName: string;
    uhid: string;
    phone: string;
    gender: string;
    age?: number;
    address?: any;
    bloodGroup?: string;
  };
  doctorId?: {
    _id: string;
    fullName: string;
    specialization: string;
    medicalRegistrationNumber?: string;
    roomNumber?: string;
  };
  visitId?: any;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'void' | 'refunded';
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  discountReason?: string;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  notes?: string;
  payments?: PaymentData[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyCollectionReport {
  date: string;
  clinicName: string;
  metrics: {
    totalCollected: number;
    totalInvoiced: number;
    pendingReceivables: number;
    transactionsCount: number;
    invoicesCount: number;
  };
  methodBreakdown: {
    cash: number;
    upi: number;
    card: number;
    netbanking: number;
    other: number;
  };
  cashierBreakdown: Record<string, number>;
  payments: any[];
}

export interface CreateInvoicePayload {
  patientId: string;
  visitId?: string;
  appointmentId?: string;
  doctorId?: string;
  items: Array<{
    description: string;
    category?: 'consultation' | 'procedure' | 'lab' | 'medicine' | 'registration' | 'other';
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
  }>;
  discountPercent?: number;
  discountAmount?: number;
  discountReason?: string;
  adminPin?: string;
  taxPercent?: number;
  notes?: string;
  dueDate?: string;
}

// 1. Get Invoices List
export const getInvoices = async (params?: {
  patientId?: string;
  doctorId?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
}): Promise<InvoiceData[]> => {
  const res = await apiClient.get('/invoices', { params });
  return res.data.data;
};

// 2. Get Invoice by ID
export const getInvoiceById = async (id: string): Promise<InvoiceData> => {
  const res = await apiClient.get(`/invoices/${id}`);
  return res.data.data;
};

// 3. Create Invoice
export const createInvoice = async (payload: CreateInvoicePayload): Promise<InvoiceData> => {
  const res = await apiClient.post('/invoices', payload);
  return res.data.data;
};

// 4. Record Payment
export const recordPayment = async (payload: {
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'cheque' | 'other';
  transactionRef?: string;
  notes?: string;
}): Promise<{ payment: PaymentData; invoice: any }> => {
  const res = await apiClient.post(`/invoices/${payload.invoiceId}/payments`, payload);
  return res.data.data;
};

// 5. Apply Discount (with Admin PIN)
export const applyDiscount = async (
  invoiceId: string,
  payload: {
    discountPercent?: number;
    discountAmount?: number;
    discountReason?: string;
    adminPin: string;
  }
): Promise<InvoiceData> => {
  const res = await apiClient.post(`/invoices/${invoiceId}/discount`, payload);
  return res.data.data;
};

// 6. Get Daily Collection Report
export const getDailyCollectionReport = async (date?: string): Promise<DailyCollectionReport> => {
  const res = await apiClient.get('/billing/daily-report', { params: date ? { date } : {} });
  return res.data.data;
};

// 7. Void Invoice
export const voidInvoice = async (
  invoiceId: string,
  voidReason: string
): Promise<{ message: string; invoice: InvoiceData }> => {
  const res = await apiClient.post(`/invoices/${invoiceId}/void`, { voidReason });
  return res.data.data;
};

