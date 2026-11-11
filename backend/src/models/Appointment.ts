import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  clinicId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  timeSlot: string; // e.g. "10:15"
  slotDurationMinutes: number;
  bookingChannel: 'ONLINE_PATIENT' | 'RECEPTIONIST_WALKIN' | 'RECEPTIONIST_PHONE' | 'DOCTOR_FOLLOWUP';
  status: 'SCHEDULED' | 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancellationReason?: string;
  notes?: string;
  tokenNumber?: number;
  allocationDetails?: {
    method: 'AUTOMATIC' | 'PATIENT_CHOICE' | 'RECEPTIONIST_OVERRIDE';
    workloadIndexAtAllocation: number;
    recommendedDoctorId?: mongoose.Types.ObjectId;
    overrideReason?: string;
    overriddenBy?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    appointmentDate: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 15 },
    bookingChannel: {
      type: String,
      enum: ['ONLINE_PATIENT', 'RECEPTIONIST_WALKIN', 'RECEPTIONIST_PHONE', 'DOCTOR_FOLLOWUP'],
      default: 'RECEPTIONIST_WALKIN'
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CONFIRMED', 'WAITLISTED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'CONFIRMED',
      index: true
    },
    cancellationReason: { type: String },
    notes: { type: String },
    tokenNumber: { type: Number },
    allocationDetails: {
      method: {
        type: String,
        enum: ['AUTOMATIC', 'PATIENT_CHOICE', 'RECEPTIONIST_OVERRIDE'],
        default: 'PATIENT_CHOICE'
      },
      workloadIndexAtAllocation: { type: Number, default: 0 },
      recommendedDoctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
      overrideReason: { type: String },
      overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
  },
  { timestamps: true }
);

AppointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['CANCELLED', 'NO_SHOW'] } }
  }
);

AppointmentSchema.index({ clinicId: 1, appointmentDate: 1, status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);

