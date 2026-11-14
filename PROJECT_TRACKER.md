# Smart OPD – Single Clinic Management System: Master Project Tracker

> **Document ID:** PROJECT_TRACKER.md  
> **System Scope:** Outpatient Department (OPD) Management Platform for a Single Clinic  
> **Current Stage:** Stage B – Application Implementation  
> **Active Phase:** PHASE 15 – Quality and Deployment  
> **Last Updated:** 2026-11-14  
> **Repository Structure:** `frontend/`, `backend/`, `docs/`, `README.md`, `PROJECT_TRACKER.md`, `.gitignore`  

---

## 1. Project Overview & Tracking Summary

| Metric | Status / Value | Description |
|---|---|---|
| **Product Name** | Smart OPD (Single Clinic Digital Healthcare Platform) | Configurable clinic branding, working hours & fees |
| **Stage A Status** | **100% COMPLETE & AUDITED** | All 15 master documents approved and harmonized |
| **Stage B Target** | **15 Implementation Phases** | Full working MERN application with zero mock dependency |
| **Current Focus** | **Phase 15: Quality & Deployment** | Full test suites (Unit, Integration, E2E), security audit, RBAC verification, backup scripts, production deployment configuration, final report |
| **Primary Tech Stack** | React 18, Vite, TypeScript, Tailwind CSS, Node.js 20/24, Express, MongoDB 8, Socket.IO | Production-grade single-clinic architecture |

---

## 2. Stage B Implementation Phases & Task Tracker

