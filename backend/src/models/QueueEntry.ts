import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueEntry extends Document {
  clinicId: mongoose.Types.ObjectId;
  visitId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  tokenNumber: number; // 1, 2, 3... resets daily per doctor
  queueDate: Date; // Normalized to YYYY-MM-DD
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED';
  isEmergency: boolean;
  priorityOrder: number; // 1 = Emergency, 100 = Normal
  calledAt?: Date;
  callCount: number; // times called (max 3 before skipped)
  estimatedWaitMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QueueEntrySchema = new Schema<IQueueEntry>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true, unique: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    tokenNumber: { type: Number, required: true },
    queueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED'],
      default: 'WAITING',
      index: true
    },
    isEmergency: { type: Boolean, default: false },
    priorityOrder: { type: Number, default: 100 },
    calledAt: { type: Date },
    callCount: { type: Number, default: 0 },
    estimatedWaitMinutes: { type: Number }
  },
  { timestamps: true }
);

QueueEntrySchema.index({ doctorId: 1, queueDate: 1, status: 1, priorityOrder: 1, tokenNumber: 1 });
QueueEntrySchema.index({ clinicId: 1, queueDate: 1, status: 1 });

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', QueueEntrySchema);

