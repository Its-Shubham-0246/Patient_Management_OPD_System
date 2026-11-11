# Smart OPD – Notification System Specification

> **Document ID:** 13_NOTIFICATION_SYSTEM  
> **Version:** 1.0.0  
> **Status:** Approved Architecture  
> **Last Updated:** 2026-11-11  
> **Applicable Stack:** Node.js · Express · MongoDB · Socket.IO · Nodemailer · SendGrid · Twilio / MSG91  

---

## 1. Executive Summary & Architecture Overview

The **Smart OPD Notification System** provides timely, multi-channel communication across the outpatient journey. Effective patient notifications significantly reduce appointment no-shows, optimize waiting room flow, ensure timely medication compliance, and keep clinical personnel synchronized.

The system supports three delivery modalities:
1. **In-App Alerts**: Real-time popover notifications delivered over Socket.IO and stored in MongoDB for historic access.
2. **Email Notifications**: Responsive HTML email templates generated using server-side templates and sent via transactional providers (SendGrid / Nodemailer SMTP).
3. **SMS Alerts**: Compact, high-priority transactional SMS alerts sent via gateways (Twilio or MSG91 with DLT template registration for Indian clinics).

```
                      ┌──────────────────────────────────────────────┐
                      │              Clinical Action                 │
                      │  (e.g., Booking, Check-In, Rx Issued, Queue) │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          Event Dispatcher Service            │
                      │          (EventEmitter / Pub-Sub)            │
                      └──────────────┬───────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   In-App Engine    │    │    Email Engine    │    │     SMS Engine     │
│ (Socket.IO + Mongo)│    │ (SendGrid / SMTP)  │    │  (Twilio / MSG91)  │
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                         │                         │
           ▼                         ▼                         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ In-App Bell Menu   │    │ Patient/Doc Inbox  │    │ Mobile Device      │
└────────────────────┘    └────────────────────┘    └────────────────────┘
```

---

## 2. Trigger Events & Delivery Matrix

| Event Code | Trigger Condition | Target Recipient(s) | Channels Enabled | Default Timing | Criticality |
|---|---|---|---|---|---|
| `APPT_CONFIRMED` | Patient or Receptionist books appointment | Patient | Email + In-App + SMS | Immediate (< 10 sec) | Medium |
| `APPT_REMINDER_24H` | 24 hours prior to scheduled appointment | Patient | Email + SMS | Scheduled Cron (T-24h) | High |
| `APPT_CANCELLED` | Appointment cancelled by patient or clinic | Patient + Doctor | Email + In-App + SMS | Immediate | High |
| `APPT_RESCHEDULED` | Appointment slot or date changed | Patient | Email + In-App + SMS | Immediate | High |
| `CHECKIN_TOKEN_ISSUED` | Patient arrives, checked in at reception | Patient | SMS + In-App | Immediate (< 5 sec) | High |
| `QUEUE_NEXT_CALLED` | Doctor clicks "Call Next" in OPD console | Patient | SMS + Audio/Display | Immediate (< 3 sec) | Critical |
| `QUEUE_DELAY_ALERT` | Doctor running > 30 mins behind schedule | Waiting Patients | SMS + In-App | Triggered by Doctor | Medium |
| `PRESCRIPTION_READY` | Doctor completes consultation & finalizes Rx | Patient | In-App + Email (with PDF) | Immediate | Medium |
| `REPORT_UPLOADED` | Lab / Radiology report attached to record | Patient | In-App + Email alert | Immediate | Low |
| `FOLLOWUP_REMINDER` | 48 hours prior to recommended follow-up date | Patient | Email + SMS | Scheduled Cron (T-48h) | Medium |
| `INVOICE_GENERATED` | Billing invoice finalized by cashier | Patient | In-App + Email (Receipt) | Immediate | Low |
| `DOCTOR_LEAVE_NOTICE` | Doctor marks emergency leave / holiday | Affected Patients | Email + SMS + In-App | Immediate upon leave approval | Critical |

---

## 3. Email Notification Specifications

All emails are generated using a consistent healthcare design system:
- **Max Width**: 600px container, centered.
- **Header**: Clinic logo, {{CLINIC_NAME}}, and emergency contact hotline.
- **Palette**: Medical deep navy (`#1e2d4a`), clinical blue (`#3b6fce`), light slate background (`#f8fafc`).
- **Footer**: Clinic physical address, unsubscribe/notification preferences link, and legal disclaimer: *"This is a confidential medical notification from {{CLINIC_NAME}}."*

### 3.1 Template: `APPT_CONFIRMED`
- **Subject**: Appointment Confirmed with Dr. {{DOCTOR_NAME}} – {{CLINIC_NAME}}
- **Body Elements**:
  - Salutation: Dear {{PATIENT_NAME}},
  - Confirmation Banner: "Your appointment is confirmed."
  - Appointment Summary Table:
    - **Doctor**: Dr. {{DOCTOR_NAME}} ({{SPECIALTY}})
    - **Date & Time**: {{APPOINTMENT_DATE}} at {{APPOINTMENT_TIME}}
    - **Consultation Room**: Room {{ROOM_NUMBER}}
    - **Appointment Reference**: `#{{APPOINTMENT_ID}}`
  - Action Button (CTA): "View Appointment Details" (links to patient portal)
  - Preparation Note: "Please arrive 15 minutes before your scheduled time for OPD check-in."