| Phase # | Phase Title & Scope | Status | Deliverables & Acceptance Criteria |
|:---:|---|:---:|---|
| **01** | **Foundation** | **COMPLETED** | React+Vite+TS (`frontend/`), Node+Express+TS (`backend/`), MongoDB connected, env configs, React Router v6, reusable UI components (shadcn/Tailwind), complete responsive navigation layout. Verified via Vite production build and API health probe. |
| **02** | **Authentication** | **COMPLETED** | Login, logout, bcrypt hashing (cost 12), JWT 15m access + 7d rotated httpOnly refresh tokens, user registration, role guards (Admin, Doctor, Receptionist, Patient), brute-force lockout (5 attempts / 30 mins), seed endpoint (`POST /auth/seed`). |
| **03** | **Clinic Administration** | **COMPLETED** | Clinic profile & master settings (`clinicSettings`), statutory Clinical Establishments Act registry, doctor directory CRUD, weekly shift roster matrix, leave tracking & approvals, staff/receptionist management, holiday calendar. |
| **04** | **Patient Management** | **COMPLETED** | Patient registration, unique UHID generator (`OPD-YYMM-XXXXX`), debounced indexed search (`Alt+C`), patient medical profiles, allergies & substance alerts, chronic conditions timeline, diagnostic reports vault. |
| **05** | **Admin & Receptionist Dashboards** | **COMPLETED** | Today's operational summary, patient & appointment KPIs, quick patient registration modal (`Alt+N`), quick booking modal, live active consulting room telemetry, arrival check-in and token issuance. |
| **06** | **Appointment Scheduling** | **COMPLETED** | Doctor availability engine, discrete slot calculation, online booking, receptionist booking, follow-up booking, walk-in appointments, reschedule/cancel, double-booking prevention (ACID compound index & app validation). |
| **07** | **OPD Queue** | **COMPLETED** | Check-in trigger, daily sequential token generation (Token #1, #2... per doctor), live Socket.IO queue, waiting/called/in-consultation/completed/skipped states, emergency priority promotion, dynamic wait time estimation, 4K TV display board with DPDP Act name masking (`RAHUL M.`) and dual-tone audio chime (D5->A5). |
| **08** | **Doctor Consultation** | **COMPLETED** | Daily schedule roster, waiting patients list, patient longitudinal EMR, chief complaints, vitals with BMI auto-calc, diagnosis with ICD-10, treatment plan, digital prescription builder (`RX-YYMM-XXXXX`), official printable A4 prescription letterhead, digital signature block. |
| **09** | **Medical Records** | **COMPLETED** | Prescription history, diagnostic report uploads with DISHA 7-year retention tracking, unified longitudinal patient timeline (`/records/patient/:id/timeline`), report soft-deletion, and follow-up scheduling. |
| **10** | **Billing** | **COMPLETED** | Itemized invoice generation (`INV-YYMM-XXXXX`), partial/full payment recording (Cash, Static UPI QR, Card), sequential receipts (`RCPT-YYMM-XXXXX`), Admin PIN discount authorization guard (HTTP 403 on invalid PIN), daily collection report, printable GST/CEA tax invoice and thermal slip. |
| **11** | **Notifications** | **COMPLETED** | Multi-channel notification engine (In-App, Nodemailer SMTP Email, TRAI DLT Compliant SMS), 7 pre-registered DLT templates (Header: `SMROPD`), DPDP Act 2023 legal footers, live header bell with unread popover dropdown, interactive Notification Center and DLT telecommunications sandbox. Verified via 30/30 automated checkpoints. |
| **12** | **Patient Portal** | **COMPLETED** | Complete patient self-service portal, live today's token card with queue position and wait time, dedicated mobile-first `LiveTokenTrackerPage` with Web Audio chime, appointment booking & cancellation with reason audit, tabbed clinical hub (prescriptions, diagnostic vault, invoices), and profile editor modal. Verified via 20/20 automated checkpoints. |
| **13** | **Analytics** | **COMPLETED** | Recharts executive dashboards: daily patient footfall, new vs returning ratio, doctor-wise volume, average wait time, revenue trends, cancellation statistics, age & gender cohorts, CSV export. Verified via 57/57 checkpoints. |
| **14** | **Advanced Features** | **COMPLETED** | Non-autonomous Clinical AI Assistant: Dictation-to-SOAP structuring, ICD-10 grounding, longitudinal EMR summarizer, drug-allergy pharmacovigilance screening, queue forecasting, mandatory HITL doctor approval banners, and immutable audit logging. Verified via 67/67 checkpoints. |
| **15** | **Quality and Deployment** | **IN PROGRESS** | Full test suites (Unit, Integration, E2E), security testing, RBAC testing, error handling, backup scripts, production deployment configuration, final report. |

---

## 3. Completed Phase Checklists

### Phase 1 Task Checklist: Foundation
- [x] Inspect all approved preparation documents and establish development task tracker.
- [x] Create root `.gitignore`.
- [x] Initialize `backend/` with Node.js 20/24, TypeScript, Express, CORS, Helmet, dotenv, and Mongoose.
- [x] Configure backend environment variables (`backend/.env` and `backend/.env.example`).
- [x] Implement MongoDB connection manager with auto-retry, status reporting, and health check route (`GET /api/v1/health`).
- [x] Initialize `frontend/` with React 18, Vite, TypeScript, and Tailwind CSS.
- [x] Configure frontend environment variables (`frontend/.env` and `frontend/.env.example`).
- [x] Configure React Router v6 with all core route placeholders (`/`, `/login`, `/register`, `/admin/*`, `/doctor/*`, `/reception/*`, `/portal/*`, `/display/waiting-room`).
- [x] Build reusable UI component library in `frontend/src/components/ui/` (Button, Input, Card, Badge, Table, Modal, Alert, Spinner, StatCard).
- [x] Build complete navigation layout (`AppLayout`, `Sidebar`, `Header`, `Breadcrumbs`, role switcher preview, responsive mobile menu).
- [x] Verify frontend build (`npm run build --prefix frontend` -> zero errors in 4.76s) and backend health server (`GET /api/v1/health` -> 200 OK, DB Connected).

### Phase 2 Task Checklist: Authentication
- [x] Design and create Mongoose models: `User` (with bcrypt hashing, brute-force lockout, role enum), `ClinicSetting`, and `Patient` (UHID generation).
- [x] Implement JWT Dual-Token Authentication utilities (15m Access Token + 7d HTTP-Only Refresh Token Cookie with automatic rotation).
- [x] Implement Express authentication middleware (`authenticate` and `restrictTo` RBAC).
- [x] Create Auth routes and controller: `/login`, `/register`, `/refresh`, `/logout`, `/me`, and `/seed`.
- [x] Build Frontend Auth Context (`AuthContext.tsx`) with automatic token storage, login/logout, and profile fetching.
- [x] Build and wire `LoginPage.tsx` with single-click demo role credentials (Admin, Doctor, Receptionist, Patient) and lockout warning handling.
- [x] Build and wire `RegisterPage.tsx` with DPDP Act 2023 consent checkbox and instant UHID issuance modal dialog.
- [x] Secure application routes with `ProtectedRoute.tsx` enforcing strict role boundaries.
- [x] Test end-to-end with live MongoDB database.

### Phase 3 Task Checklist: Clinic Administration
- [x] Design Mongoose models for Clinic Management:
  - `ClinicSetting`: Clinic identity, CEA registration, contact details, operating hours, OPD departments, scheduling rules, billing rules, holiday calendar.
  - `Doctor`: Council reg number, department, specialization, qualifications, room number, fee, avg time, max daily quota, auto-allocation flag.
  - `DoctorSchedule`: Weekly shifts matrix (Monday to Sunday) with start/end time, slot duration, and shift patient quota.
  - `DoctorLeave`: Doctor absence logging with start/end date, reason, shift specifications, and administrative approval workflow.
- [x] Implement Clinic Administration Controllers & Routes:
  - `GET /api/v1/clinic` & `PUT /api/v1/clinic` (profile and rules)
  - `GET /api/v1/clinic/holidays`, `POST /api/v1/clinic/holidays`, `DELETE /api/v1/clinic/holidays/:id`
  - `GET /api/v1/doctors` & `GET /api/v1/doctors/:id`
  - `POST /api/v1/doctors` & `PUT /api/v1/doctors/:id`
  - `GET /api/v1/doctors/:id/schedule` & `PUT /api/v1/doctors/:id/schedule`
  - `GET /api/v1/doctors/:id/leaves` & `POST /api/v1/doctors/:id/leaves`
  - `PUT /api/v1/doctors/leaves/:leaveId/status` (approval/rejection)
  - `GET /api/v1/staff`, `POST /api/v1/staff`, `PUT /api/v1/staff/:id`
- [x] Implement Frontend Client Service (`frontend/src/services/clinicService.ts`).
- [x] Create Admin Clinic Settings Page (`frontend/src/pages/admin/ClinicSettingsPage.tsx`):
  - Form for clinic profile, CEA registration number, GSTIN, and contact details.
  - Department and specialty tag management.
  - Operational rules: slot duration, advance booking limit, walk-in buffer slots, consultation fees, follow-up validity.
  - Clinic Holiday Calendar with date picker, reason, and delete action.
- [x] Create Admin Doctor Management Page (`frontend/src/pages/admin/DoctorManagementPage.tsx`):
  - Roster of practicing doctors with room numbers, fees, and auto-allocation status.
  - Add Doctor modal with full credentials and council registration.
  - Weekly shift schedule editor (Monday - Saturday shifts, timings, slot duration, capacity).
  - Leave & absence manager with administrative approval.
  - Status toggle (Active / Inactive).
- [x] Create Admin Staff Management Page (`frontend/src/pages/admin/StaffManagementPage.tsx`):
  - Front-desk receptionist roster with phone, email, and role badges.
  - Add Staff modal with role assignment and password.
  - Active/Inactive account toggle.
- [x] Mount routes in `App.tsx` (`/admin/settings`, `/admin/doctors`, `/admin/staff`) protected by `ADMIN` role.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors) and live database API operations.
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors).

### Phase 4 Task Checklist: Patient Management
- [x] Expand `Patient` model in `backend/src/models/Patient.ts`:
  - Demographic fields: full name, phone, email, date of birth, age, gender, blood group.
  - Unique sequential UHID generator: `OPD-YYMM-XXXXX` with monthly auto-increment.
  - Emergency contact: name, relation, phone.
  - Postal address: line1, line2, city, state, pincode.
  - Critical medical alerts: drug allergies array and chronic conditions array.
  - Longitudinal medical history: structured conditions, diagnosed years, active medications, notes.
  - Diagnostic document vault: subdocument schema for title, document category (LAB_REPORT, IMAGING, PREVIOUS_PRESCRIPTION, DISCHARGE_SUMMARY, OTHER), file URL, notes, and upload timestamp.
  - DPDP Act 2023 digital consent timestamp.
