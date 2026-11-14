import mongoose from 'mongoose';
import nodemailer, { Transporter } from 'nodemailer';
import { Notification, INotification, NotificationType, NotificationEvent, NotificationChannel } from '../models/Notification.js';

// ============================================================================
// 1. TRAI DLT Compliant SMS Templates & Registry
// ============================================================================
export interface DltTemplateDefinition {
  templateId: string;
  header: string; // 6-character registered header, e.g. SMROPD
  title: string;
  templatePattern: string;
  render: (data: Record<string, any>) => string;
}

export const DLT_SMS_TEMPLATES: Record<string, DltTemplateDefinition> = {
  APPT_CONFIRMED: {
    templateId: '1107168923450012',
    header: 'SMROPD',
    title: 'Appointment Confirmation',
    templatePattern: 'Dear {#var#}, your appointment with Dr. {#var#} at {#var#} is confirmed for {#var#} at {#var#}. Ref: #{#var#}. Arrive 15m early. - {#var#}',
    render: (data) =>
      `Dear ${sanitizeDltVar(data.patientName || 'Patient')}, your appointment with Dr. ${sanitizeDltVar(data.doctorName || 'Doctor')} at ${sanitizeDltVar(data.clinicName || 'Smart OPD')} is confirmed for ${sanitizeDltVar(data.date || 'Today')} at ${sanitizeDltVar(data.time || '10:00 AM')}. Ref: #${sanitizeDltVar(data.appointmentRef || 'APT-001')}. Arrive 15m early. - SMROPD`
  },
  CHECKIN_TOKEN_ISSUED: {
    templateId: '1107168923450013',
    header: 'SMROPD',
    title: 'OPD Token Issued',
    templatePattern: 'Welcome to {#var#}. Your OPD Token is #{#var#} for Dr. {#var#}. Est. wait: ~{#var#} mins. View live queue on your phone: {#var#} - {#var#}',
    render: (data) =>
      `Welcome to ${sanitizeDltVar(data.clinicName || 'Smart OPD')}. Your OPD Token is #${sanitizeDltVar(data.tokenNumber || '1')} for Dr. ${sanitizeDltVar(data.doctorName || 'Doctor')}. Est. wait: ~${sanitizeDltVar(data.waitTime || '15')} mins. View live queue on your phone: ${sanitizeDltVar(data.queueUrl || 'smartopd.in')} - SMROPD`
  },
  QUEUE_NEXT_CALLED: {
    templateId: '1107168923450014',
    header: 'SMROPD',
    title: 'Token Called Alert',
    templatePattern: 'ALERT: Dr. {#var#} is ready to see you now in Room #{#var#}. Token #{#var#}. Please proceed immediately to the consultation room. - {#var#}',
    render: (data) =>
      `ALERT: Dr. ${sanitizeDltVar(data.doctorName || 'Doctor')} is ready to see you now in Room #${sanitizeDltVar(data.roomNumber || '1')}. Token #${sanitizeDltVar(data.tokenNumber || '1')}. Please proceed immediately to the consultation room. - SMROPD`
  },
  FOLLOWUP_REMINDER: {
    templateId: '1107168923450015',
    header: 'SMROPD',
    title: 'Follow-up Visit Reminder',
    templatePattern: 'Dear {#var#}, reminder for your recommended follow-up visit with Dr. {#var#} at {#var#} due on {#var#}. Book online at {#var#} - {#var#}',
    render: (data) =>
      `Dear ${sanitizeDltVar(data.patientName || 'Patient')}, reminder for your recommended follow-up visit with Dr. ${sanitizeDltVar(data.doctorName || 'Doctor')} at ${sanitizeDltVar(data.clinicName || 'Smart OPD')} due on ${sanitizeDltVar(data.dueDate || 'Soon')}. Book online at ${sanitizeDltVar(data.portalUrl || 'smartopd.in')} - SMROPD`
  },
  DOCTOR_LEAVE_NOTICE: {
    templateId: '1107168923450016',
    header: 'SMROPD',
    title: 'Doctor Leave Alert',
    templatePattern: 'URGENT: Dr. {#var#} is unavailable on {#var#}. Your appointment #{#var#} at {#var#} requires rescheduling. Reschedule with priority here: {#var#} - {#var#}',
    render: (data) =>
      `URGENT: Dr. ${sanitizeDltVar(data.doctorName || 'Doctor')} is unavailable on ${sanitizeDltVar(data.date || 'Today')}. Your appointment #${sanitizeDltVar(data.appointmentRef || 'APT')} at ${sanitizeDltVar(data.clinicName || 'Smart OPD')} requires rescheduling. Reschedule with priority here: ${sanitizeDltVar(data.portalUrl || 'smartopd.in')} - SMROPD`
  },
  INVOICE_GENERATED: {
    templateId: '1107168923450017',
    header: 'SMROPD',
    title: 'Billing Receipt Notice',
    templatePattern: 'Dear {#var#}, invoice #{#var#} of Rs. {#var#} has been generated for your OPD visit at {#var#}. Status: {#var#}. - {#var#}',
    render: (data) =>
      `Dear ${sanitizeDltVar(data.patientName || 'Patient')}, invoice #${sanitizeDltVar(data.invoiceNumber || 'INV')} of Rs. ${sanitizeDltVar(data.amount || '0')} has been generated for your OPD visit at ${sanitizeDltVar(data.clinicName || 'Smart OPD')}. Status: ${sanitizeDltVar(data.status || 'PAID')}. - SMROPD`
  },
  PRESCRIPTION_READY: {
    templateId: '1107168923450018',
    header: 'SMROPD',
    title: 'Digital Prescription Finalized',
    templatePattern: 'Dear {#var#}, your digital prescription for visit #{#var#} has been finalized by Dr. {#var#} at {#var#}. View online: {#var#} - {#var#}',
    render: (data) =>
      `Dear ${sanitizeDltVar(data.patientName || 'Patient')}, your digital prescription for visit #${sanitizeDltVar(data.visitRef || 'VST')} has been finalized by Dr. ${sanitizeDltVar(data.doctorName || 'Doctor')} at ${sanitizeDltVar(data.clinicName || 'Smart OPD')}. View online: ${sanitizeDltVar(data.rxUrl || 'smartopd.in')} - SMROPD`
  }
};

