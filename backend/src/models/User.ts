import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface IUser extends Document {
  clinicId: mongoose.Types.ObjectId;
  fullName: string;
  email?: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  doctorProfileId?: mongoose.Types.ObjectId;
  patientProfileId?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementFailedLogins(): Promise<void>;
  resetFailedLogins(): Promise<void>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'],
      required: true,
      default: 'PATIENT'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'LOCKED'],
      default: 'ACTIVE'
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    doctorProfileId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    patientProfileId: { type: Schema.Types.ObjectId, ref: 'Patient' }
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ clinicId: 1, phone: 1 }, { unique: true });
UserSchema.index({ clinicId: 1, email: 1 }, { unique: true, sparse: true });

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementFailedLogins = async function (): Promise<void> {
  // If previously locked and lock expired, reset
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
    this.status = 'ACTIVE';
  } else {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
      // Lock for 30 minutes
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      this.status = 'LOCKED';
    }
  }
  await this.save();
};

UserSchema.methods.resetFailedLogins = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  if (this.status === 'LOCKED') {
    this.status = 'ACTIVE';
  }
  this.lastLoginAt = new Date();
  await this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema);