- [x] Implement Patient Controller (`backend/src/controllers/patientController.ts`) & Routes (`backend/src/routes/patientRoutes.ts`):
  - `GET /api/v1/patients`: Paginated list of clinic patients with blood group and gender filtering.
  - `GET /api/v1/patients/search?q=...`: Instant debounced search matching UHID, phone, or name (used for quick registration & booking lookups).
  - `GET /api/v1/patients/:id`: Profile fetch with role guard (patients can only access their own record; staff/clinicians can access all).
  - `POST /api/v1/patients`: Patient registration with validation, duplicate phone guard, and automatic UHID issuance.
  - `PUT /api/v1/patients/:id`: Demographics, address, and allergies update.
  - `POST /api/v1/patients/:id/documents`: Secure report attachment to patient vault.
  - `POST /api/v1/patients/:id/medical-history`: Chronic condition and medication entry.
  - `GET /api/v1/patients/:id/medical-history`: Longitudinal medical history aggregation.
- [x] Implement Frontend Client Service (`frontend/src/services/patientService.ts`).
- [x] Create Reception Patient Directory Page (`frontend/src/pages/reception/PatientDirectoryPage.tsx`):
  - Global `Alt+C` keyboard shortcut support for instant search focus.
  - Patient search and blood group filter chips.
  - Interactive table displaying UHID pills, patient demographics, drug allergy warnings, and chronic condition tags.
  - Registration modal dialog with instant UHID issuance card and one-click copy button.
- [x] Create Patient Profile & EMR View (`frontend/src/pages/patient/PatientProfilePage.tsx`):
  - Critical red allergy warning banner and amber chronic condition alert banner.
  - Demographics and emergency contact editor with save functionality.
  - Medical history & allergy management tab (add/remove allergy tags, record chronic conditions).
  - Diagnostic document vault tab with report category selector and direct file viewing.
  - Visit timeline tab.
- [x] Mount routes in `App.tsx` (`/reception/patients`, `/doctor/patients`, `/patients/:id`, `/doctor/patients/:id`).
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors) and live database API operations.
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 6.01s).

### Phase 5 Task Checklist: Admin and Receptionist Dashboards
- [x] Design and implement `Appointment` model (`backend/src/models/Appointment.ts`):
  - Fields for clinicId, patientId, doctorId, appointmentDate, timeSlot, slotDurationMinutes, bookingChannel, status, cancellationReason, tokenNumber, allocationDetails.
  - Unique index constraint on `{ doctorId, appointmentDate, timeSlot }` with partialFilterExpression excluding cancelled appointments.
- [x] Build Dashboard Telemetry Controller (`backend/src/controllers/dashboardController.ts`):
  - Aggregates live today's KPIs: total patients, today new patients, today bookings, checked-in count, completed count, active doctors count, estimated consultation revenue.
  - Computes doctor workload and active waiting lounge counts per clinician.
  - Feeds `/api/v1/analytics/dashboard` endpoint.
- [x] Build Appointments Controller (`backend/src/controllers/appointmentController.ts`):
  - `getAppointments`: date, doctor, patient, status filters with population.
  - `createAppointment`: double-booking protection, token issuance for walk-ins.
  - `updateAppointmentStatus`: status changes and sequential daily token generation on check-in.
  - `getAvailableSlots`: discrete slot generation based on doctor shift schedules and leave blocks.
  - `autoAllocateDoctor`: calculates $W_i$ workload scores and recommends optimal specialist.
- [x] Create Frontend Client Service (`frontend/src/services/appointmentService.ts`).
- [x] Create Quick Appointment Booking Modal (`frontend/src/components/dashboard/QuickBookingModal.tsx`):
  - Patient autocomplete search.
  - Physician selection with Smart OPD Auto-Allocation recommendation ($W_i$ score).
  - Discrete available time slot picker.
  - Walk-in / phone booking flow options.
- [x] Create Quick Patient Registration Modal (`frontend/src/components/dashboard/QuickPatientModal.tsx`):
  - Global `Alt+N` shortcut listener.
  - Immediate UHID generation with copy button and option to book appointment directly.
- [x] Upgrade Admin Operational Cockpit (`frontend/src/pages/AdminDashboard.tsx`):
  - Live StatCards (Today Bookings, Ingress Checked-In, Registered Patients, Estimated Revenue).
  - Attending Physicians & Consulting Room Telemetry table.
  - Today's Outpatient Appointments queue view.
- [x] Upgrade Front-Desk Reception Console (`frontend/src/pages/ReceptionDashboard.tsx`):
  - Smart Specialist Auto-Allocation recommendation ingress banner.
  - Status filter tabs (All, Pre-Booked, In Queue, Completed).
  - Arrival 1-click Check-In button generating daily queue token.
  - Print Ingress Slip dialog.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors) and live database API operations.
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 13.60s).

### Phase 6 Task Checklist: Appointment Scheduling
- [x] Enhance Appointment Scheduling Controller (`backend/src/controllers/appointmentController.ts`):
  - `rescheduleAppointment`: atomic date/slot reassignment with conflict detection.
  - `cancelAppointment`: cancellation with reason, freeing the slot immediately.
  - `getCalendarAppointments`: multi-day range queries for agenda and weekly grids.
  - `bookAutoAllocatedAppointment`: 1-click allocation and atomic reservation.
  - `getAvailableSlots`: accounts for weekly shifts, approved doctor leaves, and clinic holidays.
- [x] Mount routes in `backend/src/routes/appointmentRoutes.ts`:
  - `GET /api/v1/appointments/calendar`
  - `POST /api/v1/appointments/auto-allocate`
  - `PUT /api/v1/appointments/:id/reschedule`
  - `PUT /api/v1/appointments/:id/cancel`
- [x] Update Frontend Appointment Service (`frontend/src/services/appointmentService.ts`):
  - Add calendar, rescheduling, cancellation, and auto-allocated booking APIs.
  - Extend `User` interface with `patientProfileId`, `doctorProfileId`, `uhid`.
- [x] Build Clinic Appointment Scheduling Page (`frontend/src/pages/appointments/AppointmentSchedulingPage.tsx`):
  - Day Agenda, Week Grid, and All List view modes.
  - Interactive date navigator with date picker and jump-to-today.
  - Doctor and Status filtering.
  - In-line action buttons: 1-click Check-In, Reschedule with slot picker modal, Cancel with reason modal.
- [x] Build Patient Portal Appointment Booking Page (`frontend/src/pages/patient/BookAppointmentPage.tsx`):
  - 4-step booking wizard (Specialty -> Allocation Mode -> Date & Slots -> Symptoms/Confirmation).
  - Choice between Smart Auto-Allocation ($W_i$) and manual clinician selection.
  - Booking confirmation receipt screen with doctor, room, slot, and clinic location.
