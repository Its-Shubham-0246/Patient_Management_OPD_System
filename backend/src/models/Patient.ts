import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientDocument {
  _id?: mongoose.Types.ObjectId;
  title: string;
  docType: 'LAB_REPORT' | 'IMAGING' | 'PREVIOUS_PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'OTHER';
  fileUrl: string;
  uploadedAt: Date;
  notes?: string;
}

export interface IChronicCondition {
  condition: string;
  diagnosedYear?: number;
  medications?: string;
  notes?: string;
}

export interface IPatient extends Document {
  clinicId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  uhid: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  age?: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  medicalHistory: IChronicCondition[];
  documents: IPatientDocument[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  consentGiven: boolean;
  consentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatientDocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    docType: {
      type: String,
      enum: ['LAB_REPORT', 'IMAGING', 'PREVIOUS_PRESCRIPTION', 'DISCHARGE_SUMMARY', 'OTHER'],
      default: 'LAB_REPORT'
    },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true }
  },
  { _id: true }
);

const ChronicConditionSchema = new Schema(
  {
    condition: { type: String, required: true, trim: true },
    diagnosedYear: { type: Number },
    medications: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  { _id: true }
);

const PatientSchema = new Schema<IPatient>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    uhid: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    medicalHistory: [ChronicConditionSchema],
    documents: [PatientDocumentSchema],
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true }
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    consentGiven: { type: Boolean, default: true },
    consentDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

PatientSchema.index({ clinicId: 1, phone: 1 });
PatientSchema.index({ clinicId: 1, uhid: 1 });
PatientSchema.index({ clinicId: 1, fullName: 'text', uhid: 'text' });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);

export const generateNextUHID = async (clinicPrefix: string = 'OPD'): Promise<string> => {
  const now = new Date();
  const yearSuffix = now.getFullYear().toString().slice(-2);
  const monthSuffix = (now.getMonth() + 1).toString().padStart(2, '0');
  const periodPrefix = `${clinicPrefix}-${yearSuffix}${monthSuffix}`;

  // Find the highest sequence number for this month
  const lastPatient = await Patient.findOne({
    uhid: new RegExp(`^${periodPrefix}-`)
  })
    .sort({ uhid: -1 })
    .select('uhid')
    .lean();

  let nextSequence = 1;
  if (lastPatient && lastPatient.uhid) {
    const parts = lastPatient.uhid.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  return `${periodPrefix}-${nextSequence.toString().padStart(5, '0')}`;
};
