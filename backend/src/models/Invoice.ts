import mongoose, { Schema, Document } from 'mongoose';

export type InvoiceStatus = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'void' | 'refunded';

export interface IInvoiceItem {
  description: string;
  category: 'consultation' | 'procedure' | 'lab' | 'medicine' | 'registration' | 'other';
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  tax: number;      // percentage
  total: number;
}

export interface IInvoice extends Document {
  clinicId: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: IInvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  discountReason?: string;
  discountApprovedBy?: mongoose.Types.ObjectId;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  notes?: string;
  pdfUrl?: string;
  voidedBy?: mongoose.Types.ObjectId;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['consultation', 'procedure', 'lab', 'medicine', 'registration', 'other'],
      default: 'consultation'
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    invoiceDate: { type: Date, required: true, default: Date.now, index: true },
    dueDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['draft', 'pending', 'partially_paid', 'paid', 'void', 'refunded'],
      default: 'pending',
      index: true
    },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountReason: { type: String },
    discountApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    taxAmount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    notes: { type: String },
    pdfUrl: { type: String },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String }
  },
  { timestamps: true }
);

InvoiceSchema.index({ clinicId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ clinicId: 1, patientId: 1, invoiceDate: -1 });
InvoiceSchema.index({ clinicId: 1, status: 1 });
InvoiceSchema.index({ clinicId: 1, invoiceDate: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

