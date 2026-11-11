# Smart OPD – Project Tracker & Living Status Board

> **Document ID:** 11_PROJECT_TRACKER  
> **Version:** 1.0.0  
> **Status:** Active / Ready for Implementation  
> **Last Updated:** 2026-11-11  
> **Target Release:** Q1 2027  
> **Stack:** React 18 · TypeScript · Vite · Tailwind · Node.js 20 · Express · MongoDB 7 · Socket.IO  

---

## 1. Project Status Header

| Metric | Current Value | Target / Notes |
|---|---|---|
| **Current Phase** | Stage A: Documentation Review & Sign-Off | Transition to Phase 1 upon review |
| **Documentation Completion** | 100% (All 15 Deliverables Ready) | Ready for Stakeholder Sign-Off |
| **Application Code Completion** | 0% (Pre-Implementation Gate) | Phase 1 Scaffolding Ready to Start |
| **Active Blockers** | 0 Blockers | None |
| **Open Clinic Decisions** | 30 Pending Inquiries | Tracked in `15_OPEN_QUESTIONS.md` |
| **Next Major Milestone** | Phase 1 Foundation & Auth Completion | Scaffold + JWT + Role-based Routing |

---

## 2. Phase-by-Phase Milestone Summary

| Phase ID | Name | Target Duration | Status | Planned Start | Planned Finish |
|---|---|---|---|---|---|
| **Phase 0** | Stage A: Healthcare Architecture & Documentation | 2 Weeks | **DONE** | 2026-11-01 | 2026-11-11 |
| **Phase 1** | Foundation, Auth & Role-Based Access Control | 2 Weeks | **TODO** | 2026-11-12 | 2026-11-25 |
| **Phase 2** | Clinic Profile & Multi-Department Configuration | 1 Week | **TODO** | 2026-11-26 | 2026-12-03 |
| **Phase 3** | Doctor Availability, Rosters & Schedule Engine | 2 Weeks | **TODO** | 2026-12-04 | 2026-12-17 |
| **Phase 4** | Patient Demographics, Search & Medical Profile | 1.5 Weeks | **TODO** | 2026-12-18 | 2026-12-28 |
| **Phase 5** | Appointment Lifecycle & Slot Conflict Engine | 2.5 Weeks | **TODO** | 2026-12-29 | 2027-01-15 |
| **Phase 6** | OPD Check-In, Token Allocation & Live Socket.IO Queue | 2 Weeks | **TODO** | 2027-01-16 | 2027-01-30 |
| **Phase 7** | Doctor Workspace, Rx Engine (PDF) & Clinical Timeline | 2.5 Weeks | **TODO** | 2027-01-31 | 2027-02-16 |
| **Phase 8** | Billing (Invoices), Reports, Analytics, Audit & Hardening | 2 Weeks | **TODO** | 2027-02-17 | 2027-03-02 |

---

## 3. Work Breakdown Structure (WBS) & Task Tracking

### Phase 1: Foundation, Infrastructure & Authentication

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P1-T01 | Infra | Monorepo initialization with root `package.json`, `client/`, `server/` | Dev Lead | TODO | N/A |
| P1-T02 | Backend | Express server, CORS, Helmet, Morgan, and MongoDB Mongoose connection | Backend Dev | TODO | Ping / Health 200 OK |
| P1-T03 | Backend | Global Async Handler & Custom `AppError` Exception Hierarchy | Backend Dev | TODO | Unit Error Handler |
| P1-T04 | Backend | User Model with bcrypt password hashing (cost factor 12) & RBAC roles | Backend Dev | TODO | Mongoose Schema Tests |
| P1-T05 | Backend | Auth Controller: Register (Patient), Login, Refresh Token (httpOnly cookie), Logout | Backend Dev | TODO | Integration Auth Suite |
| P1-T06 | Backend | JWT Verification Middleware & Role Authorization Guard (`restrictTo`) | Backend Dev | TODO | RBAC Route Guard Tests |
| P1-T07 | Frontend | Vite + React + TypeScript + Tailwind CSS + Lucide Icons setup | Frontend Dev | TODO | Build smoke test |
| P1-T08 | Frontend | shadcn/ui component library integration & CSS custom design tokens | Frontend Dev | TODO | Component preview |
| P1-T09 | Frontend | React Router DOM v6 with role-restricted route wrappers | Frontend Dev | TODO | Route guard redirection |
| P1-T10 | Frontend | Auth Context & TanStack Query client setup with Axios interceptors | Frontend Dev | TODO | Token refresh loop test |
| P1-T11 | Frontend | Login, Register, Forgot Password, and Role Redirect Pages | Frontend Dev | TODO | Form validation & UI test |

