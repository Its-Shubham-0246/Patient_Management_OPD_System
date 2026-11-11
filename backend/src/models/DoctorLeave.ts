import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorLeave extends Document {
  clinicId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  shiftId?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorLeaveSchema = new Schema<IDoctorLeave>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    allDay: { type: Boolean, default: true },
    shiftId: { type: String },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

DoctorLeaveSchema.index({ clinicId: 1, doctorId: 1, startDate: 1, endDate: 1 });

export const DoctorLeave = mongoose.model<IDoctorLeave>('DoctorLeave', DoctorLeaveSchema);

