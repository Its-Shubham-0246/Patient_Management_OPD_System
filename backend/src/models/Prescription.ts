import mongoose, { Schema, Document } from 'mongoose';
import { IVitals } from './Visit.js';

export interface IMedicine {
  name: string;
  genericName?: string;
  dosage: string;
  form: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface IIcd10Code {
  code: string;
  description: string;
}

export interface IPrescription extends Document {
  prescriptionNumber: string;
  clinicId: mongoose.Types.ObjectId;
  visitId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  prescriptionDate: Date;
  vitals?: IVitals;
  chiefComplaints: string[];
  clinicalObservations?: string;
  diagnosis: string[];
  icd10Codes: IIcd10Code[];
  medicines: IMedicine[];
  labTests: string[];
  advice?: string;
  dietaryRestrictions?: string;
  followUpDays?: number;
  followUpDate?: Date;
  isFinalized: boolean;
  finalizedAt?: Date;
  digitalSignature?: string;
  doctorRegNumber?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true },
    genericName: { type: String },
    dosage: { type: String, required: true },
    form: {
      type: String,
      enum: ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other'],
      default: 'Tablet'
    },
    frequency: { type: String, required: true }, // e.g. "1-0-1", "Once Daily", "SOS"
    duration: { type: String, required: true },  // e.g. "5 days"
    instructions: { type: String },              // e.g. "After food"
    quantity: { type: Number, min: 1, default: 1 }
  },
  { _id: false }
);

const Icd10Schema = new Schema<IIcd10Code>(
  {
    code: { type: String, required: true },
    description: { type: String, required: true }
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionNumber: { type: String, required: true, unique: true, index: true },
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    prescriptionDate: { type: Date, default: Date.now, index: true },
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
    chiefComplaints: { type: [String], default: [] },
    clinicalObservations: { type: String },
    diagnosis: { type: [String], default: [] },
    icd10Codes: { type: [Icd10Schema], default: [] },
    medicines: { type: [MedicineSchema], default: [] },
    labTests: { type: [String], default: [] },
    advice: { type: String },
    dietaryRestrictions: { type: String },
    followUpDays: { type: Number },
    followUpDate: { type: Date },
    isFinalized: { type: Boolean, default: false, index: true },
    finalizedAt: { type: Date },
    digitalSignature: { type: String },
    doctorRegNumber: { type: String },
    pdfUrl: { type: String }
  },
  { timestamps: true }
);

PrescriptionSchema.index({ clinicId: 1, patientId: 1, prescriptionDate: -1 });
PrescriptionSchema.index({ clinicId: 1, doctorId: 1, prescriptionDate: -1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