### Phase 2: Clinic Profile & Configuration Management

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P2-T01 | Backend | `ClinicSetting` Schema: name, contact, working hours, tax/GST, logo URL | Backend Dev | TODO | Schema Validation |
| P2-T02 | Backend | Clinic Configuration CRUD Endpoints (`GET /clinic`, `PUT /clinic`) | Backend Dev | TODO | Admin Auth Guard Test |
| P2-T03 | Backend | Department & Specialty Sub-resource Management Endpoints | Backend Dev | TODO | CRUD Integration Test |
| P2-T04 | Frontend | Admin Settings Page: Clinic Info, Timings, Contact & Departments form | Frontend Dev | TODO | Form submission & cache |
| P2-T05 | Frontend | App-wide Clinic Header Branding component (dynamically loads clinic metadata) | Frontend Dev | TODO | Visual & Fallback test |

### Phase 3: Doctor Rostering, Leaves & Availability Engine

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P3-T01 | Backend | `Doctor`, `DoctorSchedule`, `DoctorLeave` Mongoose Schemas & Indexes | Backend Dev | TODO | Compound index tests |
| P3-T02 | Backend | Doctor CRUD API: profile, specialty, room number, consultation fee | Backend Dev | TODO | Admin Authorization Test |
| P3-T03 | Backend | Schedule Roster Endpoint (`PUT /doctors/:id/schedule`) with days/times/duration | Backend Dev | TODO | Time overlap validator |
| P3-T04 | Backend | Slot Generation Engine (`GET /doctors/:id/available-slots?date=YYYY-MM-DD`) | Backend Dev | TODO | Slot calculation math |
| P3-T05 | Backend | Doctor Leave & Vacation Override API | Backend Dev | TODO | Holiday conflict checks |
| P3-T06 | Frontend | Admin Doctor Management Table (search, add modal, edit, status toggle) | Frontend Dev | TODO | TanStack Table test |
| P3-T07 | Frontend | Doctor Schedule Editor (day selector, shift blocks, slot duration slider) | Frontend Dev | TODO | Dynamic form array |
| P3-T08 | Frontend | Doctor Leave Request & Calendar View | Frontend Dev | TODO | Interactive Calendar |

### Phase 4: Patient Demographics, Search & Medical Profile

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P4-T01 | Backend | `Patient` Mongoose Schema (UHID generation, demographics, emergency contact) | Backend Dev | TODO | UHID uniqueness test |
| P4-T02 | Backend | Patient Registration & Update API with Zod validation | Backend Dev | TODO | Payload validator suite |
| P4-T03 | Backend | Patient Search API (Fast indexed search on UHID, phone, and name) | Backend Dev | TODO | Sub-100ms response test |
| P4-T04 | Frontend | Receptionist Patient Quick-Search bar with debounced query | Frontend Dev | TODO | Debounce test |
| P4-T05 | Frontend | Receptionist Walk-in & New Patient Registration Drawer | Frontend Dev | TODO | Multi-step form test |
| P4-T06 | Frontend | Patient Profile View with Contact, Demographics & Medical Alert Badges | Frontend Dev | TODO | Render responsive test |

### Phase 5: Appointment Lifecycle & Slot Conflict Engine

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P5-T01 | Backend | `Appointment` Schema with status machine (`SCHEDULED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`) | Backend Dev | TODO | Status transition guards |
| P5-T02 | Backend | Double-Booking Prevention: Atomic booking with MongoDB transactions / compound unique indexes | Backend Dev | TODO | Concurrent booking race test |
| P5-T03 | Backend | Appointment Reschedule & Cancellation Endpoint with Policy Enforcement | Backend Dev | TODO | Policy cutoff rules test |
| P5-T04 | Backend | Daily/Weekly Calendar Aggregation API for Receptionist and Doctors | Backend Dev | TODO | Date range query test |
| P5-T05 | Frontend | Patient Booking Wizard (Specialty → Doctor → Date picker → Slot grid → Summary) | Frontend Dev | TODO | End-to-end wizard test |
| P5-T06 | Frontend | Receptionist Appointment Schedule Board (Filter by doctor, date, status) | Frontend Dev | TODO | Grid and list view |
| P5-T07 | Frontend | Doctor Calendar View (Daily patient roster) | Frontend Dev | TODO | Calendar sync test |

