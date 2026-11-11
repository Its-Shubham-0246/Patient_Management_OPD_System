import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  clinicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  medicalCouncilRegNo: string;
  department: string;
  specialization: string;
  qualifications: string[];
  roomNumber: string;
  consultationFee: number;
  averageConsultationMinutes: number;
  maxDailyPatients: number;
  isAutoAllocatable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    medicalCouncilRegNo: { type: String, required: true, trim: true },
    department: { type: String, required: true, index: true },
    specialization: { type: String, required: true },
    qualifications: [{ type: String }],
    roomNumber: { type: String, required: true },
    consultationFee: { type: Number, required: true, default: 500 },
    averageConsultationMinutes: { type: Number, default: 15 },
    maxDailyPatients: { type: Number, default: 25 },
    isAutoAllocatable: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
      default: 'ACTIVE',
      index: true
    },
    phone: { type: String },
    email: { type: String }
  },
  { timestamps: true }
);

DoctorSchema.index({ clinicId: 1, department: 1, status: 1, isAutoAllocatable: 1 });

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);

