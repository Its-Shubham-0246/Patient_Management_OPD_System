import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  clinicId: mongoose.Types.ObjectId;
  action: string;
  actorUserId: mongoose.Types.ObjectId;
  actorRole: string;
  patientId?: mongoose.Types.ObjectId;
  targetResourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'ClinicSetting', required: true, index: true },
    action: {
      type: String,
      required: true,
      index: true
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', index: true },
    targetResourceId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true
  }
);

// Retention Index (DPDP Act 2023 - 3-year audit trail retention)
AuditLogSchema.index({ clinicId: 1, action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

