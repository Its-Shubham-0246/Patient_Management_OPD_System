# Smart OPD – Software Requirements Specification (SRS)
## Single-Clinic Outpatient Department Management System

> **Document ID:** 01-SRS-Requirements.md  
> **Standard:** IEEE Std 830-1998 Compliant  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **System Scope:** Complete Outpatient Workflow for One Single Clinic  
> **Architecture:** MERN Stack (React 18 · TypeScript · Tailwind · shadcn/ui · Node.js 20 · Express · MongoDB 7 · Socket.IO 4)  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) provides the complete, authoritative functional and non-functional requirements for **Smart OPD**, a specialized digital clinic management system designed to manage the end-to-end outpatient healthcare operations of **one single clinic**. It serves as the definitive engineering blueprint for developers, UI/UX designers, software architects, QA engineers, and the clinic owner.

### 1.2 Product Vision & Single-Clinic Boundary
Smart OPD digitalizes every touchpoint of an independent medical practice or polyclinic. The application makes clinic operations seamless for the clinic owner/admin, attending doctors, front-desk receptionists, and visiting patients.

**Key Single-Clinic Scope Boundary:**
- The system is architected to serve **one physical clinic** with multiple consulting rooms, multiple doctor specialties, reception desks, and a patient waiting lounge.
- **Configurable Identity (Zero Hardcoding)**: The clinic's legal name, logo, address, contact hotline, emergency phone, registration numbers, tax identifiers, operating hours, holidays, departments, doctors, fee structures, and billing rules are completely dynamic and configurable via database settings (`clinicSettings`). Zero clinical or administrative identities are hardcoded into application source code.
- Multi-tenant readiness: While running for one clinic, the architecture enforces an indexed tenant boundary (`clinicId`) across all database collections, ensuring effortless future expansion to multiple branches or polyclinic chains without requiring schema rewrites.

### 1.3 Scope of Modules (22 Modules)
The product automates 22 discrete operational modules:
1. Authentication and User Management (RBAC)
2. Clinic Profile and Master Configuration
3. Doctor Management & Department Rostering
4. Staff Management (Receptionists & Nurses)
5. Patient Registration & UHID Generation
6. Patient Medical Profiles & Allergy Tracking
7. Appointment Scheduling & Slot Engine
8. Smart Specialist Doctor Auto-Allocation Engine
9. Doctor Availability & Leave Management
10. OPD Check-In & Sequential Token Generation
11. Real-Time Live Queue Management (Socket.IO)
12. Doctor Clinical Consultation Workspace
13. Digital Prescriptions (e-Rx) & Vector PDFKit Streaming
14. Longitudinal Medical History Timeline
15. Diagnostic Report Management & Cloud Storage
16. Follow-Up Scheduling & Compliance Engine
17. Billing, Invoicing & Financial Settlement
18. Payment Tracking (Cash, Static UPI QR, Card POS)
19. Multi-Channel Notifications (TRAI DLT SMS, Email, Sockets)
20. Clinic Business Analytics & Financial Reports
21. Tamper-Evident Audit Logging
22. Patient Self-Service Portal

---

## 2. User Classes and Operational Roles