- [x] Mount routes in `frontend/src/App.tsx`:
  - `/admin/appointments` -> `AppointmentSchedulingPage`
  - `/doctor/appointments` -> `AppointmentSchedulingPage`
  - `/reception/appointments` -> `AppointmentSchedulingPage`
  - `/portal/book` -> `BookAppointmentPage`
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 16.04s).
- [x] Run live integration test against local MongoDB:
  - Booking -> Double-booking rejection (HTTP 409) -> Rescheduling -> Calendar query -> Auto-allocated booking -> Cancellation.

### Phase 7 Task Checklist: OPD Queue
- [x] Create Queue and Visit Models:
  - `backend/src/models/Visit.ts`: Clinic visit lifecycle (checkInTime, consultationStartTime, consultationEndTime, visitType, status: WAITING/IN_CONSULTATION/COMPLETED/CANCELLED).
  - `backend/src/models/QueueEntry.ts`: Sequential daily token tracking per doctor, status (WAITING, CALLED, IN_CONSULTATION, COMPLETED, SKIPPED), priorityOrder (Emergency=1, Normal=100), callCount, calledAt.
- [x] Build Queue Controller (`backend/src/controllers/queueController.ts`) and Routes (`backend/src/routes/queueRoutes.ts`):
  - `GET /api/v1/queue/display`: Public 4K waiting lounge display endpoint with DPDP Act 2023 compliant patient privacy masking (`maskPatientName`: "Rahul Mehta" -> "RAHUL M.").
  - `GET /api/v1/queue/:doctorId` and `GET /api/v1/queue/doctor/:doctorId`: Doctor-specific queue with dynamic waiting time computation based on doctor's `averageConsultationMinutes`.
  - `POST /api/v1/queue/checkin`: Ingress check-in generating daily sequential token, atomic visit creation, duplicate check-in guard (409 Conflict).
  - `PUT /api/v1/queue/:entryId/call-next`: Call next token, increments callCount, broadcasts `queue:called` event with room and token data.
  - `PUT /api/v1/queue/:entryId/start`: Transitions queue and visit to `IN_CONSULTATION`.
  - `PUT /api/v1/queue/:entryId/complete`: Transitions queue, visit, and linked appointment to `COMPLETED`.
  - `PUT /api/v1/queue/:entryId/skip`: Marks patient skipped (no-show after calls).
  - `PUT /api/v1/queue/:entryId/recall`: Recalls skipped patient back into active waiting queue.
  - `PUT /api/v1/queue/:entryId/emergency`: Elevates patient to Priority 1 (top of queue) with `queue:emergency` broadcast.
- [x] Build Frontend Queue Service (`frontend/src/services/queueService.ts`):
  - Full TypeScript types and REST client bindings for all queue transitions.
- [x] Build Live OPD Queue Operational Page (`frontend/src/pages/queue/LiveQueuePage.tsx`):
  - Real-time counters (Waiting, Serving, Completed, Emergency, Skipped).
  - Doctor selector filter.
  - Active queue table with Token badge, UHID, Patient Demographics, Allergy tags, Estimated Wait, Call, Start, Complete, Skip, Emergency buttons.
- [x] Upgrade 4K Waiting Room TV Display (`frontend/src/pages/WaitingRoomDisplay.tsx`):
  - Live auto-refresh polling with fallback.
  - Web Audio API dual-tone chime synthesizer (D5 -> A5 frequency slide) when new token is called.
  - DPDP Act compliant masked patient display (`RAHUL M.`).
  - Upcoming token carousel and active consultation rooms.
- [x] Mount routes in `frontend/src/App.tsx`:
  - `/admin/queue`, `/reception/queue`, `/queue` (Public Waiting Display).
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 19.51s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase7.mjs`):
  - Checked in patient -> Token generated.
  - Duplicate checkin blocked with 409 Conflict.
  - Doctor queue queried with dynamic estimated wait time.
  - Doctor called token -> Status CALLED, CallCount 1.
  - Public display verified with DPDP masking ("RAMESHWAR K.").
  - Started consultation -> IN_CONSULTATION.
  - Completed consultation -> COMPLETED.
  - Emergency patient checked in -> Priority 1.

### Phase 8 Task Checklist: Doctor Consultation
- [x] Create Prescription Model (`backend/src/models/Prescription.ts`):
  - Linkages: clinicId, patientId, doctorId, visitId.
  - Vitals: weightKg, heightCm, bmi (auto-computed), bloodPressure, pulseRate, temperatureF, respiratoryRate, spo2Percent, bloodGlucose.
  - Clinical examination & notes: chiefComplaints array, clinicalObservations.
  - Diagnosis: diagnosis array, icd10Codes array ({ code, description }).
  - Rx Medications: drugName, genericName, form (Tablet, Syrup, Capsule, Injection, Drops, Ointment, Inhaler, Other), dosage, frequency (1-0-1, 1-0-0, 0-0-1, 1-1-1, SOS), duration, instructions, quantity.
  - Investigations ordered: labTests array.
  - Advice & Lifestyle: advice, dietaryRestrictions.
  - Follow-up: followUpDays, followUpDate.
  - Digital signature / verification: doctorRegNumber, finalizedAt, digitalSignature, isFinalized.
- [x] Enhance Visit Model (`backend/src/models/Visit.ts`):
  - Added vitals, chiefComplaint, consultationNotes, diagnosis, icdCodes, treatmentPlan, followUpRequired, prescriptionId, invoiceId.
- [x] Build Consultation & Prescription Controller (`backend/src/controllers/prescriptionController.ts`) & Routes:
  - `GET /api/v1/prescriptions/formulary`: Common medication formulary catalog & ICD-10 quick codes.
  - `GET /api/v1/prescriptions/doctor/today`: Today's completed consultations list for clinician.
  - `GET /api/v1/prescriptions/patient/:patientId`: Patient longitudinal prescription history.
  - `GET /api/v1/prescriptions/visit/:visitId`: Single prescription by visit ID.
  - `GET /api/v1/prescriptions/:id`: Prescription detail with populated patient, doctor, clinic info.
  - `POST /api/v1/prescriptions/:visitId`: Save draft or finalize consultation:
    - Auto-generates monthly sequential prescription number `RX-YYMM-XXXXX`.
    - Auto-computes BMI from weight and height.
    - When `isFinalized: true`: marks prescription signed, updates Visit to `COMPLETED`, updates QueueEntry to `COMPLETED`, updates Appointment to `COMPLETED`, broadcasts Socket.IO events.
- [x] Mount routes in `backend/src/routes/prescriptionRoutes.ts` and `backend/src/routes/index.ts` under `/api/v1/prescriptions`.
- [x] Build Frontend Prescription Service (`frontend/src/services/prescriptionService.ts`).
- [x] Create Doctor Consultation Workspace (`frontend/src/pages/doctor/DoctorWorkspacePage.tsx`):
  - Split-view ergonomic layout:
    - Left column: Today's Waiting Queue & active patient indicator with one-click "Call Next Token" and live refresh.
    - Right column: Active Patient Banner with red allergy alerts, age/gender, phone, and tab switcher ("Prescription Builder" vs "Past History").
  - Interactive Digital Rx Builder:
    - Vitals input card with instant BMI auto-calc and color-coded status badge (Normal, Overweight, Obese).
    - Chief complaints clickable chips + custom complaints input.
    - ICD-10 diagnosis chips + custom diagnosis input.
    - Fast Medication Entry table: Quick formulary presets (+Paracetamol, +Augmentin, +Pantoprazole, etc.), Form dropdown, Strength, Frequency pills (1-0-1, 1-0-0, 0-0-1, 1-1-1, SOS), Duration, Instructions, and delete button.
    - Ordered Investigations (CBC, Blood Sugar, LFT, KFT, ECG, Chest X-Ray) clickable chips.
    - Advice & Dietary restrictions text areas.
    - Follow-up quick buttons (+3d, +5d, +7d, +14d, +30d) & date picker.
    - "Save as Draft" and "Finalize & Sign Consultation" action buttons.
    - Official printable A4 digital prescription letterhead modal with clinic header, doctor registration details, patient demographics, vitals, ℞ symbol, medication table, advice, and authenticated signature block.
- [x] Mount `/doctor/workspace` and `/admin/consultation` in `frontend/src/App.tsx` and `frontend/src/components/layout/Sidebar.tsx`.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 25.52s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase8.mjs`):
  - Formulary catalog query returned 15 medications and 11 ICD-10 codes.
  - Registered patient with penicillin allergy.
  - Checked into queue -> Token #4 generated.
  - Doctor called token and started consultation.
  - Draft prescription saved -> Auto BMI computed (25.5), Rx number assigned (`RX-2611-00001`).
  - Prescription retrieved by visit ID.
  - Consultation finalized -> Digitally signed, Visit & Queue transitioned to `COMPLETED`.
  - Patient longitudinal history verified.
  - Doctor today prescriptions list verified.

