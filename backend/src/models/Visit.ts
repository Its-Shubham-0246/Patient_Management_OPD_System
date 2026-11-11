import mongoose, { Schema, Document } from 'mongoose';

export interface IVitals {
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bloodPressure?: string;
  pulseRate?: number;
  temperatureF?: number;
  respiratoryRate?: number;
  spo2Percent?: number;
  bloodGlucose?: number;
}

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
  chiefComplaint?: string;
  vitals?: IVitals;
  consultationNotes?: string;
  diagnosis?: string[];
  icdCodes?: string[];
  treatmentPlan?: string;
  followUpRequired?: boolean;
  prescriptionId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
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
    },
    chiefComplaint: { type: String },
    vitals: {
      weightKg: { type: Number },
      heightCm: { type: Number },
      bmi: { type: Number },
      bloodPressure: { type: String },
      pulseRate: { type: Number },
      temperatureF: { type: Number },
      respiratoryRate: { type: Number },
      spo2Percent: { type: Number },
      bloodGlucose: { type: Number }
    },
    consultationNotes: { type: String },
    diagnosis: { type: [String], default: [] },
    icdCodes: { type: [String], default: [] },
    treatmentPlan: { type: String },
    followUpRequired: { type: Boolean, default: false },
    prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' }
  },
  { timestamps: true }
);

VisitSchema.index({ clinicId: 1, checkInTime: 1, doctorId: 1 });
VisitSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