### Phase 6: OPD Check-In, Token Allocation & Live Socket.IO Queue

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P6-T01 | Backend | `Visit` and `QueueEntry` Models with daily sequential token generator | Backend Dev | TODO | Daily counter reset test |
| P6-T02 | Backend | Check-In Endpoint: converts scheduled appointment into active visit + assigned token | Backend Dev | TODO | Atomic transaction test |
| P6-T03 | Backend | Socket.IO Server Setup: Rooms by `clinic:{id}:queue:{doctorId}` | Backend Dev | TODO | Connection auth guard |
| P6-T04 | Backend | Real-time Queue Actions: `call-next`, `mark-in-consultation`, `skip`, `priority-emergency` | Backend Dev | TODO | Event broadcast tests |
| P6-T05 | Frontend | Receptionist OPD Check-in & Walk-In Token Dispatcher modal | Frontend Dev | TODO | Instant token print/view |
| P6-T06 | Frontend | Live Clinic Waiting Room Display (Large Screen Mode with Voice/Audio chime) | Frontend Dev | TODO | Fullscreen display test |
| P6-T07 | Frontend | Real-time Socket.IO Hook (`useLiveQueue`) with auto-reconnect & cache invalidation | Frontend Dev | TODO | Reconnect fallback test |

### Phase 7: Doctor Workspace, Rx Engine & Clinical Timeline

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P7-T01 | Backend | `Prescription` Schema with diagnosis, vitals, drugs table, and advice | Backend Dev | TODO | Drug entry validator |
| P7-T02 | Backend | PDFKit Service: High-resolution branded prescription PDF generation | Backend Dev | TODO | PDF binary output test |
| P7-T03 | Backend | `MedicalReport` Schema & Cloudinary signed upload integration | Backend Dev | TODO | File upload security test |
| P7-T04 | Backend | Follow-up Scheduling API & Patient Medical History Aggregation Endpoint | Backend Dev | TODO | Cross-visit query test |
| P7-T05 | Frontend | Doctor Clinical Workspace (Split View: Current Visit vs Medical History Timeline) | Frontend Dev | TODO | Ergonomic load test |
| P7-T06 | Frontend | Dynamic Prescription Builder (Searchable drug selector, dosage dropdown, duration) | Frontend Dev | TODO | React Hook Form array |
| P7-T07 | Frontend | One-Click PDF Preview & Download modal | Frontend Dev | TODO | PDF rendering preview |
| P7-T08 | Frontend | Medical Document Uploader (Drag-and-drop report viewer) | Frontend Dev | TODO | Drag-and-drop validation |

### Phase 8: Billing, Invoices, Analytics & Security Hardening

| Task ID | Component | Task Description | Assignee | Status | Test Coverage |
|---|---|---|---|---|---|
| P8-T01 | Backend | `Invoice` and `Payment` Schemas with auto-generated Invoice No | Backend Dev | TODO | Financial calculation check |
| P8-T02 | Backend | Billing Endpoints (Add items, apply discount, record cash/card/UPI payment) | Backend Dev | TODO | Transaction settlement |
| P8-T03 | Backend | PDFKit Invoice Receipt generator | Backend Dev | TODO | Receipt format check |
| P8-T04 | Backend | Analytics Aggregation Pipelines (Revenue trend, patient footfall, wait times) | Backend Dev | TODO | MongoDB pipeline tests |
| P8-T05 | Backend | Global Audit Logging Middleware (Records actor, action, resource, IP) | Backend Dev | TODO | Tamper-proof log tests |
| P8-T06 | Backend | Rate Limiting, CORS, Express Helmet, and Security Headers tuning | Security Eng | TODO | OWASP Top 10 automated scan |
| P8-T07 | Frontend | Receptionist Billing & POS Cashier Terminal | Frontend Dev | TODO | Quick billing flow |
| P8-T08 | Frontend | Admin Business Analytics Dashboard (Recharts revenue, volume, doctor metrics) | Frontend Dev | TODO | Chart rendering & filters |
| P8-T09 | Frontend | Audit Log Inspector with search, role filters, and date picker | Frontend Dev | TODO | Pagination test |
| P8-T10 | DevOps | CI/CD GitHub Actions pipeline & Production Deployment to Render/Vercel | DevOps Eng | TODO | Production smoke test |