### Phase 9 Task Checklist: Medical Records
- [x] Create Medical Report Model (`backend/src/models/MedicalReport.ts`):
  - Linkages: clinicId, patientId, doctorId, visitId, uploadedBy.
  - Categories: lab, radiology, pathology, cardiology, other.
  - Document metadata: reportName, title, fileUrl, fileSizeBytes, mimeType, labName, referringDoctor, findings, isSharedWithPatient.
  - Statutory compliance: DISHA / DPDP 7-year retention tracking (`retentionUntil`).
  - Soft delete support: `isDeleted`, `deletedAt`.
- [x] Create Follow-Up Model (`backend/src/models/FollowUp.ts`):
  - Linkages: clinicId, patientId, doctorId, visitId, prescriptionId, createdBy.
  - Due date, clinical reason, instructions, reminderSentAt, status (`scheduled`, `reminder_sent`, `completed`, `missed`, `cancelled`).
- [x] Build Medical Records Controller (`backend/src/controllers/medicalRecordController.ts`) & Routes:
  - `GET /api/v1/records/patient/:patientId/timeline`: Unified longitudinal medical timeline aggregating all visits, consultations, prescriptions, and lab reports into one chronological feed with vitals trends.
  - `GET /api/v1/reports/patient/:patientId`: Paginated list of diagnostic reports with category filtering.
  - `POST /api/v1/reports/patient/:patientId`: Upload & attach diagnostic report to patient vault.
  - `GET /api/v1/reports/reports/:id`: Single report details.
  - `DELETE /api/v1/reports/reports/:id`: Soft delete report with audit trail.
  - `GET /api/v1/followups/followups`: Follow-up reviews list.
  - `POST /api/v1/followups/followups`: Schedule follow-up consultation.
  - `PUT /api/v1/followups/followups/:id/status`: Update follow-up status (e.g. `completed`).
- [x] Build Frontend Medical Records Service (`frontend/src/services/medicalRecordService.ts`).
- [x] Build Patient Medical Records & EMR Hub Page (`frontend/src/pages/patient/MedicalRecordsPage.tsx`):
  - Unified longitudinal visit timeline with chronological encounter cards and prescription view/print.
  - Diagnostic reports vault with category chips, report preview, and upload dialog.
  - Follow-up tracking timeline with "+ Schedule Follow-Up" and "Mark Done" buttons.
  - Prominent red critical drug allergy banner.
- [x] Mount routes in `frontend/src/App.tsx`:
  - `/doctor/records`, `/doctor/records/:id`, `/reception/records`, `/reception/records/:id`, `/portal/records`, `/portal/prescriptions`, `/portal/reports`.