/**
 * Strips special characters, carriage returns, or HTML tags that violate TRAI DLT validation
 */
export function sanitizeDltVar(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 35); // Keep variable length controlled
}

// ============================================================================
// 2. Responsive Healthcare HTML Email Generator
// ============================================================================
export interface EmailPayload {
  to: string;
  subject: string;
  clinicName?: string;
  patientName?: string;
  heading: string;
  bodyHtml: string;
  actionText?: string;
  actionUrl?: string;
}

export function generateHealthcareEmailHtml(payload: EmailPayload): string {
  const clinic = payload.clinicName || 'City Health Care Clinic';
  const actionButton =
    payload.actionText && payload.actionUrl
      ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payload.actionUrl}" style="background-color: #1e2d4a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          ${payload.actionText}
        </a>
      </div>
    `
      : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Healthcare Brand Header -->
          <tr>
            <td style="background-color: #1e2d4a; padding: 24px 28px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-weight: bold; border-radius: 6px; width: 28px; height: 28px; line-height: 28px; text-align: center; font-size: 16px; margin-right: 8px;">+</span>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; vertical-align: middle; letter-spacing: -0.2px;">${clinic}</span>
                  </td>
                  <td align="right" style="color: #93c5fd; font-size: 11px; font-weight: 500;">
                    Emergency: 108 / +91 98765 43210
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Notification Content -->
          <tr>
            <td style="padding: 32px 28px 20px 28px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                ${payload.heading}
              </h2>
              
              <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                ${payload.bodyHtml}
              </div>

              ${actionButton}

              <div style="margin-top: 24px; padding: 12px 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 12px; color: #64748b;">
                <strong>Clinical Note:</strong> If you are experiencing an acute emergency, please contact the clinic hotline or visit the nearest emergency medical center immediately.
              </div>
            </td>
          </tr>

          <!-- Footer & Indian DPDP Act Compliance -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">This is a confidential outpatient medical notification from <strong>${clinic}</strong>.</p>
              <p style="margin: 0 0 6px 0;">Protected under the <strong>DPDP Act 2023</strong> (Digital Personal Data Protection Act 2023). Intended solely for the registered patient or authorized guardian.</p>
              <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} ${clinic}. All clinical rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// 3. Nodemailer Email & SMS Dispatch Engine
// ============================================================================
let emailTransporter: Transporter | null = null;

function getEmailTransporter(): Transporter {
  if (!emailTransporter) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // In development or test, use json/stream transporter for deterministic delivery simulation
      emailTransporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }
  return emailTransporter;
}

export interface DispatchNotificationOptions {
  clinicId: string | mongoose.Types.ObjectId;
  recipientUserId?: string | mongoose.Types.ObjectId;
  recipientPatientId?: string | mongoose.Types.ObjectId;
  recipientRole?: 'ALL' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  type: NotificationType;
  event: NotificationEvent;
  channel?: NotificationChannel;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  email?: string;
  phone?: string;
  emailSubject?: string;
  emailHeading?: string;
  emailHtml?: string;
  io?: any;
}

export class NotificationService {
  /**
   * Primary entry point: stores in DB, sends email, sends SMS, and emits WebSocket event
   */
  static async send(options: DispatchNotificationOptions): Promise<INotification> {
    const deliveryLogs: Array<{
      channel: 'IN_APP' | 'EMAIL' | 'SMS';
      status: 'SENT' | 'DELIVERED' | 'FAILED';
      timestamp: Date;
      messageId?: string;
      error?: string;
      dltTemplateId?: string;
    }> = [];

    const channel = options.channel || 'IN_APP';

    // 1. Process SMS if channel includes SMS or MULTI, and phone is available
    if ((channel === 'SMS' || channel === 'MULTI') && options.phone) {
      try {
        const dlt = DLT_SMS_TEMPLATES[options.event] || DLT_SMS_TEMPLATES.APPT_CONFIRMED;
        const renderedSms = dlt.render(options.metadata || { message: options.message });
        const smsId = `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        console.log(`[SMS Gateway DLT - ${dlt.header}] To: ${options.phone} (Template: ${dlt.templateId})`);
        console.log(`[SMS Body (${renderedSms.length} chars)]: ${renderedSms}`);

        deliveryLogs.push({
          channel: 'SMS',
          status: 'SENT',
          timestamp: new Date(),
          messageId: smsId,
          dltTemplateId: dlt.templateId
        });
      } catch (err: any) {
        deliveryLogs.push({
          channel: 'SMS',
          status: 'FAILED',
          timestamp: new Date(),
          error: err.message || 'SMS Gateway Error'
        });
      }
    }

    // 2. Process Email if channel includes EMAIL or MULTI, and email is available
    if ((channel === 'EMAIL' || channel === 'MULTI') && options.email) {
      try {
        const transporter = getEmailTransporter();
        const html =
          options.emailHtml ||
          generateHealthcareEmailHtml({
            to: options.email,
            subject: options.emailSubject || options.title,
            heading: options.emailHeading || options.title,
            bodyHtml: `<p>${options.message}</p>`,
            actionText: options.actionUrl ? 'Open Smart OPD' : undefined,
            actionUrl: options.actionUrl
          });

        const mailResult = await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Smart OPD Health Clinic" <notifications@smartopd.in>',
          to: options.email,
          subject: options.emailSubject || options.title,
          html
        });

        deliveryLogs.push({
          channel: 'EMAIL',
          status: 'SENT',
          timestamp: new Date(),
          messageId: mailResult?.messageId || `mail_${Date.now()}`
        });
      } catch (err: any) {
        deliveryLogs.push({
          channel: 'EMAIL',
          status: 'FAILED',
          timestamp: new Date(),
          error: err.message || 'Email Delivery Error'
        });
      }
    }

    // 3. Create MongoDB In-App Notification record
    deliveryLogs.push({
      channel: 'IN_APP',
      status: 'DELIVERED',
      timestamp: new Date()
    });

    const notification = await Notification.create({
      clinicId: options.clinicId,
      recipientUserId: options.recipientUserId,
      recipientPatientId: options.recipientPatientId,
      recipientRole: options.recipientRole || 'PATIENT',
      type: options.type,
      event: options.event,
      channel,
      title: options.title,
      message: options.message,
      actionUrl: options.actionUrl,
      metadata: options.metadata || {},
      deliveryStatus: deliveryLogs.some((l) => l.status === 'FAILED') ? 'FAILED' : 'SENT',
      deliveryLogs,
      isRead: false
    });

    // 4. Real-time WebSocket event dispatch
    if (options.io) {
      try {
        const payload = {
          id: notification._id,
          _id: notification._id,
          clinicId: notification.clinicId,
          type: notification.type,
          event: notification.event,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          createdAt: notification.createdAt,
          isRead: false
        };

        if (options.recipientUserId) {
          options.io.to(`user:${options.recipientUserId}`).emit('notification:new', payload);
        }
        if (options.recipientRole) {
          options.io.to(`role:${options.recipientRole}`).emit('notification:new', payload);
        }
        options.io.to(`clinic:${options.clinicId}`).emit('notification:new', payload);
      } catch (wsErr) {
        console.error('[WebSocket Notification Error]', wsErr);
      }
    }

    return notification;
  }

  // ==========================================================================
  // 4. Clinical Trigger Facades
  // ==========================================================================

  static async notifyAppointmentConfirmed(params: {
    clinicId: any;
    patientId?: any;
    userId?: any;
    patientName: string;
    doctorName: string;
    clinicName: string;
    date: string;
    time: string;
    appointmentRef: string;
    phone?: string;
    email?: string;
    io?: any;
  }) {
    const meta = {
      patientName: params.patientName,
      doctorName: params.doctorName,
      clinicName: params.clinicName,
      date: params.date,
      time: params.time,
      appointmentRef: params.appointmentRef
    };

    return this.send({
      clinicId: params.clinicId,
      recipientPatientId: params.patientId,
      recipientUserId: params.userId,
      recipientRole: 'PATIENT',
      type: 'APPOINTMENT',
      event: 'APPT_CONFIRMED',
      channel: params.phone || params.email ? 'MULTI' : 'IN_APP',
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${params.doctorName} is confirmed for ${params.date} at ${params.time}. Ref: #${params.appointmentRef}`,
      actionUrl: '/portal/dashboard',
      metadata: meta,
      phone: params.phone,
      email: params.email,
      emailSubject: `Appointment Confirmed with Dr. ${params.doctorName} - ${params.clinicName}`,
      emailHeading: 'Appointment Confirmed',
      emailHtml: generateHealthcareEmailHtml({
        to: params.email || '',
        subject: `Appointment Confirmed - ${params.clinicName}`,
        clinicName: params.clinicName,
        heading: 'Your Appointment is Confirmed',
        bodyHtml: `
          <p>Dear <strong>${params.patientName}</strong>,</p>
          <p>Your consultation appointment at <strong>${params.clinicName}</strong> has been successfully booked.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> Dr. ${params.doctorName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${params.date}</p>
            <p style="margin: 4px 0;"><strong>Time Slot:</strong> ${params.time}</p>
            <p style="margin: 4px 0;"><strong>Reference ID:</strong> #${params.appointmentRef}</p>
          </div>
          <p>Please arrive at the clinic 15 minutes before your time slot for OPD token check-in.</p>
        `,
        actionText: 'View in Patient Portal',
        actionUrl: 'http://localhost:5173/portal/dashboard'
      }),
      io: params.io
    });
  }

  static async notifyQueueTokenIssued(params: {
    clinicId: any;
    patientId?: any;
    userId?: any;
    patientName: string;
    doctorName: string;
    clinicName: string;
    tokenNumber: number;
    waitTime: number;
    phone?: string;
    io?: any;
  }) {
    const meta = {
      patientName: params.patientName,
      doctorName: params.doctorName,
      clinicName: params.clinicName,
      tokenNumber: params.tokenNumber,
      waitTime: params.waitTime,
      queueUrl: 'http://localhost:5173/portal/token'
    };

    return this.send({
      clinicId: params.clinicId,
      recipientPatientId: params.patientId,
      recipientUserId: params.userId,
      recipientRole: 'PATIENT',
      type: 'QUEUE',
      event: 'CHECKIN_TOKEN_ISSUED',
      channel: params.phone ? 'MULTI' : 'IN_APP',
      title: `OPD Token #${params.tokenNumber} Issued`,
      message: `Your OPD token #${params.tokenNumber} for Dr. ${params.doctorName} is active. Est. wait: ~${params.waitTime} mins.`,
      actionUrl: '/portal/token',
      metadata: meta,
      phone: params.phone,
      io: params.io
    });
  }

  static async notifyQueueCalled(params: {
    clinicId: any;
    patientId?: any;
    userId?: any;
    doctorName: string;
    roomNumber: string;
    tokenNumber: number;
    phone?: string;
    io?: any;
  }) {
    const meta = {
      doctorName: params.doctorName,
      roomNumber: params.roomNumber,
      tokenNumber: params.tokenNumber
    };

    return this.send({
      clinicId: params.clinicId,
      recipientPatientId: params.patientId,
      recipientUserId: params.userId,
      recipientRole: 'PATIENT',
      type: 'QUEUE',
      event: 'QUEUE_NEXT_CALLED',
      channel: params.phone ? 'MULTI' : 'IN_APP',
      title: `URGENT: Token #${params.tokenNumber} Called!`,
      message: `Dr. ${params.doctorName} is ready for Token #${params.tokenNumber} in Room #${params.roomNumber}. Please proceed immediately.`,
      actionUrl: '/portal/token',
      metadata: meta,
      phone: params.phone,
      io: params.io
    });
  }

  static async notifyPrescriptionReady(params: {
    clinicId: any;
    patientId?: any;
    userId?: any;
    patientName: string;
    doctorName: string;
    clinicName: string;
    visitRef: string;
    prescriptionId: any;
    phone?: string;
    email?: string;
    io?: any;
  }) {
    const meta = {
      patientName: params.patientName,
      doctorName: params.doctorName,
      clinicName: params.clinicName,
      visitRef: params.visitRef,
      rxUrl: `http://localhost:5173/portal/prescriptions`
    };

    return this.send({
      clinicId: params.clinicId,
      recipientPatientId: params.patientId,
      recipientUserId: params.userId,
      recipientRole: 'PATIENT',
      type: 'PRESCRIPTION',
      event: 'PRESCRIPTION_READY',
      channel: params.phone || params.email ? 'MULTI' : 'IN_APP',
      title: 'Digital Prescription Ready',
      message: `Dr. ${params.doctorName} has issued your e-Prescription for visit #${params.visitRef}.`,
      actionUrl: `/portal/prescriptions`,
      metadata: meta,
      phone: params.phone,
      email: params.email,
      emailSubject: `Your Digital Prescription - ${params.clinicName}`,
      emailHeading: 'Digital Prescription Ready',
      emailHtml: generateHealthcareEmailHtml({
        to: params.email || '',
        subject: `Your Digital Prescription - ${params.clinicName}`,
        clinicName: params.clinicName,
        heading: 'Your Prescription is Ready',
        bodyHtml: `
          <p>Dear <strong>${params.patientName}</strong>,</p>
          <p>Dr. ${params.doctorName} has finalized your outpatient consultation for visit #${params.visitRef}.</p>
          <p>Your signed digital prescription is now available to download and view securely from your patient portal.</p>
        `,
        actionText: 'View & Download Prescription',
        actionUrl: 'http://localhost:5173/portal/prescriptions'
      }),
      io: params.io
    });
  }

  static async notifyInvoiceGenerated(params: {
    clinicId: any;
    patientId?: any;
    userId?: any;
    patientName: string;
    clinicName: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    phone?: string;
    email?: string;
    io?: any;
  }) {
    const meta = {
      patientName: params.patientName,
      clinicName: params.clinicName,
      invoiceNumber: params.invoiceNumber,
      amount: params.amount,
      status: params.status
    };

    return this.send({
      clinicId: params.clinicId,
      recipientPatientId: params.patientId,
      recipientUserId: params.userId,
      recipientRole: 'PATIENT',
      type: 'BILLING',
      event: 'INVOICE_GENERATED',
      channel: params.phone || params.email ? 'MULTI' : 'IN_APP',
      title: `Invoice #${params.invoiceNumber} (${params.status.toUpperCase()})`,
      message: `Invoice #${params.invoiceNumber} for ₹${params.amount} is ${params.status}.`,
      actionUrl: `/reception/billing`,
      metadata: meta,
      phone: params.phone,
      email: params.email,
      emailSubject: `Receipt for Invoice #${params.invoiceNumber} - ${params.clinicName}`,
      emailHeading: 'Outpatient Billing Receipt',
      emailHtml: generateHealthcareEmailHtml({
        to: params.email || '',
        subject: `Receipt for Invoice #${params.invoiceNumber} - ${params.clinicName}`,
        clinicName: params.clinicName,
        heading: `Invoice #${params.invoiceNumber}`,
        bodyHtml: `
          <p>Dear <strong>${params.patientName}</strong>,</p>
          <p>An official tax invoice has been generated for your OPD encounter at <strong>${params.clinicName}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${params.invoiceNumber}</p>
            <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${params.amount.toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${params.status.toUpperCase()}</p>
          </div>
          <p>Thank you for choosing ${params.clinicName}.</p>
        `,
        actionText: 'View Invoice',
        actionUrl: 'http://localhost:5173/portal/invoices'
      }),
      io: params.io
    });
  }

  static async notifyFollowUpReminder(params: {
    clinicId: any;
    patientId?: any;
    userId?: any;
    patientName: string;
    doctorName: string;
    clinicName: string;
    dueDate: string;
    phone?: string;
    email?: string;
    io?: any;
  }) {
    const meta = {
      patientName: params.patientName,
      doctorName: params.doctorName,
      clinicName: params.clinicName,
      dueDate: params.dueDate,
      portalUrl: 'http://localhost:5173/portal/book'
    };

    return this.send({
      clinicId: params.clinicId,
      recipientPatientId: params.patientId,
      recipientUserId: params.userId,
      recipientRole: 'PATIENT',
      type: 'APPOINTMENT',
      event: 'FOLLOWUP_REMINDER',
      channel: params.phone || params.email ? 'MULTI' : 'IN_APP',
      title: 'Follow-up Visit Due Reminder',
      message: `Reminder: Your recommended follow-up visit with Dr. ${params.doctorName} is due on ${params.dueDate}.`,
      actionUrl: '/portal/book',
      metadata: meta,
      phone: params.phone,
      email: params.email,
      io: params.io
    });
  }
}

