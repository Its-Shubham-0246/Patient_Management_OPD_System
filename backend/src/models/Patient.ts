import mongoose, { Schema, Document } from 'mongoose';

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
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
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
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String }
    },
    consentGiven: { type: Boolean, default: true },
    consentDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

PatientSchema.index({ clinicId: 1, phone: 1 });
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