- [x] Update `Sidebar.tsx` navigation links for Doctor, Receptionist, and Patient.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 26.96s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase9.mjs`):
  - Uploaded CBC and Chest X-Ray reports.
  - Verified reports listing and category filtering.
  - Scheduled and updated follow-up consultation.
  - Verified unified longitudinal patient timeline containing all 4 event types (`ENCOUNTER`, `PRESCRIPTION`, `DIAGNOSTIC_REPORT`, `FOLLOW_UP`).
  - Verified soft delete of diagnostic report.

### Phase 10 Task Checklist: Billing
- [x] Create Invoice & Payment Models:
  - `backend/src/models/Invoice.ts`:
    - Linkages: clinicId, patientId, doctorId, visitId, appointmentId.
    - Sequential monthly invoice number: `INV-YYMM-XXXXX`.
    - Line items: description, category (consultation, procedure, lab, medicine, registration, other), quantity, unitPrice, discount, tax, total.
    - Financials: subtotal, discountAmount, discountPercentage, discountReason, discountApprovedBy (Admin PIN auth), taxAmount, grandTotal, paidAmount, balanceAmount.
    - Status: draft, pending, partially_paid, paid, void, refunded.
  - `backend/src/models/Payment.ts`:
    - Linkages: clinicId, invoiceId, patientId, receivedBy.
    - Sequential receipt number: `RCPT-YYMM-XXXXX`.
    - Methods: cash, card, upi, netbanking, insurance, cheque, other.
    - Payment details: amount, transactionRef (UTR/auth code), paymentDate, notes.
- [x] Build Billing & Settlement Controller (`backend/src/controllers/billingController.ts`) & Routes:
  - `POST /api/v1/invoices`: Itemized invoice creation with discount validation (requires Admin PIN e.g. "1234", rejects invalid PIN with HTTP 403 Forbidden).
  - `GET /api/v1/invoices`: Paginated invoice list with patient, doctor, status, date filters.
  - `GET /api/v1/invoices/:id`: Detailed invoice view with line items and attached payments trail.
  - `POST /api/v1/invoices/:id/payments`: Record payment (Cash, Static UPI QR, Card) with automatic balance recalculation, receipt issuance (`RCPT-YYMM-XXXXX`), and status transition (`partially_paid` -> `paid`).
  - `POST /api/v1/invoices/:id/discount`: Apply discount with Admin PIN authorization.
  - `GET /api/v1/billing/daily-report`: Daily collections report broken down by payment mode (Cash vs UPI vs Card) and cashier.
  - `POST /api/v1/invoices/:id/void`: Soft void invoice with reason audit trail.
- [x] Build Frontend Billing Service (`frontend/src/services/billingService.ts`).
- [x] Build Front-Desk Cashier & Settlement Page (`frontend/src/pages/billing/BillingLedgerPage.tsx`):
  - Daily collection summary cards (Total Invoiced, Cash Collected, UPI Collected, Card Collected, Outstanding Balance).
  - Unpaid / Pending invoices table with 1-click "Settle Bill" action.
  - Settlement Modal with Static UPI QR display (scan to pay with amount and VPA), Cash change calculator (cash tendered - bill amount), and Card authorization code.
  - Printable official GST / Clinical Establishments Act tax invoice and thermal receipt.
- [x] Mount routes in `frontend/src/App.tsx`:
  - `/admin/billing`, `/reception/billing`, `/portal/invoices`.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 11.66s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase10.mjs`):
  - Created patient and generated invoice with line items (₹930 subtotal).
  - Verified 403 rejection on invalid Admin PIN for discount.
  - Applied 10% discount with valid PIN -> Grand Total ₹837.00.
  - Recorded partial UPI payment (₹337.00) -> Status transitioned to `partially_paid`, balance ₹500.00.
  - Recorded final Cash payment (₹500.00) -> Status transitioned to `paid`, balance ₹0.00.
  - Queried payment receipts list -> Returned 2 receipts.
  - Generated daily collection report -> Aggregated ₹1674 collected across modes.
  - Voided unpaid invoice -> Status transitioned to `void`.

### Phase 11 Task Checklist: Notifications
- [x] Create Notification Model (`backend/src/models/Notification.ts`):
  - Linkages: `clinicId`, `recipientUserId`, `recipientPatientId`, `recipientRole`.
  - Channels: `IN_APP`, `EMAIL`, `SMS`, `MULTI`.
  - Types: `APPOINTMENT`, `QUEUE`, `PRESCRIPTION`, `REPORT`, `BILLING`, `SYSTEM`.
  - Events: `APPT_CONFIRMED`, `APPT_REMINDER_24H`, `APPT_CANCELLED`, `APPT_RESCHEDULED`, `CHECKIN_TOKEN_ISSUED`, `QUEUE_NEXT_CALLED`, `QUEUE_DELAY_ALERT`, `PRESCRIPTION_READY`, `REPORT_UPLOADED`, `FOLLOWUP_REMINDER`, `INVOICE_GENERATED`, `DOCTOR_LEAVE_NOTICE`, `SYSTEM_ALERT`.
  - Delivery audit logs: array of `{ channel, status, timestamp, messageId, error, dltTemplateId }`.
  - Status: `PENDING`, `SENT`, `DELIVERED`, `FAILED`.
  - Read tracking: `isRead`, `readAt`.
  - Compound indexes for fast unread queries and DPDP 90-day retention minimization.
- [x] Implement Multi-Channel Notification Engine (`backend/src/services/notificationService.ts`):
  - Indian TRAI DLT Compliant SMS Engine:
    - Registered 6-char Header: `SMROPD`.
    - 7 registered DLT templates: `APPT_CONFIRMED` (`1107168923450012`), `CHECKIN_TOKEN_ISSUED` (`1107168923450013`), `QUEUE_NEXT_CALLED` (`1107168923450014`), `FOLLOWUP_REMINDER` (`1107168923450015`), `DOCTOR_LEAVE_NOTICE` (`1107168923450016`), `INVOICE_GENERATED` (`1107168923450017`), `PRESCRIPTION_READY` (`1107168923450018`).
    - DLT variable sanitizer stripping control chars (`\n`, `\t`, `<>`) and keeping GSM messages <= 160 chars.
    - Transactional SMS gateway logger with message ID generation.
  - Responsive Healthcare HTML Email Generator:
    - Medical deep navy (`#1e2d4a`), clinical blue (`#3b82f6`), and light slate container.
    - Standard header with clinic logo, emergency hotline (`108`), content card, CTA button.
    - Statutory DPDP Act 2023 legal footer with clinic address and confidentiality disclaimer.
    - Nodemailer SMTP transporter with fallback development json logger.
  - Socket.IO Real-Time Engine:
    - Dispatches to personal rooms (`user:${recipientUserId}`), role rooms (`role:${recipientRole}`), and clinic room (`clinic:${clinicId}`).
  - Clinical Trigger Facades:
    - `notifyAppointmentConfirmed`: auto-invoked when appointment is booked.
    - `notifyQueueTokenIssued`: auto-invoked on reception check-in.
    - `notifyQueueCalled`: auto-invoked on doctor "Call Next".
    - `notifyPrescriptionReady`: auto-invoked on doctor prescription finalization.
    - `notifyInvoiceGenerated`: auto-invoked on billing cashier settlement.
    - `notifyFollowUpReminder`: auto-invoked on follow-up scheduling.
- [x] Build Notification Controller (`backend/src/controllers/notificationController.ts`) & Routes (`backend/src/routes/notificationRoutes.ts`):
  - `GET /api/v1/notifications`: Paginated notifications with role, type, channel, and unread filters.
  - `GET /api/v1/notifications/unread-count`: Fast unread badge counter.
  - `GET /api/v1/notifications/templates`: Metadata list of all registered TRAI DLT templates.
  - `PUT /api/v1/notifications/:id/read`: Mark individual notification as read with timestamp.
  - `PUT /api/v1/notifications/read-all`: Mark all notifications as read for current user/clinic scope.
  - `POST /api/v1/notifications/send`: Staff manual broadcast alert.
  - `POST /api/v1/notifications/test-template`: Live DLT GSM character counter and email preview sandbox.
  - `DELETE /api/v1/notifications/:id`: Delete alert.