Smart OPD enforces four discrete, non-overlapping user roles using Role-Based Access Control (RBAC):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SMART OPD ROLE HIERARCHY                        │
├───────────────────┬───────────────────┬────────────────┬───────────────┤
│ 👑 Clinic Admin   │ 🩺 Doctor         │ 📋 Receptionist│ 🧑 Patient    │
├───────────────────┼───────────────────┼────────────────┼───────────────┤
│ • Full Clinic ERP │ • OPD Queue Room  │ • Patient Reg  │ • Self Signup │
│ • Doctor & Staff  │ • EMR Timeline    │ • Book Appts   │ • Book Slot   │
│ • Schedule Config │ • Rx Generator    │ • OPD Check-In │ • Live Queue  │
│ • Revenue Reports │ • Follow-up Engine│ • Token Dispatc│ • Rx Download │
│ • Audit Inspector │ • Report Review   │ • POS Billing  │ • Lab Reports │
│ • Fee & Tax Setup │ • Workload View   │ • Override Mgmt│ • Profile Mgmt│
└───────────────────┴───────────────────┴────────────────┴───────────────┘
```

### 2.1 Role 1: Clinic Admin / Owner
- **Profile**: Medical director, chief physician, or business manager owning the clinic.
- **Responsibilities**:
  - Configure clinic profile: legal name, physical address, phone, email, logo, and registration credentials (Clinical Establishments Act, GSTIN).
  - Provision, manage, and deactivate Doctor and Receptionist credentials.
  - Define operational departments (e.g., General Medicine, Pediatrics, Orthopedics, Gynecology, Dermatology).
  - Configure doctor shift timings, consultation slot duration, and standard consultation fee schedules.
  - Set clinic operating days, shift hours, lunch buffers, and annual clinic holidays.
  - Access executive analytics: total daily/monthly patient footfall, new vs returning patient ratio, doctor-wise revenue, appointment cancellation rates, and average patient wait times.
  - Inspect tamper-evident, append-only audit logs for all clinical and financial operations.
  - Configure default appointment rules (e.g., max advance booking window, cancellation cutoff time, auto-allocation vs patient-choice mode).

### 2.2 Role 2: Doctor (Attending Physician)
- **Profile**: Licensed medical doctor delivering outpatient care in an assigned consultation room.
- **Responsibilities**:
  - Access assigned daily appointment schedule and live waiting queue.
  - View real-time waiting room roster with patient token number, UHID, name, and age.
  - Advance the queue using 1-click "Call Next", "Skip Token", or clinician-approved "Emergency Override".
  - Review the patient's longitudinal EMR timeline: past clinical visits, vital signs trends, previous diagnoses, and attached lab reports.
  - Document consultation findings: chief complaints, vitals (BP, pulse, temperature, SpO2, weight, BMI), clinical examination notes, and diagnosis (with optional ICD-10 search).
  - Compose digital prescriptions using structured formulary (drug name, dosage strength, form, frequency, duration, administration instructions, and advice).
  - One-click generate, preview, and print vector-sharp, branded A4 prescriptions with QR code verification.
  - Upload or review patient diagnostic reports (lab PDFs, radiology scans).
  - Schedule medical follow-ups with automatic reminder notifications.
  - Mark planned leaves or emergency unavailability.

### 2.3 Role 3: Front-Desk Receptionist
- **Profile**: Clinic administrative and cash-handling personnel operating at the front reception counter.
- **Responsibilities**:
  - Rapidly register new patients, validate phone numbers, capture emergency contacts, and allocate unique UHIDs.
  - High-speed indexed patient lookup matching mobile number, UHID, or partial name (`Alt + C` / `⌘K`).
  - Book, reschedule, or cancel patient appointments across all doctor schedules.
  - Register unscheduled walk-in patients and allocate next available FIFO consultation slots.
  - **OPD Ingress Trigger**: Check in arriving patients, verify appointments, and issue sequential daily OPD tokens per doctor.
  - Monitor and manage live queue boards across all consultation rooms.
  - Generate itemized billing invoices for consultations, clinical procedures, nursing charges, and dressings.
  - Settle payments across multiple modes: Cash, Static UPI QR, or Card POS terminal; record transaction references and issue printed receipts.
  - Execute smart doctor auto-allocation for walk-in patients, with permissions to manually override allocation upon recording valid reasons.

### 2.4 Role 4: Patient
- **Profile**: Healthcare consumer receiving medical consultation at the clinic.
- **Responsibilities**:
  - Register a personal portal account using phone number, email, and password.
  - Browse clinic information: specialties offered, doctor credentials, consulting hours, and consultation fees.
  - Book appointments online: choose specialty, select preferred doctor or auto-allocate, pick date, and select an available time slot.
  - Cancel or reschedule appointments within clinic cutoff policy (e.g., up to 4 hours prior).
  - View live OPD token position on the day of consultation (e.g., "Your Token: #14 | Currently Serving: #11 | ~15 mins wait").
  - Access, view, and download official signed prescription PDFs and billing receipts.
  - Download attached diagnostic laboratory and radiology reports.
  - Receive automated appointment confirmations, reminders, and follow-up notices via SMS and email.
  - Manage personal profile demographics and digital consent preferences under the DPDP Act 2023.

---

## 3. Core Functional Requirements (22 Modules)

### Module 01: Authentication & User Management (FR-01)
- **FR-01.1**: The system shall support patient self-registration with full name, phone number, email, and password.
- **FR-01.2**: Admin, Doctor, and Receptionist accounts shall only be created by the Clinic Admin; public signup for staff roles is strictly blocked.
- **FR-01.3**: Passwords shall be salted and hashed using bcrypt with a work factor of 12.
- **FR-01.4**: Authentication shall use stateless 15-minute access JWTs in memory and 7-day rotated refresh tokens stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
- **FR-01.5**: Brute-force protection: 5 consecutive failed login attempts within 15 minutes shall lock the user account for 30 minutes and emit an audit alert.
- **FR-01.6**: Password reset workflow shall issue a cryptographically signed, single-use, 15-minute expiration token via email.

### Module 02: Clinic Profile & Configuration (FR-02)
- **FR-02.1**: Master configuration document (`clinicSettings`) shall store:
  - Clinic legal name, registered brand name, tagline, and logo URL.
  - Registered physical address (street, city, state, postal code).
  - Contact phone, front-desk helpline, and emergency telephone numbers.
  - Official Clinical Establishments Act registration number and GSTIN.
- **FR-02.2**: The Admin shall configure operating schedules: active days (Monday through Sunday), morning shift hours, evening shift hours, lunch buffers, and annual clinic holidays.
- **FR-02.3**: Application UI shall dynamically load clinic branding; zero clinic details shall be hardcoded in client or server code.

### Module 03: Doctor Management & Department Rostering (FR-03)
- **FR-03.1**: Admin shall manage doctors with: Full Name, Medical Council Registration Number, Specialty/Department, Qualifications (e.g., MBBS, MD, MS), Room Number, Consultation Fee, Max Daily Capacity, and Average Consultation Duration.
- **FR-03.2**: Doctors can be marked `ACTIVE` or `INACTIVE` (soft delete) to preserve historical clinical encounters and audit trails.
- **FR-03.3**: The system shall support configurable medical departments (General Medicine, Pediatrics, Orthopedics, Gynecology, Dermatology, ENT, Ophthalmology, Dental, etc.).

### Module 04: Staff Management (FR-04)
- **FR-04.1**: Admin shall provision individual user accounts for receptionists and clinic nurses.
- **FR-04.2**: Front-desk staff actions (patient check-in, token issuance, billing collections) shall be linked to the individual authenticated user ID for accountability.

### Module 05: Patient Registration & Identity (FR-05)
- **FR-05.1**: Every patient registered in the system shall be allocated a unique, immutable Unique Hospital Identification Number (UHID) formatted as `{{CLINIC_PREFIX}}-YYMM-XXXXX` (e.g., `OPD-2611-00042`).
- **FR-05.2**: Mandatory registration fields: Full Name, Age / Date of Birth, Gender, Primary Mobile Number, Address, and Emergency Contact Name & Phone.
- **FR-05.3**: Reception search bar shall return debounced patient results in under 100ms querying across UHID, phone number, and full name via compound MongoDB text indexes.

### Module 06: Patient Medical Profiles (FR-06)
- **FR-06.1**: The system shall maintain an ongoing medical profile per patient: blood group, verified drug allergies (e.g., Penicillin, Sulfa drugs), chronic diseases (e.g., Type 2 Diabetes, Hypertension, Asthma), and surgical history.
- **FR-06.2**: Documented allergies shall automatically render as prominent red warning badges in the doctor consultation workspace.

### Module 07: Appointment Scheduling Engine (FR-07)
- **FR-07.1**: The scheduling engine shall dynamically compute discrete available appointment slots per doctor based on shift hours, slot duration (e.g., 15 minutes), buffer gaps, existing bookings, and approved doctor leaves.
- **FR-07.2**: **Double-Booking Prevention**: The engine shall strictly prevent concurrent or overlapping bookings using MongoDB multi-document ACID transactions and partial unique compound indexes (`doctorId + appointmentDate + timeSlot`).
- **FR-07.3**: Configurable advance booking window (default: up to 14 calendar days).
- **FR-07.4**: Rescheduling and cancellation shall enforce clinic cutoff rules (default: minimum 4 hours notice required before slot time).
- **FR-07.5**: Appointment status state machine: `SCHEDULED` → `CONFIRMED` → `CHECKED_IN` → `COMPLETED` / `CANCELLED` / `NO_SHOW`.

### Module 08: Smart Specialist Doctor Auto-Allocation Engine (FR-08)
- **FR-08.1**: When a patient or receptionist selects a specialty without choosing a specific doctor, the system shall execute the `DoctorAllocationService` to identify the most suitable specialist.
- **FR-08.2**: **Workload Scoring Algorithm**: The system shall compute each eligible doctor's Workload Index ($W_i$) using:
  $$M_{commit} = (A_{conf} \cdot w_a + Q_{wait} \cdot w_q + C_{active} \cdot w_c) \times D_{avg}$$
  $$S_{cap} = \frac{A_{tot}}{K_{max}}$$
  $$W_i = \left(\frac{M_{commit}}{\max(T_{rem}, 15)}\right) \times (1 + S_{cap})$$
  *(Where $A_{conf}$ = confirmed upcoming appointments, $Q_{wait}$ = active waiting queue, $C_{active}$ = patient in consultation, $D_{avg}$ = average consultation duration, $T_{rem}$ = remaining shift minutes, $K_{max}$ = doctor capacity threshold).*
- **FR-08.3**: **Priority Hierarchy**:
  1. Required medical specialty.
  2. Doctor verification and active status (`status === 'ACTIVE'`).
  3. Working schedule and leave clearance on target date.
  4. Available appointment slot matching requested timeframe.
  5. Lowest Workload Index ($W_i$) and remaining capacity.
  6. Estimated waiting time.
  7. Fair distribution tie-breaker (longest idle doctor / round-robin).
- **FR-08.4**: **Allocation Modes**:
  - *Mode A (Automatic Allocation)*: System assigns the lowest-workload specialist and presents the assignment to the patient before confirmation.
  - *Mode B (Patient Choice)*: Patient browses eligible specialists, views slot availability and workload indicators, and manually selects a doctor.
  - Clinic Admin configures default mode (`AUTOMATIC`, `PATIENT_CHOICE`, or `HYBRID`).
- **FR-08.5**: **Receptionist Override**:
  - Receptionists can view eligible doctors with live workload scores.
  - Receptionists can use 1-click auto-allocation or manually select an alternate specialist.
  - Overriding requires selecting a standardized reason code and enters a mandatory audit log entry.
- **FR-08.6**: **Dynamic Recalculation**: Workload scores and allocation eligibility recalculate automatically upon: appointment booking, cancellation, rescheduling, patient check-in, consultation start, consultation completion, and doctor schedule/leave change.

### Module 09: Doctor Availability & Leave Management (FR-09)
- **FR-09.1**: Doctors and Admin shall configure recurring weekly schedules with split-shift support (e.g., Morning 09:00–13:00, Evening 17:00–20:00).
- **FR-09.2**: Doctors can request or mark leaves (full day or specific shift).
- **FR-09.3**: Marking a leave shall immediately flag all conflicting booked appointments and notify affected patients via SMS and Email with priority rescheduling links.

### Module 10: OPD Check-In & Sequential Token Generation (FR-10)
- **FR-10.1**: **Cardinal Rule**: An appointment reserves time, but does NOT allocate an OPD token. A sequential OPD Token is generated **only** when the patient physically reports to reception and is checked in.
- **FR-10.2**: Check-in converts the `Appointment` to `CHECKED_IN`, creates an active clinical `Visit`, and issues a `QueueEntry`.
- **FR-10.3**: Token counters reset daily at midnight (Token #1, #2, #3... per doctor).
- **FR-10.4**: Walk-in patients without prior appointments are registered and assigned the next available FIFO token for the requested or auto-allocated doctor.

### Module 11: Real-Time Live Queue Management & Waiting Display (FR-11)
- **FR-11.1**: Real-time queue state transitions (`WAITING` → `CALLED` → `IN_CONSULTATION` → `COMPLETED` / `SKIPPED`) shall broadcast across Socket.IO rooms within 500 milliseconds.
- **FR-11.2**: Waiting Room TV Display Mode: Fullscreen interface displaying Current Token Being Served, Doctor Name, Room Number, and Next 3 Queued Tokens.
- **FR-11.3**: Audible chime alert (`chime.mp3`) and text-to-speech voice prompt play automatically when a doctor calls the next token.
- **FR-11.4**: **Emergency Override**: Clinician-approved emergency override elevates a critical patient to `TOKEN-EMERGENCY` at the head of the queue without altering sequential token numbers.

### Module 12: Doctor Clinical Consultation Workspace (FR-12)
- **FR-12.1**: Ergonomic split-screen layout: left panel displays patient vitals, allergies, and longitudinal EMR timeline; right panel provides the active consultation form.
- **FR-12.2**: Structured consultation capture: Chief Complaints (searchable tags + free text), Vitals (BP, Pulse, Temperature, SpO2, Weight, BMI), Clinical Findings, Diagnosis (with ICD-10 search), and Treatment Plan.

### Module 13: Digital Prescriptions (e-Rx) & PDFKit Engine (FR-13)
- **FR-13.1**: Structured medication entry: Drug Name, Dosage Strength, Form (Tablet, Capsule, Syrup, Injection, Drops, Ointment), Frequency (e.g., 1-0-1), Duration (Days), and Timing (Before/After food, Bedtime, SOS).
- **FR-13.2**: Backend PDFKit service streams official vector A4 prescription PDFs bearing clinic branding, doctor registration details, patient demographics, medication table, advice, and a cryptographic QR verification code.

### Module 14: Longitudinal Medical History Timeline (FR-14)
- **FR-14.1**: Chronological, interactive timeline aggregating all past visits, prescriptions, vitals trends, and lab reports for a patient under their UHID.
- **FR-14.2**: Clinical records are strictly immutable (write-once); past records cannot be edited or overwritten during a repeat consultation.

### Module 15: Diagnostic Report Management & Cloud Storage (FR-15)
- **FR-15.1**: Receptionists and Doctors shall upload diagnostic reports (PDF, JPG, PNG up to 10MB) stored securely in Cloudinary.
- **FR-15.2**: File access requires time-limited pre-signed URLs (TTL = 15 minutes) validated against role authorization.

### Module 16: Follow-Up Scheduling & Compliance (FR-16)
- **FR-16.1**: Doctor can recommend follow-up intervals (e.g., "Review in 5 days") upon finalizing consultation.
- **FR-16.2**: System calculates target date and dispatches automated SMS/Email reminders 48 hours prior to the recommended follow-up date.

### Module 17: Billing, Invoicing & Financial Settlement (FR-17)
- **FR-17.1**: Invoices automatically populate consultation fees based on doctor profile and support itemized additions (ECG, dressings, laboratory tests, procedures).
- **FR-17.2**: Sequential invoice numbering: `INV-YYYY-XXXXX`.
- **FR-17.3**: Support percentage or fixed discounts requiring administrative authorization flags.
- **FR-17.4**: Tax compliance: Configurable GST rates (or tax-exempt classification for standard medical consultations).

### Module 18: Payment Tracking (FR-18)
- **FR-18.1**: Front-desk cashier records payment settlements across Cash, Static UPI QR, and Card POS terminal.
- **FR-18.2**: Support split payments (e.g., partial cash, balance UPI) and track outstanding balance dues.
- **FR-18.3**: Instant generation and printing of PDFKit itemized receipts.

### Module 19: Multi-Channel Notifications (FR-19)
- **FR-19.1**: Transactional SMS via MSG91/Twilio with TRAI DLT registration in India for appointment confirmations, token check-ins, call alerts, and reminders.
- **FR-19.2**: Responsive HTML emails via SendGrid / Nodemailer SMTP for appointment details, digital prescriptions, and receipts.
- **FR-19.3**: Real-time in-app toast alerts via Socket.IO.

### Module 20: Clinic Business Analytics & Financial Reports (FR-20)
- **FR-20.1**: Executive analytics dashboards powered by Recharts: Daily patient volume, new vs returning ratio, doctor-wise consultation breakdown, average patient wait times, cancellation rates, and revenue trends by payment mode.
- **FR-20.2**: One-click data export to CSV/Excel for accounting reconciliation.

### Module 21: Tamper-Evident Audit Logging (FR-21)
- **FR-21.1**: Immutable append-only audit trail capturing every sensitive event (User ID, Role, Action, Target Resource, ID, IP Address, User Agent, Timestamp).
- **FR-21.2**: Zero delete or update endpoints exposed in the API for audit records.

### Module 22: Patient Self-Service Portal (FR-22)
- **FR-22.1**: Mobile-first responsive web portal enabling patients to book slots, view live token waiting status, download prescriptions and invoices, and manage digital consent under the DPDP Act 2023.

---

## 4. User Stories & Acceptance Criteria Matrix (Selected Sample)

| Story ID | Role | User Story | Acceptance Criteria |
|---|---|---|---|
| **US-01** | Patient | As a patient, I want to select a specialty and have the system auto-assign the best available doctor so that I don't have to research individual doctor schedules. | 1. System displays assigned doctor and wait time.<br>2. Workload score verified as lowest.<br>3. Patient can toggle to manual selection if desired. |
| **US-02** | Receptionist | As a receptionist, I want to override an auto-allocation when a patient requests a specific doctor so that patient continuity of care is respected. | 1. Roster shows all eligible doctors.<br>2. Selecting alternate doctor prompts for reason code.<br>3. Override logged to audit trail. |
| **US-03** | Doctor | As a doctor, I want to click "Call Next" so that the waiting room screen displays my room number and plays an audible chime. | 1. Real-time broadcast reaches TV in < 500ms.<br>2. Chime sound plays.<br>3. Next token status changes to CALLED. |
| **US-04** | Receptionist | As a receptionist, I want to check in an arriving patient by mobile number in under 10 seconds so that waiting lines move quickly. | 1. Debounced search returns record in < 100ms.<br>2. Check-In button allocates next daily token.<br>3. Token slip prints immediately. |
| **US-05** | Admin | As a clinic owner, I want to review doctor-wise appointment counts and revenue collections so that I can evaluate clinic operational efficiency. | 1. Recharts breakdown by doctor.<br>2. Filterable by date range.<br>3. Exportable to CSV. |

---

## 5. Non-Functional Requirements (NFR)

- **Performance**: API p95 response time < 300ms; Socket.IO token broadcast < 500ms; PDFKit prescription generation < 100ms.
- **Security**: TLS 1.3 encryption in transit; bcrypt (cost factor 12) password hashing; AES-256 encryption at rest; Cloudinary pre-signed URLs (TTL 15m).
- **Compliance**: Indian DPDP Act 2023 consent capture; CERT-In 6-hour breach reporting readiness; NMC electronic prescription standards.
- **Availability**: 99.5% uptime during clinic hours (08:00–21:00 IST); 3-tier backup strategy (Atlas continuous PITR + daily encrypted off-site dumps + monthly restoration drill).
- **Accessibility**: WCAG 2.1 Level AA compliance; 4.5:1 text contrast; keyboard shortcuts (`Alt+C`, `Alt+N`, `Alt+P`); bilingual English/Hindi support.
