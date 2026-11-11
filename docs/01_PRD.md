# Product Requirements Document (PRD)
# Smart OPD — Clinic Management Platform

| Field | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Status** | Draft |
| **Date** | 2026-11-11 |
| **Owner** | Product Team |
| **Classification** | Internal — Confidential |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Stakeholders](#2-stakeholders)
3. [Scope](#3-scope)
4. [User Personas](#4-user-personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Stories](#7-user-stories)
8. [Business Rules](#8-business-rules)
9. [Assumptions and Dependencies](#9-assumptions-and-dependencies)
10. [Constraints](#10-constraints)
11. [Open Questions / Decisions Pending](#11-open-questions--decisions-pending)
12. [Glossary](#12-glossary)

---

## 1. Executive Summary

### 1.1 Product Vision

**Smart OPD** is a modern, cloud-ready Outpatient Department (OPD) management platform designed for single-clinic deployments. It digitalises and streamlines every patient touchpoint — from first-time registration through consultation, prescription, billing, and follow-up — eliminating paper-based workflows and reducing administrative overhead for {{CLINIC_NAME}}.

The platform is architected as a full-stack MERN application (MongoDB, Express.js, React, Node.js) enriched with real-time capabilities (Socket.IO), type-safe frontend tooling (TypeScript, Zod, React Hook Form), and production-grade UI components (shadcn/ui, Tailwind CSS). It is designed to be configurable per clinic without requiring code changes.

### 1.2 Product Goals

| # | Goal | Metric |
|---|---|---|
| G-01 | Reduce average patient wait time | ≤ {{TARGET_WAIT_MINUTES}} minutes average queue time |
| G-02 | Eliminate paper prescriptions and reports | 100 % of prescriptions issued as PDF |
| G-03 | Increase appointment no-show rate visibility | Real-time no-show dashboard |
| G-04 | Provide auditable, role-secured record access | 100 % of sensitive actions captured in audit log |
| G-05 | Enable patients to self-serve online | ≥ {{TARGET_SELF_SERVICE_PCT}} % of appointments booked without receptionist |
| G-06 | Deliver actionable clinic analytics | Weekly/monthly revenue and footfall reports auto-generated |

### 1.3 Success Metrics

- **Adoption**: All staff roles active on the system within {{ONBOARDING_DAYS}} days of go-live.
- **Throughput**: System handles ≥ {{DAILY_PATIENT_TARGET}} patient visits/day without degradation.
- **Availability**: ≥ 99.5 % uptime during clinic hours.
- **Security**: Zero unauthorized data-access incidents in the first year.
- **Patient Satisfaction**: ≥ {{CSAT_TARGET}} % satisfaction score (via post-visit survey link).
- **Data Integrity**: Zero billing discrepancies attributed to system error per quarter.

---

## 2. Stakeholders

| Stakeholder | Role in Project | Interest |
|---|---|---|
| **Clinic Admin / Owner** | Primary decision-maker, super-user | Full operational visibility, ROI, compliance |
| **Doctors** | Daily end-users | Efficient consultation flow, clinical notes, prescriptions |
| **Receptionists** | Daily end-users | Fast patient intake, queue management, billing |
| **Patients** | External end-users / consumers | Appointment convenience, transparent billing, digital records |
| **IT / System Administrator** | Deployment & maintenance | Infrastructure stability, backup, integrations |
| **Regulatory Bodies** | External authority | Data privacy, healthcare record standards |
| **Third-party Services** | Cloudinary, Email/SMS gateway providers | SLA compliance, API stability |

---

## 3. Scope

### 3.1 In-Scope

- Full MERN-stack web application (browser-based, responsive).
- Role-based access control for 4 roles: Clinic Admin, Doctor, Receptionist, Patient.
- All 22 functional modules listed in Section 5.
- Real-time queue management via Socket.IO.
- PDF generation for prescriptions and invoices.
- Cloudinary-backed medical report storage.
- JWT authentication with refresh-token rotation.
- Email and SMS notification hooks (provider-configurable).
- Clinic-level analytics and dashboards (Recharts).
- Comprehensive audit logging.

### 3.2 Out-of-Scope (v1.0)

- Multi-clinic / franchise management (single clinic only).
- In-patient (IPD) or surgical ward management.
- Pharmacy inventory management (formulary reference only).
- Insurance claims submission or adjudication.
- Telemedicine / video consultation.
- Mobile native apps (iOS / Android).
- Laboratory Information System (LIS) integration.
- EHR interoperability (HL7 FHIR, DICOM).
- Payment gateway processing (payment tracking only; gateway integration deferred).

### 3.3 Future Phases

| Phase | Features |
|---|---|
| **v1.1** | Payment gateway integration (Razorpay / Stripe) |
| **v1.2** | Telemedicine module; WhatsApp notifications |
| **v2.0** | Multi-clinic / franchise mode; LIS integration |
| **v2.1** | FHIR R4 export; Insurance claim automation |
| **v3.0** | AI-assisted diagnosis suggestions; predictive analytics |

---

## 4. User Personas

### 4.1 Persona: Clinic Admin / Owner

| Field | Detail |
|---|---|
| **Name** | {{ADMIN_PERSONA_NAME}} |
| **Age** | 40–55 |
| **Role** | Owns and operates {{CLINIC_NAME}} |
| **Tech Comfort** | Moderate |
| **Goals** | Maximize revenue, ensure compliance, monitor staff performance, reduce operational chaos |
| **Pain Points** | Cannot see real-time patient load; billing discrepancies discovered days later; no audit trail for staff actions; manual report compilation wastes hours |
| **Key Scenarios** | Reviewing weekly revenue, adding a new doctor, pulling an audit log for a specific patient, configuring clinic holidays |

### 4.2 Persona: Doctor

| Field | Detail |
|---|---|
| **Name** | {{DOCTOR_PERSONA_NAME}} |
| **Age** | 30–50 |
| **Role** | Consulting physician at {{CLINIC_NAME}} |
| **Tech Comfort** | Moderate–High |
| **Goals** | Focus on patient care, not paperwork; access patient history instantly; issue clear digital prescriptions; track follow-up compliance |
| **Pain Points** | Interruptions to ask for paper files; handwriting misread by pharmacists; no structured history; unaware of daily appointment load before arriving |
| **Key Scenarios** | Calling the next patient from queue, reviewing 3-year medical timeline, writing a prescription, ordering a lab report upload |

### 4.3 Persona: Receptionist

| Field | Detail |
|---|---|
| **Name** | {{RECEPTIONIST_PERSONA_NAME}} |
| **Age** | 22–35 |
| **Role** | Front-desk staff at {{CLINIC_NAME}} |
| **Tech Comfort** | Moderate |
| **Goals** | Register patients quickly, manage the day's queue smoothly, collect payments and issue receipts without manual calculations |
| **Pain Points** | Long registration forms; manually calling patients; confusion when two patients arrive for same slot; cash/UPI reconciliation at end-of-day |
| **Key Scenarios** | Walk-in patient registration, issuing OPD token, marking a patient as checked-in, generating invoice |

### 4.4 Persona: Patient

| Field | Detail |
|---|---|
| **Name** | {{PATIENT_PERSONA_NAME}} |
| **Age** | 18–70 |
| **Role** | Outpatient seeking medical care |
| **Tech Comfort** | Low–Moderate |
| **Goals** | Book an appointment without calling, know their queue position, receive digital prescriptions, track past visits |
| **Pain Points** | Waiting without knowing queue status; losing paper prescriptions; no appointment reminder; having to repeat history every visit |
| **Key Scenarios** | Self-booking appointment online, checking queue status, downloading prescription PDF, viewing past reports |

---

## 5. Functional Requirements

> **Notation**: FR-{Module}-{Number}. Priority: **P0** = Must-have (MVP), **P1** = Should-have, **P2** = Nice-to-have.

---

### Module 01: Auth & User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-01-01 | The system SHALL support JWT-based authentication with access token (short-lived) and refresh token (long-lived, stored in httpOnly cookie). | P0 |
| FR-01-02 | Refresh tokens SHALL be rotated on every use; revoked tokens SHALL be blacklisted. | P0 |
| FR-01-03 | The system SHALL enforce role-based access control (RBAC) for 4 roles: Clinic Admin, Doctor, Receptionist, Patient. | P0 |
| FR-01-04 | Admins SHALL be able to create, edit, deactivate, and delete user accounts for Doctors, Receptionists, and Patients. | P0 |
| FR-01-05 | Patients SHALL be able to self-register via a public registration page. | P0 |
| FR-01-06 | The system SHALL support password reset via email OTP/link. | P0 |
| FR-01-07 | All login attempts (success/failure) SHALL be recorded in the audit log. | P0 |
| FR-01-08 | The system SHALL support account lockout after {{MAX_FAILED_LOGINS}} consecutive failed attempts. | P1 |
| FR-01-09 | Admins SHALL be able to view all active sessions and revoke specific sessions. | P1 |

---

### Module 02: Clinic Profile & Configuration

| ID | Requirement | Priority |
|---|---|---|
| FR-02-01 | Admins SHALL configure clinic name, address, logo, contact details, and registration number. | P0 |
| FR-02-02 | Admins SHALL define clinic operating hours per day of week. | P0 |
| FR-02-03 | Admins SHALL manage public holidays and clinic-wide closure dates. | P0 |
| FR-02-04 | Admins SHALL set default consultation fee ({{CONSULTATION_FEE}}) and other fee categories. | P0 |
| FR-02-05 | Clinic configuration changes SHALL be persisted immediately and reflected in all modules. | P0 |
| FR-02-06 | The system SHALL allow uploading a clinic logo that appears on PDFs (prescriptions and invoices). | P1 |

---

### Module 03: Doctor Management

| ID | Requirement | Priority |
|---|---|---|
| FR-03-01 | Admins SHALL create doctor profiles with specialization, qualification, registration number, and contact details. | P0 |
| FR-03-02 | Admins SHALL assign a doctor to one or more specializations/departments. | P0 |
| FR-03-03 | Admins SHALL activate or deactivate a doctor (deactivated doctors do not appear in scheduling). | P0 |
| FR-03-04 | The system SHALL display a directory of active doctors accessible to Receptionists and Patients. | P0 |
| FR-03-05 | Each doctor's profile page SHALL show upcoming schedule, today's appointments count, and pending follow-ups. | P1 |

---

### Module 04: Staff Management

| ID | Requirement | Priority |
|---|---|---|
| FR-04-01 | Admins SHALL create Receptionist accounts with name, contact, and system role. | P0 |
| FR-04-02 | Admins SHALL deactivate staff accounts immediately (revokes active sessions). | P0 |
| FR-04-03 | The system SHALL log all staff actions to the audit trail linked to the staff user ID. | P0 |
| FR-04-04 | Admins SHALL view a staff activity summary (actions taken, patients served) per day. | P1 |

---

### Module 05: Patient Registration

| ID | Requirement | Priority |
|---|---|---|
| FR-05-01 | Receptionists and Patients SHALL be able to register a new patient with: full name, date of birth, gender, contact number, emergency contact, and address. | P0 |
| FR-05-02 | The system SHALL auto-generate a unique Patient ID ({{PATIENT_ID_FORMAT}}) on registration. | P0 |
| FR-05-03 | Duplicate detection SHALL alert when a patient with the same phone number is registered. | P0 |
| FR-05-04 | Patient records SHALL support optional fields: blood group, known allergies, chronic conditions (editable by Doctor/Admin only). | P0 |
| FR-05-05 | Receptionists SHALL be able to search patients by name, phone number, or Patient ID. | P0 |
| FR-05-06 | Patient profile photo upload SHALL be optional. | P2 |

---

### Module 06: Patient Medical Profiles

| ID | Requirement | Priority |
|---|---|---|
| FR-06-01 | Each patient SHALL have a persistent medical profile that aggregates diagnoses, prescriptions, reports, and follow-ups across all visits. | P0 |
| FR-06-02 | Doctors SHALL be able to annotate a patient's static profile (allergies, chronic conditions, special notes). | P0 |
| FR-06-03 | Medical profile data SHALL be read-only for Receptionists. | P0 |
| FR-06-04 | Patients SHALL view their own medical profile via the Patient Portal. | P0 |

---

### Module 07: Appointment Scheduling

| ID | Requirement | Priority |
|---|---|---|
| FR-07-01 | The system SHALL support three appointment types: **Online** (patient-booked), **Walk-in** (receptionist-created), and **Follow-up** (doctor-generated). | P0 |
| FR-07-02 | Appointment slots SHALL be generated from the doctor's weekly schedule with configurable slot duration ({{SLOT_DURATION_MINUTES}} minutes). | P0 |
| FR-07-03 | The system SHALL prevent double-booking: no two appointments in the same slot for the same doctor. | P0 |
| FR-07-04 | A configurable waiting list SHALL be available when a slot is full. | P1 |
| FR-07-05 | Patients and Receptionists SHALL be able to cancel or reschedule appointments subject to the clinic's cancellation policy (defined in Business Rules). | P0 |
| FR-07-06 | The system SHALL send confirmation notifications (email/SMS) on appointment booking, reschedule, and cancellation. | P0 |
| FR-07-07 | A reminder notification SHALL be sent {{REMINDER_HOURS}} hours before the appointment. | P0 |
| FR-07-08 | The receptionist SHALL view a daily appointment calendar per doctor with status indicators. | P0 |
| FR-07-09 | Admins SHALL view a clinic-wide appointment calendar. | P0 |
| FR-07-10 | Appointment history SHALL be retained for ≥ {{DATA_RETENTION_YEARS}} years. | P0 |

---

### Module 08: Doctor Availability Management

| ID | Requirement | Priority |
|---|---|---|
| FR-08-01 | Each doctor SHALL have a weekly availability schedule (days, start time, end time, slot duration, max slots per session). | P0 |
| FR-08-02 | Doctors and Admins SHALL mark specific dates as leave (personal, sick, conference). | P0 |
| FR-08-03 | Clinic-level holidays (from Module 02) SHALL automatically block all doctor slots. | P0 |
| FR-08-04 | When a doctor marks a leave date that already has booked appointments, the system SHALL alert and offer bulk-cancel or bulk-reschedule. | P0 |
| FR-08-05 | Availability changes SHALL propagate in real-time to the booking interface. | P0 |

---

### Module 09: OPD Token Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-09-01 | An OPD token SHALL be generated only upon patient **check-in** at the clinic; booking an appointment does not auto-generate a token. | P0 |
| FR-09-02 | The token SHALL include: token number, patient name, doctor, estimated time, and date. | P0 |
| FR-09-03 | Tokens SHALL be sequentially numbered per doctor per day, resetting each day. | P0 |
| FR-09-04 | A printable / shareable token slip SHALL be available (PDF or display). | P1 |
| FR-09-05 | Walk-in patients without prior appointments SHALL be assigned tokens after receptionist check-in. | P0 |
| FR-09-06 | Emergency/priority tokens SHALL be insertable at the head of the queue by Receptionist or Doctor. | P0 |

---

### Module 10: Live Queue Management

| ID | Requirement | Priority |
|---|---|---|
| FR-10-01 | The system SHALL maintain a real-time queue per doctor, updated via Socket.IO. | P0 |
| FR-10-02 | The doctor's consultation dashboard SHALL show the current patient being seen and the next-in-queue. | P0 |
| FR-10-03 | The receptionist SHALL see the full queue for all doctors, with ability to reorder (priority escalation). | P0 |
| FR-10-04 | Patients in the Patient Portal SHALL see their estimated position and wait time. | P0 |
| FR-10-05 | When a doctor calls the next patient (marks current as "done"), the queue SHALL update for all connected clients within 2 seconds. | P0 |
| FR-10-06 | The system SHALL support marking a patient as **absent** (token auto-skipped) or **recalled** (token reinserted). | P1 |
| FR-10-07 | A display-board view (kiosk-friendly) SHALL show the current token for each doctor. | P2 |

---

### Module 11: Doctor Consultation Workspace

| ID | Requirement | Priority |
|---|---|---|
| FR-11-01 | The consultation workspace SHALL open automatically on the current patient when a doctor calls them from the queue. | P0 |
| FR-11-02 | Doctors SHALL record: chief complaint, history of present illness, examination findings, diagnosis (ICD-10 code reference optional), and treatment plan. | P0 |
| FR-11-03 | Consultation notes SHALL be auto-saved every {{AUTOSAVE_SECONDS}} seconds to prevent data loss. | P0 |
| FR-11-04 | Doctors SHALL view the patient's full past consultation notes from the workspace. | P0 |
| FR-11-05 | Consultation records SHALL be locked/read-only once the doctor marks the visit as "completed". | P0 |
| FR-11-06 | Doctors SHALL be able to add vital signs (BP, pulse, temperature, SpO₂, weight, height) per visit. | P0 |

---

### Module 12: Digital Prescriptions

| ID | Requirement | Priority |
|---|---|---|
| FR-12-01 | Doctors SHALL create prescriptions with: medication name, dosage, frequency, duration, route, and special instructions. | P0 |
| FR-12-02 | The system SHALL support adding free-text clinical advice and dietary instructions to the prescription. | P0 |
| FR-12-03 | Prescriptions SHALL be generated as PDF, branded with {{CLINIC_NAME}} logo and doctor's digital signature block. | P0 |
| FR-12-04 | Generated prescription PDFs SHALL be stored and linked to the patient's visit record. | P0 |
| FR-12-05 | Patients SHALL receive the prescription PDF via the Patient Portal and optional email link. | P0 |
| FR-12-06 | A medication search/autocomplete (generic name) SHALL assist the doctor while prescribing. | P1 |
| FR-12-07 | Doctors SHALL be able to clone a previous prescription and edit it for the current visit. | P1 |

---

### Module 13: Medical History Timeline

| ID | Requirement | Priority |
|---|---|---|
| FR-13-01 | Each patient SHALL have a chronological timeline of all visits, diagnoses, prescriptions, and uploaded reports. | P0 |
| FR-13-02 | The timeline SHALL be filterable by date range, doctor, diagnosis, and visit type. | P0 |
| FR-13-03 | Doctors and Admins SHALL have full read access to the timeline. | P0 |
| FR-13-04 | Patients SHALL view their own timeline via the Patient Portal (read-only). | P0 |
| FR-13-05 | Receptionists SHALL see visit dates and invoices but NOT clinical notes or prescriptions. | P0 |

---

### Module 14: Medical Report Management

| ID | Requirement | Priority |
|---|---|---|
| FR-14-01 | Doctors and Receptionists SHALL upload patient reports (lab results, imaging, etc.) as PDF or image files. | P0 |
| FR-14-02 | Uploaded reports SHALL be stored securely in Cloudinary with private access control (signed URLs). | P0 |
| FR-14-03 | Signed download URLs SHALL expire after {{REPORT_URL_EXPIRY_MINUTES}} minutes. | P0 |
| FR-14-04 | Each report record SHALL store: report type, date, uploading user, associated visit, and file reference. | P0 |
| FR-14-05 | Patients SHALL access their own reports via the Patient Portal using time-limited signed URLs. | P0 |
| FR-14-06 | Admins SHALL delete a report (soft delete with reason), creating an audit entry. | P1 |
| FR-14-07 | File size limit SHALL be {{MAX_REPORT_FILE_MB}} MB per file. | P0 |

---

### Module 15: Follow-up Scheduling

| ID | Requirement | Priority |
|---|---|---|
| FR-15-01 | At the end of a consultation, doctors SHALL schedule a follow-up appointment (date, doctor, notes). | P0 |
| FR-15-02 | Follow-up appointments SHALL appear in the scheduling module as a "Follow-up" type. | P0 |
| FR-15-03 | Patients SHALL receive a follow-up reminder {{FOLLOWUP_REMINDER_HOURS}} hours before the appointment. | P0 |
| FR-15-04 | Doctors SHALL view a list of overdue follow-ups (patients who did not attend their follow-up). | P1 |

---

### Module 16: Billing & Invoices

| ID | Requirement | Priority |
|---|---|---|
| FR-16-01 | Receptionists SHALL generate an invoice per visit containing: consultation fee, procedure fees, taxes, discounts, and total payable amount. | P0 |
| FR-16-02 | Invoices SHALL be auto-numbered sequentially ({{INVOICE_NUMBER_FORMAT}}). | P0 |
| FR-16-03 | Invoices SHALL be generated as PDF, branded with {{CLINIC_NAME}} details. | P0 |
| FR-16-04 | Admins SHALL define fee types (consultation, procedure, service) and their default amounts. | P0 |
| FR-16-05 | Receptionists SHALL be able to apply a discount (percentage or flat) with a mandatory reason. | P0 |
| FR-16-06 | Tax calculation (GST / {{TAX_NAME}} at {{TAX_RATE}} %) SHALL be configurable and auto-applied. | P0 |
| FR-16-07 | Invoices SHALL record the payment method (cash, card, UPI, insurance). | P0 |
| FR-16-08 | An invoice SHALL be linked to the patient, the visit, and the treating doctor. | P0 |
| FR-16-09 | Invoices SHALL be immutable once marked as "paid"; amendments require a credit note workflow. | P1 |

---

### Module 17: Payment Tracking

| ID | Requirement | Priority |
|---|---|---|
| FR-17-01 | The system SHALL track payment status per invoice: Pending, Paid, Partial, Waived. | P0 |
| FR-17-02 | Receptionists SHALL record payment receipt (amount, method, reference number). | P0 |
| FR-17-03 | Admins SHALL view a daily cash/UPI/card reconciliation report. | P0 |
| FR-17-04 | The system SHALL flag invoices that remain unpaid beyond {{OVERDUE_DAYS}} days. | P1 |
| FR-17-05 | Payment records SHALL be exportable as CSV for accounting purposes. | P1 |

---

### Module 18: Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-18-01 | The system SHALL send transactional notifications via email (SMTP-configurable) and/or SMS (gateway-configurable). | P0 |
| FR-18-02 | Notification events: appointment confirmed, appointment reminder, appointment cancelled, prescription ready, follow-up reminder, invoice generated. | P0 |
| FR-18-03 | Admins SHALL configure which notification events are enabled and the message templates. | P0 |
| FR-18-04 | Notification templates SHALL support dynamic placeholders (patient name, date, doctor, token number, etc.). | P0 |
| FR-18-05 | A notification log SHALL record all sent notifications with status (sent, failed) and timestamp. | P1 |
| FR-18-06 | Patients SHALL be able to opt out of non-critical notifications. | P1 |

---

### Module 19: Clinic Analytics & Reports

| ID | Requirement | Priority |
|---|---|---|
| FR-19-01 | Admins SHALL view a real-time dashboard with: today's appointment count, revenue, patients seen, queue length. | P0 |
| FR-19-02 | Analytics SHALL include: monthly revenue trend, top-performing doctors (by patients seen), appointment type distribution, no-show rate. | P0 |
| FR-19-03 | All charts SHALL be rendered using Recharts and be date-range filterable. | P0 |
| FR-19-04 | Admins SHALL export any report as CSV or PDF. | P1 |
| FR-19-05 | The system SHALL generate a daily summary report emailed to the Admin at {{DAILY_REPORT_TIME}}. | P2 |

---

### Module 20: Audit Logs

| ID | Requirement | Priority |
|---|---|---|
| FR-20-01 | The system SHALL log all create, update, delete operations on sensitive entities (patients, prescriptions, invoices, reports, users). | P0 |
| FR-20-02 | Each log entry SHALL record: timestamp, actor (user ID + role), action type, entity type, entity ID, before/after values (diff). | P0 |
| FR-20-03 | Audit logs SHALL be read-only; no user role may edit or delete them. | P0 |
| FR-20-04 | Admins SHALL filter audit logs by date range, actor, entity type, and action. | P0 |
| FR-20-05 | Audit logs SHALL be retained for ≥ {{AUDIT_RETENTION_YEARS}} years. | P0 |

---

### Module 21: Patient Portal

| ID | Requirement | Priority |
|---|---|---|
| FR-21-01 | Patients SHALL log in to a dedicated portal using their registered phone/email and password. | P0 |
| FR-21-02 | The portal SHALL show: upcoming appointments, queue position (live), past visits, prescriptions, reports, invoices. | P0 |
| FR-21-03 | Patients SHALL book, reschedule, or cancel appointments from the portal. | P0 |
| FR-21-04 | Patients SHALL download prescription and invoice PDFs. | P0 |
| FR-21-05 | Patients SHALL update their profile (contact info, emergency contact). | P0 |
| FR-21-06 | Patients SHALL NOT view other patients' records. | P0 |

---

### Module 22: Settings & Configuration

| ID | Requirement | Priority |
|---|---|---|
| FR-22-01 | A settings panel accessible only to Admins SHALL house all clinic-level, billing, notification, and schedule configurations. | P0 |
| FR-22-02 | Admins SHALL configure the appointment cancellation window ({{CANCELLATION_HOURS}} hours before appointment). | P0 |
| FR-22-03 | Admins SHALL configure slot duration, max advance booking days ({{MAX_ADVANCE_DAYS}}), and max slots per session. | P0 |
| FR-22-04 | Admins SHALL configure user password policy (minimum length, complexity). | P1 |
| FR-22-05 | Settings changes SHALL be versioned and audit-logged. | P0 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| NFR-ID | Requirement |
|---|---|
| NFR-P-01 | API response time SHALL be ≤ 200 ms (p95) for read endpoints under normal load. |
| NFR-P-02 | Queue update propagation via Socket.IO SHALL complete within 2 seconds for all connected clients. |
| NFR-P-03 | PDF generation (prescription or invoice) SHALL complete within 5 seconds. |
| NFR-P-04 | The system SHALL support ≥ {{CONCURRENT_USERS}} concurrent authenticated users without degradation. |

### 6.2 Availability & Reliability

| NFR-ID | Requirement |
|---|---|
| NFR-A-01 | System availability SHALL be ≥ 99.5 % measured monthly during clinic hours ({{CLINIC_HOURS}}). |
| NFR-A-02 | Scheduled maintenance windows SHALL not overlap clinic hours without admin notification ≥ 48 hours in advance. |
| NFR-A-03 | The database SHALL have automated daily backups retained for ≥ {{DB_BACKUP_DAYS}} days. |
| NFR-A-04 | The system SHALL recover from an unexpected crash and resume operation within {{RTO_MINUTES}} minutes (RTO). |

### 6.3 Security

| NFR-ID | Requirement |
|---|---|
| NFR-S-01 | All data in transit SHALL be encrypted via TLS 1.2+. |
| NFR-S-02 | Passwords SHALL be hashed using bcrypt with ≥ 12 salt rounds; plaintext passwords SHALL never be stored. |
| NFR-S-03 | JWT access tokens SHALL expire within {{ACCESS_TOKEN_EXPIRY_MINUTES}} minutes. |
| NFR-S-04 | Cloudinary report URLs SHALL use signed, time-limited access ({{REPORT_URL_EXPIRY_MINUTES}} minutes). |
| NFR-S-05 | OWASP Top 10 mitigations SHALL be applied (input sanitization, rate limiting, CORS, helmet.js, XSS prevention). |
| NFR-S-06 | Role-based middleware SHALL protect every API route; no route SHALL be accessible without a valid, role-authorized token. |
| NFR-S-07 | Sensitive fields (patient phone, DOB) SHALL be accessible only to roles explicitly permitted per module. |

### 6.4 Compliance

| NFR-ID | Requirement |
|---|---|
| NFR-C-01 | The system SHALL comply with applicable personal data protection regulations in the deployment jurisdiction (e.g., DPDPA 2023 in India, or {{APPLICABLE_REGULATION}}). |
| NFR-C-02 | Patient consent for data collection SHALL be captured at registration. |
| NFR-C-03 | Patients SHALL be able to request export of their personal data (right to portability). |
| NFR-C-04 | Medical records SHALL be retained for ≥ {{DATA_RETENTION_YEARS}} years per local healthcare regulations. |

### 6.5 Accessibility

| NFR-ID | Requirement |
|---|---|
| NFR-AC-01 | The UI SHALL meet WCAG 2.1 AA compliance for all public-facing pages. |
| NFR-AC-02 | All form inputs SHALL have associated labels; error states SHALL be clearly indicated. |
| NFR-AC-03 | Color SHALL not be the sole means of conveying status (use icons + labels). |

### 6.6 Maintainability & Scalability

| NFR-ID | Requirement |
|---|---|
| NFR-M-01 | Backend code SHALL follow a layered architecture (routes → controllers → services → repositories). |
| NFR-M-02 | All environment-specific values SHALL be externalized to `.env` files; no hardcoded secrets. |
| NFR-M-03 | The MongoDB schema design SHALL support horizontal scaling via Atlas sharding in future phases. |
| NFR-M-04 | The codebase SHALL have ≥ {{MIN_TEST_COVERAGE}} % unit test coverage on service and utility layers. |

---

## 7. User Stories

> Format: "As a **[Role]**, I want **[Action]** so that **[Benefit]**."
> Each story includes **Acceptance Criteria (AC)**.

---

### Auth & Registration

**US-001** — As a **Receptionist**, I want to register a new walk-in patient quickly so that I can assign them a token without delay.
- **AC1**: Registration form completes in ≤ 3 steps.
- **AC2**: A unique Patient ID is displayed immediately upon submission.
- **AC3**: Duplicate phone number triggers a warning with an option to view the existing record.

**US-002** — As a **Patient**, I want to self-register online so that I can book an appointment without visiting the clinic.
- **AC1**: Public registration page is accessible without authentication.
- **AC2**: Email or SMS confirmation is sent after registration.
- **AC3**: Patient can log in immediately after registration.

**US-003** — As a **Clinic Admin**, I want to create a Doctor account so that the doctor can log in and use their workspace.
- **AC1**: Admin can set username, temporary password, specialization, and schedule.
- **AC2**: Doctor receives a welcome email with login credentials.

**US-004** — As a **User (any role)**, I want to reset my password via email so that I can regain access if I forget it.
- **AC1**: Reset link expires in {{PASSWORD_RESET_EXPIRY_MINUTES}} minutes.
- **AC2**: Old password is invalidated after a successful reset.

---

### Appointment Scheduling

**US-005** — As a **Patient**, I want to book an appointment with a specific doctor on a date I choose so that I can plan my visit in advance.
- **AC1**: Available slots for the selected doctor and date are shown in real-time.
- **AC2**: A confirmation notification is sent within 1 minute of booking.
- **AC3**: The booked slot is unavailable to other patients immediately.

**US-006** — As a **Receptionist**, I want to create a walk-in appointment so that patients who arrive without prior booking are served.
- **AC1**: Walk-in can be created for today only or future dates.
- **AC2**: Double-booking prevention applies equally to walk-ins.

**US-007** — As a **Patient**, I want to cancel an appointment so that the slot becomes available for another patient.
- **AC1**: Cancellation is blocked within {{CANCELLATION_HOURS}} hours of the appointment time.
- **AC2**: A cancellation confirmation notification is sent.

**US-008** — As a **Receptionist**, I want to reschedule an appointment on behalf of a patient so that the patient does not miss care.
- **AC1**: The original slot is freed; the new slot is blocked.
- **AC2**: Both patient and doctor are notified of the change.

**US-009** — As a **Clinic Admin**, I want to view the clinic-wide appointment calendar so that I can assess daily patient load.
- **AC1**: Calendar view supports day, week, and month perspectives.
- **AC2**: Each appointment shows patient name, doctor, and status (booked, checked-in, completed, cancelled).

**US-010** — As a **Patient**, I want to join a waiting list when all slots are full so that I can be notified if a slot opens up.
- **AC1**: Patient is added to the waiting list with their position shown.
- **AC2**: An automatic notification is sent if a slot becomes available.

---

### Doctor Availability

**US-011** — As a **Doctor**, I want to mark a date as leave so that no appointments are scheduled for me on that day.
- **AC1**: Any existing bookings on that day trigger an alert for the admin/receptionist.
- **AC2**: The date is blocked on the booking calendar immediately.

**US-012** — As a **Clinic Admin**, I want to set clinic-wide holidays so that all doctor slots are blocked automatically.
- **AC1**: Holiday dates are reflected across all doctor calendars within seconds.
- **AC2**: Patients with bookings on a holiday are notified and offered rescheduling.

---

### OPD Tokens & Queue

**US-013** — As a **Receptionist**, I want to check in an appointment and issue an OPD token so that the patient joins the doctor's queue.
- **AC1**: Token number is sequential and resets daily per doctor.
- **AC2**: The patient's queue position is visible on the Patient Portal immediately.

**US-014** — As a **Receptionist**, I want to issue a priority token for an emergency patient so that they are attended to promptly.
- **AC1**: Priority token appears at the top of the queue.
- **AC2**: Other patients' token numbers are not renumbered; only queue order changes.

**US-015** — As a **Patient**, I want to see my current queue position from the Patient Portal so that I know when to arrive.
- **AC1**: Queue position updates in real-time (≤ 2-second delay).
- **AC2**: An estimated wait time (based on average consultation duration) is displayed.

**US-016** — As a **Doctor**, I want to call the next patient from my queue dashboard so that I know who to see next without asking reception.
- **AC1**: "Call Next" button updates queue for all connected clients.
- **AC2**: The patient's name and brief history summary are shown on the workspace automatically.

---

### Consultation & Prescription

**US-017** — As a **Doctor**, I want to record a patient's vital signs during a visit so that they are part of the clinical record.
- **AC1**: Vitals form accepts: BP, pulse, temperature, SpO₂, weight, height.
- **AC2**: Previous vitals from the last visit are shown for comparison.

**US-018** — As a **Doctor**, I want to write a prescription during a consultation so that the patient receives clear medication instructions.
- **AC1**: Each prescription line includes: drug name, dose, frequency, duration, route.
- **AC2**: A PDF is generated and immediately downloadable.

**US-019** — As a **Doctor**, I want to view a patient's complete prescription history so that I can avoid duplicate or contraindicated medications.
- **AC1**: History shows all prescriptions chronologically with the prescribing doctor's name.
- **AC2**: History is accessible within 1 click from the consultation workspace.

**US-020** — As a **Doctor**, I want to clone a previous prescription and modify it so that I save time for returning patients.
- **AC1**: Clone loads all previous line items into the editable prescription form.
- **AC2**: Saving the clone creates a new prescription record (previous is unchanged).

**US-021** — As a **Doctor**, I want consultation notes to auto-save so that I do not lose work if the browser closes unexpectedly.
- **AC1**: Auto-save triggers every {{AUTOSAVE_SECONDS}} seconds.
- **AC2**: A "Last saved" timestamp is shown in the workspace.

**US-022** — As a **Doctor**, I want to mark a consultation as "Complete" so that the visit is locked and billing can proceed.
- **AC1**: After marking complete, the notes and prescription are read-only.
- **AC2**: The patient's queue status changes to "Consultation done".

---

### Medical History & Reports

**US-023** — As a **Doctor**, I want to view the patient's full medical history timeline so that I have context for the current visit.
- **AC1**: Timeline shows all past visits, diagnoses, prescriptions, and reports in reverse chronological order.
- **AC2**: Each item is expandable to show full details.

**US-024** — As a **Doctor** or **Receptionist**, I want to upload a patient's lab/imaging report so that it is linked to their record.
- **AC1**: Upload accepts PDF and common image formats (PNG, JPG).
- **AC2**: Report appears in the patient's history within 10 seconds of upload.

**US-025** — As a **Patient**, I want to download my lab report from the portal so that I can share it with other providers.
- **AC1**: Download link uses a signed, time-limited URL.
- **AC2**: Link expires after {{REPORT_URL_EXPIRY_MINUTES}} minutes; a fresh link is generated on each request.

---

### Follow-up

**US-026** — As a **Doctor**, I want to schedule a follow-up appointment at the end of a consultation so that continuity of care is maintained.
- **AC1**: Follow-up date, doctor, and notes are saved and linked to the current visit.
- **AC2**: The patient receives a follow-up reminder notification.

**US-027** — As a **Doctor**, I want to see a list of overdue follow-ups so that I can reach out to patients who did not return.
- **AC1**: The list shows patient name, original visit date, follow-up due date, and contact number.
- **AC2**: List is filterable by date range.

---

### Billing & Payments

**US-028** — As a **Receptionist**, I want to generate an invoice after a consultation so that the patient knows exactly what to pay.
- **AC1**: Invoice pulls in consultation fee from the doctor's configured rate.
- **AC2**: Additional procedure/service fees can be added manually.
- **AC3**: Tax is auto-calculated based on the configured rate.
- **AC4**: Invoice PDF is downloadable immediately.

**US-029** — As a **Receptionist**, I want to apply a discount to an invoice with a reason so that it is auditable.
- **AC1**: Discount field accepts percentage or flat amount.
- **AC2**: Reason is mandatory and stored with the invoice record.

**US-030** — As a **Receptionist**, I want to record a payment against an invoice so that the account is settled.
- **AC1**: Payment method (cash, card, UPI, insurance) is selectable.
- **AC2**: Invoice status changes to "Paid" after full payment.

**US-031** — As a **Clinic Admin**, I want to view daily revenue collections so that I can track financial performance.
- **AC1**: Dashboard shows total collected, broken down by payment method.
- **AC2**: Data refreshes without manual page reload.

**US-032** — As a **Clinic Admin**, I want to export payment data as CSV so that my accountant can import it into their software.
- **AC1**: Export includes: date, invoice number, patient name, amount, tax, discount, payment method.

---

### Notifications

**US-033** — As a **Patient**, I want to receive an appointment reminder via SMS/email so that I don't forget my visit.
- **AC1**: Reminder is sent {{REMINDER_HOURS}} hours before appointment time.
- **AC2**: Reminder includes: doctor name, date, time, and clinic address.

**US-034** — As a **Clinic Admin**, I want to customize notification templates so that communications align with the clinic's tone.
- **AC1**: Template editor supports dynamic placeholders.
- **AC2**: A preview of the rendered message is shown before saving.

**US-035** — As a **Patient**, I want to opt out of non-essential notifications so that I am not overwhelmed with messages.
- **AC1**: Patient portal has an "Notification Preferences" section.
- **AC2**: Critical notifications (appointment confirmation, cancellation) cannot be opted out.

---

### Analytics

**US-036** — As a **Clinic Admin**, I want to see monthly revenue trends so that I can identify growth patterns.
- **AC1**: Line/bar chart shows revenue per month for the selected year.
- **AC2**: Data is drillable to weekly or daily view.

**US-037** — As a **Clinic Admin**, I want to see the no-show rate per doctor so that I can adjust scheduling policies.
- **AC1**: No-show rate shown as a percentage per doctor per month.
- **AC2**: Clicking a data point shows the list of no-show patients.

**US-038** — As a **Clinic Admin**, I want to see appointment type distribution so that I understand the mix of online vs walk-in vs follow-up visits.
- **AC1**: Pie/donut chart shows distribution for the selected period.

---

### Audit Logs

**US-039** — As a **Clinic Admin**, I want to view the audit log for a specific patient so that I can investigate any unauthorized access.
- **AC1**: Audit log entries are filterable by patient ID.
- **AC2**: Each entry shows actor, timestamp, action, and before/after diff.

**US-040** — As a **Clinic Admin**, I want assurance that audit logs cannot be modified so that they are legally defensible.
- **AC1**: No API endpoint exists to update or delete an audit log entry.
- **AC2**: Audit log entries are tested to be immutable in automated tests.

---

### Patient Portal

**US-041** — As a **Patient**, I want to see my upcoming appointments in the portal so that I can plan accordingly.
- **AC1**: Appointments are shown in chronological order with status badges.
- **AC2**: A "Cancel" button is shown if the cancellation window has not passed.

**US-042** — As a **Patient**, I want to update my contact information in the portal so that the clinic has my current details.
- **AC1**: Changes to phone/email trigger an OTP verification step.
- **AC2**: Updated contact is reflected in all future notifications.

**US-043** — As a **Patient**, I want to see my invoices and their payment status so that I can verify my billing.
- **AC1**: Each invoice shows itemized charges and payment status.
- **AC2**: Invoice PDF is downloadable.

---

### Admin & Configuration

**US-044** — As a **Clinic Admin**, I want to configure the clinic's operating hours so that appointments are only bookable within those hours.
- **AC1**: Slot generation respects the configured hours for each day of the week.
- **AC2**: Hours can differ per day (e.g., shorter on Saturdays).

**US-045** — As a **Clinic Admin**, I want to deactivate a doctor's account without deleting historical records so that past data is preserved.
- **AC1**: Deactivated doctor does not appear in booking; their historical records are intact.
- **AC2**: All prescriptions and consultations by the deactivated doctor remain accessible.

**US-046** — As a **Clinic Admin**, I want to configure the cancellation policy window so that it matches the clinic's operational needs.
- **AC1**: The setting accepts hours as an integer (1–72).
- **AC2**: The cancellation button in the portal and scheduler enforces the updated window immediately.

**US-047** — As a **Clinic Admin**, I want to bulk-configure doctor availability for the upcoming month so that scheduling is set up in advance.
- **AC1**: Admin can copy one doctor's weekly schedule to another.
- **AC2**: Conflicts (existing bookings vs. new availability blocks) are shown before confirming.

**US-048** — As a **Receptionist**, I want to search for a patient by phone number so that I can quickly pull up their record.
- **AC1**: Search returns results within 1 second.
- **AC2**: Search is accessible from every page via a global search bar.

**US-049** — As a **Doctor**, I want to see a summary of my day (appointments count, next patient) when I log in so that I can prepare.
- **AC1**: Doctor's home dashboard shows: today's appointment count, next scheduled patient, any pending follow-ups.
- **AC2**: Data refreshes automatically when a new check-in occurs.

**US-050** — As a **Clinic Admin**, I want to receive a daily summary report by email so that I can review performance without logging in.
- **AC1**: Email contains: total patients seen, total revenue, no-shows, and pending follow-ups.
- **AC2**: Email is sent at the configured time ({{DAILY_REPORT_TIME}}) each day.

**US-051** — As a **Receptionist**, I want to print an OPD token slip so that I can hand it to the patient.
- **AC1**: Token slip shows: token number, patient name, doctor, estimated time, and date.
- **AC2**: Slip can be printed or displayed on-screen.

**US-052** — As a **Doctor**, I want to add clinical advice in free text to the prescription so that the patient receives holistic guidance.
- **AC1**: Free-text advice section appears below medications on the PDF.
- **AC2**: Character limit of {{ADVICE_MAX_CHARS}} enforced with a live counter.

---

## 8. Business Rules

### 8.1 Appointment Policies

| Rule ID | Rule |
|---|---|
| BR-APT-01 | A patient may not hold more than {{MAX_ACTIVE_APPOINTMENTS}} future appointments with the same doctor simultaneously. |
| BR-APT-02 | Appointment cancellation is blocked within {{CANCELLATION_HOURS}} hours of the scheduled time. |
| BR-APT-03 | Rescheduling is permitted up to {{RESCHEDULE_HOURS}} hours before the appointment. |
| BR-APT-04 | No appointment may be booked beyond {{MAX_ADVANCE_DAYS}} calendar days in the future. |
| BR-APT-05 | A slot vacated by cancellation becomes immediately available to other patients. |
| BR-APT-06 | Follow-up appointments are exempt from the advance-booking maximum-days limit. |
| BR-APT-07 | Appointments in "checked-in" or "in-consultation" status may not be cancelled; they must be completed. |

### 8.2 OPD Token & Queue Rules

| Rule ID | Rule |
|---|---|
| BR-Q-01 | An OPD token is created only upon physical check-in; a booked appointment does not create a token. |
| BR-Q-02 | Token numbers are sequential per doctor per calendar day, starting from 1. |
| BR-Q-03 | A patient may hold only one active token per doctor per day. |
| BR-Q-04 | Priority (emergency) tokens jump to position 1 of the queue; existing tokens shift down without renumbering. |
| BR-Q-05 | An absent patient's token is skipped after {{ABSENT_SKIP_MINUTES}} minutes; they may be recalled once if they return within {{RECALL_WINDOW_MINUTES}} minutes. |

### 8.3 Billing Rules

| Rule ID | Rule |
|---|---|
| BR-BILL-01 | An invoice is generated only after the consultation is marked "Complete". |
| BR-BILL-02 | An invoice is immutable once marked "Paid". Corrections require a credit note. |
| BR-BILL-03 | Discounts exceeding {{MAX_DISCOUNT_PCT}} % require Clinic Admin approval. |
| BR-BILL-04 | Tax ({{TAX_NAME}} at {{TAX_RATE}} %) is applied to the sub-total after discounts. |
| BR-BILL-05 | Each invoice must be linked to a patient, a visit, and a consulting doctor. |
| BR-BILL-06 | Partial payments are recorded; the invoice remains "Partial" until fully paid. |

### 8.4 Queue Priority Rules

| Rule ID | Rule |
|---|---|
| BR-PRI-01 | Only Receptionists and Doctors may escalate a token to priority status. |
| BR-PRI-02 | Only one priority token may exist ahead of the regular queue at any time per doctor. |
| BR-PRI-03 | Emergency escalation is logged in the audit trail with the acting user and reason. |

### 8.5 Consent & Data Rules

| Rule ID | Rule |
|---|---|
| BR-DATA-01 | Patient consent for data processing is captured at the first registration and stored with a timestamp. |
| BR-DATA-02 | Clinical notes and prescription data are accessible only to Doctors and Admins; Receptionists see only visit metadata. |
| BR-DATA-03 | Deleted records (soft-delete) are retained for {{DATA_RETENTION_YEARS}} years before purge. |
| BR-DATA-04 | A patient may request a full data export; this must be fulfilled within {{DATA_EXPORT_DAYS}} business days. |
| BR-DATA-05 | Audit logs are never soft-deleted and are exempt from retention purge policies. |

### 8.6 Access Control Rules

| Rule ID | Rule |
|---|---|
| BR-ACL-01 | Patients may only access their own data; cross-patient access is a system-level security violation. |
| BR-ACL-02 | Deactivated users' tokens are invalidated immediately on deactivation. |
| BR-ACL-03 | A Doctor may not access another doctor's consultation notes unless granted explicit cross-coverage access by the Admin. |

---

## 9. Assumptions and Dependencies

### 9.1 Assumptions

| # | Assumption |
|---|---|
| A-01 | The clinic operates a single physical location; multi-branch is explicitly out of scope for v1.0. |
| A-02 | The clinic has reliable broadband internet during all operating hours. |
| A-03 | The deployment environment supports Node.js 20 LTS and MongoDB 7.x. |
| A-04 | A Cloudinary account (free or paid tier) will be provisioned by the clinic before go-live. |
| A-05 | Email and SMS gateway credentials (SMTP, provider API key) will be supplied by the clinic. |
| A-06 | The clinic's staff have basic computer literacy and will receive onboarding training. |
| A-07 | PDF rendering is handled server-side; no client-side PDF library is required. |
| A-08 | ICD-10 codes are optional; the system supports free-text diagnosis without code enforcement in v1.0. |

### 9.2 External Dependencies

| Dependency | Purpose | Risk if Unavailable |
|---|---|---|
| **Cloudinary** | Medical report storage and signed URL delivery | Reports cannot be uploaded or accessed |
| **SMTP Provider** (e.g., SendGrid, AWS SES) | Email notifications | Email notifications fail |
| **SMS Gateway** (e.g., Twilio, local aggregator) | SMS notifications | SMS notifications fail |
| **MongoDB Atlas** (or self-hosted MongoDB) | Primary datastore | Full system outage |
| **Vite Build System** | Frontend build | Frontend deployment blocked |

---

## 10. Constraints

| # | Constraint |
|---|---|
| C-01 | The application is a web-only product; native mobile apps are not in scope for v1.0. |
| C-02 | The tech stack is fixed: React + Vite + TypeScript (frontend); Node.js + Express + MongoDB (backend). |
| C-03 | Real-time features are implemented exclusively via Socket.IO; third-party push services are out of scope. |
| C-04 | Payment processing (gateway integration) is deferred to v1.1; v1.0 tracks payments manually. |
| C-05 | The system is designed for a single clinic tenant; data isolation between multiple clinics is not implemented. |
| C-06 | Report files stored in Cloudinary are subject to Cloudinary's terms of service and storage limits. |
| C-07 | Localization / multi-language support is out of scope for v1.0 (English only). |

---

## 11. Open Questions / Decisions Pending

> These items require input from the clinic owner/admin before the final specification is locked.

| # | Question | Impact |
|---|---|---|
| OQ-01 | What is the target daily patient volume ({{DAILY_PATIENT_TARGET}})? | Determines infrastructure sizing and load testing targets. |
| OQ-02 | What are the consultation fee structure and all fee categories ({{CONSULTATION_FEE}}, procedures, etc.)? | Required to configure billing module defaults. |
| OQ-03 | What is the default OPD slot duration ({{SLOT_DURATION_MINUTES}} minutes)? | Drives slot generation and queue estimation logic. |
| OQ-04 | Which SMS/email gateway provider will be used? API keys and account setup needed. | Blocks notification module go-live. |
| OQ-05 | What tax regime applies (GST / VAT / none)? What is the rate ({{TAX_RATE}} %)? | Required for invoice calculation. |
| OQ-06 | What is the cancellation/reschedule policy? (Hours threshold, penalty, etc.) | Drives booking module enforcement rules. |
| OQ-07 | What data retention period is mandated by local healthcare regulations ({{DATA_RETENTION_YEARS}} years)? | Determines archive and purge schedules. |
| OQ-08 | Will the clinic require a patient consent form/checkbox at registration, or is implied consent sufficient? | Legal and compliance decision. |
| OQ-09 | What is the maximum file size for uploaded medical reports ({{MAX_REPORT_FILE_MB}} MB)? | Cloudinary plan and UX constraints. |
| OQ-10 | Should the queue display board (kiosk view) be deployed on a separate screen? Hardware/network setup needed. | Affects P2 kiosk feature delivery. |
| OQ-11 | What is the preferred Patient ID format (e.g., {{PATIENT_ID_FORMAT}}: `OPD-YYYY-NNNNNN`)? | Patient registration and referencing. |
| OQ-12 | Will the clinic require a doctor's digital signature image on prescriptions? Image collection process needed. | PDF generation design. |
| OQ-13 | Are there any specializations or departments to pre-configure at launch? | Doctor management module seed data. |
| OQ-14 | What is the maximum allowed discount percentage before admin approval ({{MAX_DISCOUNT_PCT}} %)? | Billing business rule configuration. |
| OQ-15 | Should overdue follow-up reminders be automated, or only shown as a list to the doctor? | Notification module scope. |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Admin / Clinic Admin** | The owner or designated administrator of the clinic with full system access. |
| **Appointment** | A pre-scheduled time slot reserved for a patient to consult a specific doctor. |
| **Audit Log** | An immutable, tamper-proof record of all system actions performed by any user. |
| **Check-in** | The act of a Receptionist confirming a patient's physical arrival at the clinic, triggering OPD token generation. |
| **Cloudinary** | A cloud-based media storage and delivery service used for secure medical report file hosting. |
| **Consultation Workspace** | The doctor-facing interface for recording clinical notes, diagnosis, vital signs, and prescriptions during a patient visit. |
| **Doctor Availability** | The configured days and time slots during which a specific doctor accepts appointments. |
| **Follow-up** | A subsequent appointment scheduled by a doctor at the end of a consultation to monitor a patient's recovery. |
| **ICD-10** | International Classification of Diseases, 10th revision — a standard coding system for diagnoses. |
| **Invoice** | A financial document issued to the patient itemizing services rendered and amounts due. |
| **JWT** | JSON Web Token — a compact, signed token used for stateless user authentication. |
| **Leave** | A date or range of dates during which a specific doctor is not available for appointments. |
| **MERN Stack** | MongoDB, Express.js, React, Node.js — the core technology stack of Smart OPD. |
| **No-show** | A patient who had a confirmed appointment but neither cancelled nor checked in. |
| **OPD** | Outpatient Department — a clinic service where patients receive care without hospital admission. |
| **OPD Token** | A sequential number issued to a patient upon check-in that determines their position in the doctor's queue. |
| **Patient ID** | A system-generated unique identifier (format: {{PATIENT_ID_FORMAT}}) assigned to each patient at registration. |
| **Patient Portal** | The patient-facing interface providing self-service access to appointments, prescriptions, reports, and invoices. |
| **PDF** | Portable Document Format — the standard format for prescriptions and invoices generated by the system. |
| **Priority Queue** | An emergency escalation mechanism that places a specific patient at the head of the queue regardless of token order. |
| **Queue** | The ordered list of checked-in patients awaiting consultation with a specific doctor. |
| **RBAC** | Role-Based Access Control — a security model where user permissions are determined by their assigned role. |
| **Receptionist** | A front-desk staff member responsible for patient registration, check-in, token issuance, and billing. |
| **Signed URL** | A time-limited, cryptographically authenticated URL that grants temporary access to a private resource (used for report downloads). |
| **Slot** | A fixed time interval within a doctor's schedule during which one appointment may be booked. |
| **Socket.IO** | A real-time, bidirectional communication library used for live queue updates. |
| **Soft Delete** | A data deletion pattern where records are marked as deleted but retained in the database for audit and compliance purposes. |
| **Visit** | A single clinical encounter — created when a patient checks in; contains consultation notes, prescriptions, vitals, and billing. |
| **Waiting List** | A queue of patients who want an appointment for a fully-booked slot; they are offered the slot if a cancellation occurs. |
| **Walk-in** | A patient who arrives at the clinic without a prior appointment and is registered on-the-spot by the Receptionist. |

---

*Document end. Version 1.0.0 — Smart OPD PRD. All {{PLACEHOLDER}} values must be configured by the Clinic Admin before system deployment.*