- [x] Build Frontend Notification Service & UI Components:
  - `frontend/src/services/notificationService.ts`: Full TypeScript API client bindings.
  - Header Bell Popover Dropdown (`frontend/src/components/layout/Header.tsx`):
    - Live unread badge count with pulse animation.
    - Popover dropdown showing recent alerts, category icons, relative timestamps ("Just now", "5m ago").
    - Direct "Mark all read" button.
    - 1-click navigation to linked action URLs (`/portal/token`, `/portal/dashboard`, etc.).
  - Notification Center Page (`frontend/src/pages/notifications/NotificationCenterPage.tsx`):
    - Metrics summary (Total Dispatched, Unread Alerts, SMS Header `SMROPD`, SMTP Status).
    - Category filter tabs (All, Unread, Appointments, Live Queue, e-Prescriptions, Billing, System).
    - Search bar and auto-refresh.
    - Expandable telecommunications dispatch audit log (channel, status, timestamp, DLT Template ID, Message ID).
    - Interactive DLT Testing & Dispatch Sandbox Modal with live 160-char GSM counter and simulated transmission.
  - Integrated into `App.tsx` (`/notifications`, `/admin/notifications`, `/reception/notifications`, `/doctor/notifications`) and `Sidebar.tsx`.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 10.10s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase11.mjs`):
  - 30 / 30 checkpoints passed with exit code 0.

---

### Phase 12 Task Checklist: Patient Portal
- [x] Build Dynamic Patient Portal Dashboard (`frontend/src/pages/PatientPortal.tsx`):
  - 100% dynamic MongoDB live backend integration (zero mock data).
  - Welcome banner with patient UHID, age, gender, blood group, contact info, and DPDP digital consent badge.
  - Critical medical allergy warning banner (highlighting documented drug/substance allergies).
  - Staff preview mode switcher (allowing Admin/Doctor/Receptionist to preview any patient's portal view).
  - Active today's encounter card with live queue position, estimated wait time, attending physician, and room number.
  - Consultations & appointments list with 1-click "Cancel Appointment" (with reason prompt) and "Book Consultation".
  - Interactive Tabbed Clinical & Financial Hub:
    - Tab 1: Digital Prescriptions (`RX-YYMM-XXXXX`) with printable official A4 letterhead prescription modal.
    - Tab 2: Lab & Diagnostic Reports vault with external document upload modal (`POST /api/v1/records/patient/:id/reports`).
    - Tab 3: Payment Invoices & Receipts with printable tax invoice slip.
- [x] Build Mobile-First Live Token Tracker (`frontend/src/pages/patient/LiveTokenTrackerPage.tsx`):
  - Accessible via `/portal/token`.
  - Huge glowing token number display, status indicator (`WAITING`, `CALLED`, `IN_CONSULTATION`, `COMPLETED`).
  - Doctor name, qualification, and big consultation room badge (`Room #102`).
  - Real-time queue position countdown and estimated wait minutes.
  - Web Audio API dual-tone chime synthesizer (D5 -> A5 frequency slide) when token is called.
  - Patient guidance ("While you wait" tips).
- [x] Build Patient Profile Editor Modal (`frontend/src/components/patient/PatientProfileModal.tsx`):
  - Patient contact details (mobile, email).
  - Emergency contact (name, relation, phone).
  - Residential address (line 1, city, state, pincode).
  - Updates live MongoDB patient document (`PUT /api/v1/patients/:id`).
- [x] Mount routes in `frontend/src/App.tsx` and configure role permissions for PATIENT, ADMIN, DOCTOR, RECEPTIONIST.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 6.99s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase12.mjs`):
  - 20 / 20 checkpoints passed with exit code 0.

---

### Phase 13 Task Checklist: Analytics & Business Intelligence
- [x] Implement Analytics Aggregations & Controller (`backend/src/controllers/analyticsController.ts`):
  - `parseDateRange` helper defaulting to last 30 days with custom `?from=YYYY-MM-DD&to=YYYY-MM-DD` query override.
  - `getOverviewAnalytics`: Total clinic patients, new patients in window, total scheduled appointments, completed consultations, cancellation rate %, total invoiced revenue, collections, outstanding dues, average wait time, and emergency cases.
  - `getAppointmentAnalytics`: Status breakdown (`CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), daily volume trend with completed vs cancelled distribution, doctor volume breakdown, and booking channels.
  - `getRevenueAnalytics`: Financial ledger breakdown, payment channels (`cash`, `upi`, `card`, `netbanking`, `other`), daily invoiced vs collected trend, itemized categories (`consultation`, `lab`, `procedure`, `medicine`), and physician billing attribution.
  - `getDoctorAnalytics`: Active doctor roster metrics, total appointments, completed consultations, completion rate %, revenue generated, room numbers, and average consultation durations.
  - `getPatientAnalytics`: Total registered vs new vs returning cohorts, gender ratio (`MALE`, `FEMALE`, `OTHER`), age cohorts (`0-17`, `18-35`, `36-50`, `51-65`, `65+`), top clinical allergies, and chronic conditions.
  - `getQueueAnalytics`: Total tokens issued, average wait minutes (14.5m baseline), peak OPD check-in hour detection, emergency case counts, skipped rates, and 13-hour hourly check-in distribution (08:00 to 20:00).
- [x] Mount Analytics routes in `backend/src/routes/analyticsRoutes.ts`:
  - `GET /api/v1/analytics/dashboard` (operational dashboard stats)
  - `GET /api/v1/analytics/overview` (executive KPIs)
  - `GET /api/v1/analytics/appointments` (booking & cancellation trends)
  - `GET /api/v1/analytics/revenue` (financial reconciliation)
  - `GET /api/v1/analytics/doctors` (physician performance)
  - `GET /api/v1/analytics/patients` (demographic cohorts)
  - `GET /api/v1/analytics/queue` (throughput & peak hours)
  - Protected with `authenticate` and `restrictTo` role guards.
- [x] Build Frontend Analytics Service (`frontend/src/services/analyticsService.ts`):
  - Typed TypeScript client bindings for all 6 analytics aggregation endpoints with date range parameters.
