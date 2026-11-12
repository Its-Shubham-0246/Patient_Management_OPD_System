import mongoose, { Schema, Document } from 'mongoose';

export type FollowUpStatus = 'scheduled' | 'reminder_sent' | 'completed' | 'missed' | 'cancelled';

export interface IFollowUp extends Document {
  clinicId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  prescriptionId?: mongoose.Types.ObjectId;
  followUpDate: Date;
  reason: string;
  instructions?: string;
  status: FollowUpStatus;
  reminderSentAt?: Date;
  linkedAppointmentId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', index: true },
    prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', index: true },
    followUpDate: { type: Date, required: true, index: true },
    reason: { type: String, required: true },
    instructions: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'reminder_sent', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    reminderSentAt: { type: Date },
    linkedAppointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

FollowUpSchema.index({ clinicId: 1, patientId: 1, followUpDate: 1 });
FollowUpSchema.index({ clinicId: 1, followUpDate: 1, status: 1 });
FollowUpSchema.index({ clinicId: 1, doctorId: 1, followUpDate: 1 });

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

