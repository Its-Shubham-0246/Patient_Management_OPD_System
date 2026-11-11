# Smart OPD – Single Clinic Management System: Master Project Tracker

> **Document ID:** PROJECT_TRACKER.md  
> **System Scope:** Outpatient Department (OPD) Management Platform for a Single Clinic  
> **Current Stage:** Stage B – Application Implementation  
> **Active Phase:** PHASE 4 – Patient Management  
> **Last Updated:** 2026-11-11  
> **Repository Structure:** `frontend/`, `backend/`, `docs/`, `README.md`, `PROJECT_TRACKER.md`, `.gitignore`  

---

## 1. Project Overview & Tracking Summary

| Metric | Status / Value | Description |
|---|---|---|
| **Product Name** | Smart OPD (Single Clinic Digital Healthcare Platform) | Configurable clinic branding, working hours & fees |
| **Stage A Status** | **100% COMPLETE & AUDITED** | All 15 master documents approved and harmonized |
| **Stage B Target** | **15 Implementation Phases** | Full working MERN application with zero mock dependency |
| **Current Focus** | **Phase 4: Patient Management** | Patient registration, unique UHID generator, debounced search (`Alt+C`), profiles, allergies, documents |
| **Primary Tech Stack** | React 18, Vite, TypeScript, Tailwind CSS, Node.js 20/24, Express, MongoDB 8, Socket.IO | Production-grade single-clinic architecture |

---

## 2. Stage B Implementation Phases & Task Tracker

| Phase # | Phase Title & Scope | Status | Deliverables & Acceptance Criteria |
|:---:|---|:---:|---|
| **01** | **Foundation** | **COMPLETED** | React+Vite+TS (`frontend/`), Node+Express+TS (`backend/`), MongoDB connected, env configs, React Router v6, reusable UI components (shadcn/Tailwind), complete responsive navigation layout. Verified via Vite production build and API health probe. |
| **02** | **Authentication** | **COMPLETED** | Login, logout, bcrypt hashing (cost 12), JWT 15m access + 7d rotated httpOnly refresh tokens, user registration, role guards (Admin, Doctor, Receptionist, Patient), brute-force lockout (5 attempts / 30 mins), seed endpoint (`POST /auth/seed`). |
| **03** | **Clinic Administration** | **COMPLETED** | Clinic profile & master settings (`clinicSettings`), statutory Clinical Establishments Act registry, doctor directory CRUD, weekly shift roster matrix, leave tracking & approvals, staff/receptionist management, holiday calendar. |
| **04** | **Patient Management** | **UP NEXT** | Patient registration, unique UHID generator (`OPD-YYMM-XXXXX`), debounced indexed search (`Alt+C`), patient medical profiles, allergies, chronic conditions, document upload. |
| **05** | **Admin & Receptionist Dashboards** | PENDING | Today's operational summary, patient & appointment KPIs, quick patient registration drawer (`Alt+N`), quick booking widget, live room monitor. |
| **06** | **Appointment Scheduling** | PENDING | Doctor availability engine, discrete slot calculation, online booking, receptionist booking, follow-up booking, walk-in appointments, reschedule/cancel, double-booking prevention (ACID txn). |
| **07** | **OPD Queue** | PENDING | Check-in trigger, daily sequential token generation (Token #1, #2... per doctor), live Socket.IO queue, waiting/called/in-consultation/completed/skipped states, 4K TV display board with audio chime. |
| **08** | **Doctor Consultation** | PENDING | Daily schedule roster, waiting patients list, patient longitudinal EMR, chief complaints, vitals with BMI, diagnosis with ICD-10, treatment plan, digital prescription builder. |
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
