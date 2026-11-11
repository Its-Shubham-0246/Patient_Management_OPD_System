import mongoose, { Schema, Document } from 'mongoose';

export interface IClinicSetting extends Document {
  clinicName: string;
  clinicPrefix: string;
  tagline?: string;
  logoUrl?: string;
  registrationNumber: string;
  gstin?: string;
  contact: {
    phone: string;
    emergencyHotline: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  operatingHours: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    shifts: Array<{ openTime: string; closeTime: string }>;
  }>;
  holidays: Array<{
    date: Date;
    reason: string;
    isRecurringYearly?: boolean;
  }>;
  departments: string[];
  appointmentRules: {
    maxAdvanceBookingDays: number;
    cancellationCutoffHours: number;
    defaultSlotDurationMinutes: number;
    allowWalkIns: boolean;
    allocationMode: 'AUTOMATIC' | 'PATIENT_CHOICE' | 'HYBRID';
    autoAllocationWeights: {
      confirmedWeight: number;
      queueWeight: number;
      activeConsultationWeight: number;
    };
    allowReceptionistOverride: boolean;
    overrideRequiresReason: boolean;
  };
  billingRules: {
    currency: string;
    defaultConsultationFee: number;
    followUpFreeDays: number;
    taxRatePercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClinicSettingSchema = new Schema<IClinicSetting>(
  {
    clinicName: { type: String, required: true, default: 'City Health Care Clinic' },
    clinicPrefix: { type: String, required: true, default: 'OPD' },
    tagline: { type: String, default: 'Comprehensive Outpatient Healthcare' },
    logoUrl: { type: String },
    registrationNumber: { type: String, default: 'CEA-2024-88419' },
    gstin: { type: String },
    contact: {
      phone: { type: String, default: '011-23456789' },
      emergencyHotline: { type: String, default: '102' },
      email: { type: String, default: 'contact@cityhealthcare.in' },
      address: {
        street: { type: String, default: '14 Healthcare Enclave, Main Ring Road' },
        city: { type: String, default: 'New Delhi' },
        state: { type: String, default: 'Delhi' },
        postalCode: { type: String, default: '110001' }
      }
    },
    operatingHours: [
      {
        dayOfWeek: { type: Number, required: true },
        isOpen: { type: Boolean, default: true },
        shifts: [
          {
            openTime: { type: String, default: '09:00' },
            closeTime: { type: String, default: '20:00' }
          }
        ]
      }
    ],
    holidays: [
      {
        date: { type: Date, required: true },
        reason: { type: String, required: true },
        isRecurringYearly: { type: Boolean, default: false }
      }
    ],
    departments: {
      type: [String],
      default: ['General Medicine', 'Orthopedics', 'Gynecology', 'Pediatrics', 'Dermatology']
    },
    appointmentRules: {
      maxAdvanceBookingDays: { type: Number, default: 14 },
      cancellationCutoffHours: { type: Number, default: 4 },
      defaultSlotDurationMinutes: { type: Number, default: 15 },
      allowWalkIns: { type: Boolean, default: true },
      allocationMode: {
        type: String,
        enum: ['AUTOMATIC', 'PATIENT_CHOICE', 'HYBRID'],
        default: 'AUTOMATIC'
      },
      autoAllocationWeights: {
        confirmedWeight: { type: Number, default: 1.0 },
        queueWeight: { type: Number, default: 1.25 },
        activeConsultationWeight: { type: Number, default: 1.5 }
      },
      allowReceptionistOverride: { type: Boolean, default: true },
      overrideRequiresReason: { type: Boolean, default: true }
    },
    billingRules: {
      currency: { type: String, default: 'INR' },
      defaultConsultationFee: { type: Number, default: 500 },
      followUpFreeDays: { type: Number, default: 7 },
      taxRatePercentage: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const ClinicSetting = mongoose.model<IClinicSetting>('ClinicSetting', ClinicSettingSchema);