---

## 4. Documentation Status Matrix

| Doc # | Filename | Primary Focus | Word Count | Status | Reviewed? |
|---|---|---|---|---|---|
| **00** | `00_DOCUMENTATION_INDEX.md` | Master Documentation Guide | ~2,500 | COMPLETE | YES |
| **01** | `01_PRD.md` | Product Requirements & Personas | ~8,000 | COMPLETE | YES |
| **02** | `02_DATABASE_ARCHITECTURE.md` | 16 Schemas, Indexes & ERD | ~9,500 | COMPLETE | YES |
| **03** | `03_API_DOCUMENTATION.md` | 70+ REST Endpoints & Sockets | ~10,000 | COMPLETE | YES |
| **04** | `04_UI_UX_SPECIFICATION.md` | Design System & 4 Dashboards | ~7,500 | COMPLETE | YES |
| **05** | `05_SECURITY_AND_COMPLIANCE.md` | DPDP 2023, RBAC & Hardening | ~7,800 | COMPLETE | YES |
| **06** | `06_SYSTEM_ARCHITECTURE.md` | Full Stack Architecture & Data Flows | ~7,200 | COMPLETE | YES |
| **07** | `07_WORKFLOWS.md` | 22 Clinical & Admin Workflows | ~10,500 | COMPLETE | YES |
| **08** | `08_TESTING_STRATEGY.md` | Unit, Integration, E2E & Load Plan | ~7,000 | COMPLETE | YES |
| **09** | `09_DEPLOYMENT_AND_DEVOPS.md` | CI/CD, Atlas, Vercel & Render | ~8,500 | COMPLETE | YES |
| **10** | `10_IMPLEMENTATION_ROADMAP.md` | Phase-by-phase execution plan | ~5,500 | COMPLETE | YES |
| **11** | `11_PROJECT_TRACKER.md` | Living status board & WBS | ~3,500 | COMPLETE | YES |
| **12** | `12_DATA_DICTIONARY.md` | Exhaustive field & enum dictionary | ~6,500 | COMPLETE | YES |
| **13** | `13_NOTIFICATION_SYSTEM.md` | Email, SMS & In-App spec | ~3,800 | COMPLETE | YES |
| **14** | `14_PDF_GENERATION.md` | Prescription & Invoice PDF design | ~3,200 | COMPLETE | YES |
| **15** | `15_OPEN_QUESTIONS.md` | Clinic owner decisions tracker | ~4,200 | COMPLETE | YES |

---

## 5. Defect & Bug Tracking Template

| Bug ID | Severity | Phase Detected | Description | Reproduction Steps | Assignee | Status | Resolution |
|---|---|---|---|---|---|---|---|
| *BUG-001* | *High* | *Phase 1* | *Sample: Refresh token not rotating on concurrent request* | *Trigger 2 simultaneous requests on token expiry* | *Backend* | *OPEN* | *Add atomic lock* |
| *(None)* | - | - | *No defects logged currently (Pre-Implementation)* | - | - | - | - |

---

## 6. Phase Gate Sign-Off Protocol

To advance from any phase to the subsequent phase, the following mandatory criteria must be satisfied:

1. **Automated Test Pass Rate**: 100% of existing unit and integration tests passing.
2. **TypeScript Compilation**: Zero compilation or type assertion errors (`tsc --noEmit`).
3. **Linting Compliance**: Clean ESLint run with zero warnings.
4. **Security Audit**: Zero high or critical vulnerabilities identified by `npm audit`.
5. **Documentation Parity**: Any changes in API contracts or database schema mirrored into `docs/`.
6. **Code Review**: Peer review approval on all merged pull requests.