- [x] Build Executive Business Analytics Dashboard (`frontend/src/pages/admin/AnalyticsDashboardPage.tsx`):
  - Preset filter tabs: "Today", "Last 7 Days", "Last 30 Days", "This Month", and "Custom" date picker.
  - 5 Top Executive StatCards: Total Revenue, Outstanding Dues (with collection rate), Total Appointments (with completed & cancellation rate), Clinic Footfall (with new patients count), Average OPD Wait (with peak hour badge).
  - Recharts Visualizations:
    - **Revenue & Collections Trend**: `ResponsiveContainer` + `AreaChart` with dual linear gradients (`#3B82F6` Invoiced vs `#10B981` Collected).
    - **Payment Channels**: Donut `PieChart` with color-coded legend and formatted INR values.
    - **Daily Patient Appointments**: Grouped `BarChart` comparing Total Scheduled vs Completed Consultations.
    - **Queue Hourly Ingress**: `BarChart` displaying hourly token check-in density across operating hours (08:00 - 20:00) with peak hour badge.
    - **Doctor Productivity Table**: Physician directory with specialization, room, appointments, completed consultations, completion rate progress bar, and revenue attribution.
    - **Patient Demographics**: Horizontal `BarChart` for age groups (`0-17`, `18-35`, `36-50`, `51-65`, `65+`), gender ratio donut chart, and risk badges for top chronic conditions and allergies.
  - One-click CSV Export button downloading `smart_opd_analytics_<date>.csv` with complete financial and clinical metrics for accounting reconciliation.
- [x] Route `/admin/analytics` wired in `frontend/src/App.tsx` and linked from `Sidebar.tsx`.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 11.71s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase13.mjs`):
  - 57 / 57 checkpoints passed with exit code 0 (100% pass rate).

---

### Phase 14 Task Checklist: Advanced Features (Clinical AI Co-Pilot & HITL)
- [x] Design non-autonomous Clinical AI Assistant Service (`backend/src/services/aiAssistantService.ts`):
  - Strict PII de-identification sanitizer (`anonymizeClinicalPayload`) stripping patientName, phone, email, uhid, address, and masking embedded phone numbers and emails with `[REDACTED_PHONE]`, `[REDACTED_EMAIL]`, and assigning ephemeral tokens.
  - Dictation-to-SOAP structuring engine (`structureToSoapNote`) parsing unstructured voice/text notes into:
    - Subjective (chief complaints with duration, detailed HPI).
    - Objective (hemodynamic vitals summary, physical examination observations).
    - Assessment (primary impression, differential diagnoses grounded in ICD-10 standard codes).
    - Plan (non-pharmacological advice, suggested investigations, follow-up timeline).
    - Mandatory Human-in-the-Loop disclaimer and `aiDraft: true` metadata.
  - Longitudinal EMR visit summarizer (`summarizePatientHistory`) synthesizing past encounters, chronic condition timelines, active regimens, and high-risk surveillance flags.
  - Pharmacovigilance & Drug-Allergy Safety Engine (`checkDrugSafety`):
    - Penicillin allergy vs Penicillins (`CRITICAL`).
    - Cephalosporin cross-allergenicity with Penicillin (`HIGH`).
    - Sulfa drug hypersensitivity (`CRITICAL`).
    - NSAIDs in Peptic Ulcer Disease & Asthma (`HIGH` / `CRITICAL`).
    - Non-selective Beta-Blockers in Bronchial Asthma (`CRITICAL`).
    - Corticosteroids in Type 2 Diabetes (`HIGH`).
    - Clean prescriptions cleared with `NONE` severity.
  - Smart Operational Queue Forecasting (`forecastQueueOperations`) predicting daily footfall, peak influx hours, and doctor roster allocation.
  - Immutable Audit Logging (`logAIAuditEvent` & `backend/src/models/AuditLog.ts`) retaining DPDP Act 2023 compliant audit logs.
- [x] Build AI Co-Pilot Controller & Routes (`backend/src/controllers/aiController.ts` & `backend/src/routes/aiRoutes.ts`):
  - `POST /api/v1/ai/soap-assist`: Structure unstructured dictation into SOAP notes.
  - `POST /api/v1/ai/summarize-history`: Longitudinal summary pulling live MongoDB EMR records.
  - `POST /api/v1/ai/drug-interaction-check`: Cross-reaction pharmacovigilance screening.
  - `POST /api/v1/ai/operational-forecast`: Patient influx and peak hours forecast.
  - `POST /api/v1/ai/audit-accept`: Doctor explicit acceptance or discard of AI draft.
  - `GET /api/v1/ai/audit-logs`: Paginated compliance and governance audit trails.
  - Mounted at `/api/v1/ai/*` in `backend/src/routes/index.ts`.
- [x] Build Doctor Consultation AI Assistant Modal & Workspace Safeguards (`DoctorWorkspacePage.tsx` & `AiClinicalCopilotModal.tsx`):
  - Floating "AI Co-Pilot" trigger button in doctor consultation workspace.
  - 3-Tab interactive drawer: Dictation-to-SOAP, Longitudinal EMR Summary, and Drug Safety Screen.
  - Visual UI Safeguards: Light-blue background with dashed border (`border-blue-400 bg-blue-50/50`) and "AI Draft - Non-Autonomous" badge.
  - One-click "Accept & Insert into Form" inserting complaints, observations, ICD-10 codes, advice, and investigations directly into consultation fields.
  - Real-time Pharmacovigilance Warning Card above medication table highlighting drug-allergy or disease contraindications.
- [x] Build Admin Compliance Audit Logs Page (`frontend/src/pages/admin/AuditLogsPage.tsx`):
  - Accessible via `/admin/audit` (linked in `Sidebar.tsx`).
  - Filterable by event type (SOAP generated, doctor approved, discarded, drug safety checks).
  - Displays immutable timestamp, actor doctor, patient UHID, and audit details.
- [x] Verify backend build (`npm run build --prefix backend` -> 0 errors).
- [x] Verify frontend build (`npm run build --prefix frontend` -> 0 errors in 34.41s).
- [x] Execute automated end-to-end integration test (`node backend/test_phase14.mjs`):
  - 67 / 67 checkpoints passed with exit code 0 (100% pass rate).

---

### Phase 15 Task Checklist: Quality, Security & Deployment (Final Phase)
- [ ] Run comprehensive end-to-end regression across all 14 completed modules.
- [ ] Security audit: verify RBAC restrictions, JWT token security, rate-limiting, and PII sanitization.
- [ ] Automated backup & restore script (`backend/scripts/backup.mjs`).
- [ ] Production build and environment configuration verification.
- [ ] Comprehensive Final System Report & handover documentation.
