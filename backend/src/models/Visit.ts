import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  clinicId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  checkInTime: Date;
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  visitType: 'FIRST_VISIT' | 'FOLLOW_UP' | 'EMERGENCY';
  status: 'CHECKED_IN' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    checkInTime: { type: Date, default: Date.now },
    consultationStartTime: { type: Date },
    consultationEndTime: { type: Date },
    visitType: {
      type: String,
      enum: ['FIRST_VISIT', 'FOLLOW_UP', 'EMERGENCY'],
      default: 'FIRST_VISIT'
    },
    status: {
      type: String,
      enum: ['CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
      default: 'CHECKED_IN',
      index: true
    }
  },
  { timestamps: true }
);

VisitSchema.index({ clinicId: 1, checkInTime: 1, doctorId: 1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);

