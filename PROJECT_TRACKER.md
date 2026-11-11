# Smart OPD – Single Clinic Management System: Master Project Tracker

> **Document ID:** PROJECT_TRACKER.md  
> **System Scope:** Outpatient Department (OPD) Management Platform for a Single Clinic  
> **Current Stage:** Stage B – Application Implementation  
> **Active Phase:** PHASE 8 – Doctor Consultation  
> **Last Updated:** 2026-11-12  
> **Repository Structure:** `frontend/`, `backend/`, `docs/`, `README.md`, `PROJECT_TRACKER.md`, `.gitignore`  

---

## 1. Project Overview & Tracking Summary

| Metric | Status / Value | Description |
|---|---|---|
| **Product Name** | Smart OPD (Single Clinic Digital Healthcare Platform) | Configurable clinic branding, working hours & fees |
| **Stage A Status** | **100% COMPLETE & AUDITED** | All 15 master documents approved and harmonized |
| **Stage B Target** | **15 Implementation Phases** | Full working MERN application with zero mock dependency |
| **Current Focus** | **Phase 8: Doctor Consultation** | Today's appointments, waiting patients, patient longitudinal EMR, consultation notes, vitals with BMI auto-calc, diagnosis (ICD-10), treatment plan, digital prescriptions |
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
| **08** | **Doctor Consultation** | **IN PROGRESS** | Daily schedule roster, waiting patients list, patient longitudinal EMR, chief complaints, vitals with BMI, diagnosis with ICD-10, treatment plan, digital prescription builder. |
| **09** | **Medical Records** | PENDING | Prescription history (write-once immutable), medical reports vault, diagnostic uploads, visit timeline, follow-up history. |
| **10** | **Billing** | PENDING | Consultation charges, itemized invoice generation, payment recording (Cash, Static UPI QR, Card), discounts with Admin PIN permission, daily collections report. |
| **11** | **Notifications** | PENDING | Appointment confirmations, reminders, cancellation alerts, follow-up alerts, email (Nodemailer) and SMS integration ready. |
| **12** | **Patient Portal** | PENDING | Patient self-service login, appointment booking (auto-alloc or choice), live token status tracker, downloadable PDF prescriptions and receipts, medical records viewer. |
| **13** | **Analytics** | PENDING | Recharts executive dashboards: daily patient footfall, new vs returning ratio, doctor-wise volume, average wait time, revenue trends, cancellation statistics. |
| **14** | **Advanced Features** | PENDING | Non-autonomous AI clinical co-pilot (EMR summarization, dictation structuring, preliminary intake tags), mandatory Human-in-the-Loop review, smart operational recommendations. |
| **15** | **Quality and Deployment** | PENDING | Full test suites (Unit, Integration, E2E), security testing, RBAC testing, error handling, backup scripts, production deployment configuration, final report. |

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
- [ ] Create Prescription Model (`backend/src/models/Prescription.ts`):
  - Linkages: clinicId, patientId, doctorId, appointmentId, visitId.
  - Vitals: bpSystolic, bpDiastolic, pulseRate, temperatureF, respiratoryRate, spo2Percent, weightKg, heightCm, bmi (auto-computed).
  - Clinical examination & notes: chiefComplaints array (complaint, duration, severity), clinicalObservations, pastHistoryNotes.
  - Diagnosis: provisionalDiagnosis, finalDiagnosis, icd10Codes array (code, description).
  - Rx Medications: drugName, genericName, form (Tablet, Syrup, Capsule, Injection, Drops, Ointment), dosageStrength, frequency (e.g. 1-0-1, 1-0-0, 0-0-1, 1-1-1, SOS), durationDays, foodTiming (BEFORE_FOOD, AFTER_FOOD, WITH_FOOD, EMPTY_STOMACH), specialInstructions.
  - Investigations ordered: labTests array, radiologyTests array.
  - Advice & Lifestyle: generalAdvice, dietaryRestrictions.
  - Follow-up: followUpDays, followUpDate, urgentSosWarning.
  - Digital signature / verification: doctorRegNumber, signedAt, isDraft.
- [ ] Build Consultation & Prescription Controller (`backend/src/controllers/prescriptionController.ts`) & Routes:
  - `GET /api/v1/prescriptions/patient/:patientId`: Patient prescription history.
  - `GET /api/v1/prescriptions/:id`: Single prescription details.
  - `POST /api/v1/prescriptions`: Save draft or complete prescription.
  - `PUT /api/v1/prescriptions/:id`: Update draft prescription.
  - `POST /api/v1/prescriptions/:id/finalize`: Finalize and sign prescription (write-once lock, auto-updates visit to COMPLETED).
- [ ] Create Doctor Consultation Workspace (`frontend/src/pages/doctor/DoctorWorkspacePage.tsx`):
  - Split-view ergonomic layout:
    - Left column: Today's Waiting Queue & Active Patient Selector.
    - Middle/Right column: Active Patient Banner with red allergy alerts, longitudinal EMR tabs (Past Visits, Lab Reports, Prescriptions), and Consultation / Rx Builder.
  - Interactive Digital Rx Builder:
    - Vitals input card with instant BMI calculation ($weight / (height/100)^2$) and classification (Underweight, Normal, Overweight, Obese).
    - Chief complaints chip list with duration.
    - ICD-10 Diagnosis search & select.
    - Fast Medication Entry table: Drug autocomplete/suggestions, Form, Strength, Frequency (1-0-1 pills), Food Timing pills, Duration, Instructions.
    - Ordered Investigations & Advice.
    - Follow-up date picker / quick +7, +14, +30 day buttons.
    - 1-click "Finalize & Print Prescription" generating clean clinical Rx letterhead slip.
- [ ] Mount `/doctor/workspace` in `frontend/src/App.tsx`.
- [ ] Verify TypeScript builds and run integration test against live backend & MongoDB.
