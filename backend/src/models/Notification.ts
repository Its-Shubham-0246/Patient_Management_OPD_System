import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'APPOINTMENT'
  | 'QUEUE'
  | 'PRESCRIPTION'
  | 'REPORT'
  | 'BILLING'
  | 'SYSTEM';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'MULTI';

export type NotificationEvent =
  | 'APPT_CONFIRMED'
  | 'APPT_REMINDER_24H'
  | 'APPT_CANCELLED'
  | 'APPT_RESCHEDULED'
  | 'CHECKIN_TOKEN_ISSUED'
  | 'QUEUE_NEXT_CALLED'
  | 'QUEUE_DELAY_ALERT'
  | 'PRESCRIPTION_READY'
  | 'REPORT_UPLOADED'
  | 'FOLLOWUP_REMINDER'
  | 'INVOICE_GENERATED'
  | 'DOCTOR_LEAVE_NOTICE'
  | 'SYSTEM_ALERT';

export interface IDeliveryLog {
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  timestamp: Date;
  messageId?: string;
  error?: string;
  dltTemplateId?: string;
}

export interface INotification extends Document {
  clinicId: mongoose.Types.ObjectId;
  recipientUserId?: mongoose.Types.ObjectId;
  recipientPatientId?: mongoose.Types.ObjectId;
  recipientRole?: 'ALL' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  type: NotificationType;
  event: NotificationEvent;
  channel: NotificationChannel;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  deliveryLogs: IDeliveryLog[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryLogSchema = new Schema<IDeliveryLog>(
  {
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS'],
      required: true
    },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'FAILED'],
      default: 'SENT'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageId: {
      type: String
    },
    error: {
      type: String
    },
    dltTemplateId: {
      type: String
    }
  },
  { _id: false }
);

const NotificationSchema = new Schema<INotification>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'ClinicSetting',
      required: true,
      index: true
    },
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    recipientPatientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['ALL', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'],
      default: 'PATIENT',
      index: true
    },
    type: {
      type: String,
      enum: ['APPOINTMENT', 'QUEUE', 'PRESCRIPTION', 'REPORT', 'BILLING', 'SYSTEM'],
      required: true,
      index: true
    },
    event: {
      type: String,
      enum: [
        'APPT_CONFIRMED',
        'APPT_REMINDER_24H',
        'APPT_CANCELLED',
        'APPT_RESCHEDULED',
        'CHECKIN_TOKEN_ISSUED',
        'QUEUE_NEXT_CALLED',
        'QUEUE_DELAY_ALERT',
        'PRESCRIPTION_READY',
        'REPORT_UPLOADED',
        'FOLLOWUP_REMINDER',
        'INVOICE_GENERATED',
        'DOCTOR_LEAVE_NOTICE',
        'SYSTEM_ALERT'
      ],
      default: 'SYSTEM_ALERT',
      index: true
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS', 'MULTI'],
      default: 'IN_APP'
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    actionUrl: {
      type: String,
      trim: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      default: 'SENT'
    },
    deliveryLogs: [DeliveryLogSchema],
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal queries and DPDP 90-day retention policies
NotificationSchema.index({ clinicId: 1, recipientUserId: 1, isRead: 1 });
NotificationSchema.index({ clinicId: 1, recipientRole: 1, isRead: 1 });
NotificationSchema.index({ clinicId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

