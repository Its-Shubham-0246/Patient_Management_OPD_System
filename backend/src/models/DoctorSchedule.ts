import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorSchedule extends Document {
  clinicId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  shifts: Array<{
    startTime: string; // "09:00"
    endTime: string;   // "13:00"
    slotDurationMinutes: number; // default: 15
    maxPatientsPerShift: number; // default: 16
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorScheduleSchema = new Schema<IDoctorSchedule>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    shifts: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        slotDurationMinutes: { type: Number, default: 15 },
        maxPatientsPerShift: { type: Number, default: 16 }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

DoctorScheduleSchema.index({ clinicId: 1, doctorId: 1, dayOfWeek: 1 }, { unique: true });

export const DoctorSchedule = mongoose.model<IDoctorSchedule>('DoctorSchedule', DoctorScheduleSchema);