### 3.2 Template: `PRESCRIPTION_READY`
- **Subject**: Your Digital Prescription from {{CLINIC_NAME}} – Visit #{{VISIT_ID}}
- **Body Elements**:
  - Salutation: Dear {{PATIENT_NAME}},
  - Message: "Dr. {{DOCTOR_NAME}} has finalized your consultation and issued your digital prescription."
  - Key Diagnosis Summary: {{PRIMARY_DIAGNOSIS}}
  - Attachment: Secure link to download official signed PDF (`prescription_{{VISIT_ID}}.pdf`).
  - Clinic Advice: "Please follow the prescribed dosage instructions carefully. If you experience adverse reactions, contact {{CLINIC_PHONE}} immediately."

### 3.3 Template: `DOCTOR_LEAVE_NOTICE`
- **Subject**: Urgent: Rescheduling Required for Your Appointment at {{CLINIC_NAME}}
- **Body Elements**:
  - Alert Banner: "Doctor Unavailability Notice"
  - Description: "Due to unforeseen circumstances, Dr. {{DOCTOR_NAME}} will be unavailable on {{APPOINTMENT_DATE}}."
  - Priority Rescheduling Options: Link with 1-click VIP rescheduling pass or direct reception phone number.

---

## 4. SMS Notification Specifications

Due to telecommunication regulations (specifically TRAI DLT guidelines in India and global SMS carrier length limitations), SMS messages are strictly throttled to single SMS limits (160 standard GSM characters) where possible and avoid medical jargon that violates privacy when displayed on locked phone screens.

### 4.1 SMS Templates (DLT Registered Standard)

```
[APPT_CONFIRMED]
Dear {#var#}, your appointment with Dr. {#var#} at {#var#} is confirmed for {#var#} at {#var#}. Ref: {#var#}. Arrive 15m early. - {#var#}

[CHECKIN_TOKEN_ISSUED]
Welcome to {#var#}. Your OPD Token is #{#var#} for Dr. {#var#}. Est. wait: {#var#} mins. Track live queue at: {#var#}

[QUEUE_NEXT_CALLED]
ALERT: Dr. {#var#} is ready to see you now in Room #{#var#}. Token #{#var#}. Please proceed immediately. - {#var#}

[FOLLOWUP_REMINDER]
Dear {#var#}, this is a reminder for your recommended follow-up visit with Dr. {#var#} at {#var#} due on {#var#}. Book: {#var#}
```

---

## 5. In-App Notification Engine

### 5.1 MongoDB Notification Schema

```typescript
export interface INotification {
  _id: mongoose.Types.ObjectId;
  clinicId: mongoose.Types.ObjectId;
  recipientUserId: mongoose.Types.ObjectId;
  type: 
    | 'APPOINTMENT'
    | 'QUEUE'
    | 'PRESCRIPTION'
    | 'REPORT'
    | 'BILLING'
    | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Real-time Socket.IO Delivery
When an event occurs:
1. Document is inserted into MongoDB `notifications` collection.
2. Backend emits to user's dedicated personal room:
   ```typescript
   io.to(`user:${recipientUserId}`).emit('notification:new', {
     id: notification._id,
     type: notification.type,
     title: notification.title,
     message: notification.message,
     actionUrl: notification.actionUrl,
     createdAt: notification.createdAt
   });
   ```
3. Frontend React Client listener (`useNotifications`) automatically increments the unread notification badge and triggers a toast notification (via `sonner` or `shadcn/ui` toast).

---

## 6. Provider Configuration & Failover Strategy

### 6.1 Email Providers
- **Primary Driver**: Nodemailer SMTP (for self-hosted or clinic mail servers) or SendGrid Web API.
- **Failover / Retry**: Exponential backoff (retries at 1m, 5m, 15m). Failed messages are logged with HTTP error codes.

### 6.2 SMS Providers
- **Primary Driver**: Twilio (Global) / MSG91 (India DLT Compliant).
- **Fallback**: If SMS API returns error (e.g., DLT failure or invalid phone number), notification falls back to WhatsApp API (if configured) or flags Receptionist dashboard for manual phone call reminder.

---

## 7. Patient Privacy & Notification Preferences

Under the **Digital Personal Data Protection (DPDP) Act 2023**:
- Patients must have the ability to toggle non-essential marketing / health check-up notifications.
- **Mandatory Exemption**: Direct clinical appointment confirmations, token call alerts, and billing receipts are categorized as *Essential Health Services* and cannot be completely muted without canceling the visit.
- Notification logs are retained for **90 days** and then archived to cold storage to ensure data minimization.
