import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'cheque' | 'other';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface IPayment extends Document {
  clinicId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  receiptNumber: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  receivedBy: mongoose.Types.ObjectId;
  paymentDate: Date;
  notes?: string;
  receiptUrl?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'insurance', 'cheque', 'other'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'success',
      index: true
    },
    transactionRef: { type: String },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String },
    receiptUrl: { type: String },
    refundedAmount: { type: Number },
    refundedAt: { type: Date },
    refundReason: { type: String }
  },
  { timestamps: true }
);

PaymentSchema.index({ clinicId: 1, invoiceId: 1 });
PaymentSchema.index({ clinicId: 1, patientId: 1, paymentDate: -1 });
PaymentSchema.index({ clinicId: 1, paymentDate: -1 });
PaymentSchema.index({ clinicId: 1, method: 1, paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

