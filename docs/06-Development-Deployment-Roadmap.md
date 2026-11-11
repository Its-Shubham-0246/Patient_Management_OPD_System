# Smart OPD – Development & Deployment Roadmap
## Single-Clinic Outpatient Department Management System

> **Document ID:** 06-Development-Deployment-Roadmap.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Target Timeline:** 12 Weeks (8 Phased Sprints)  
> **Infrastructure Target:** Vercel (Frontend) · Render.com (Backend API + WebSockets) · MongoDB Atlas (Database)  

---

## 1. Executive Implementation Timeline (Mermaid Gantt)

```mermaid
gantt
    title Smart OPD Engineering Roadmap (12 Weeks)
    dateFormat  YYYY-MM-DD
    section Stage A
    Architecture & Docs Review       :done, a1, 2026-11-01, 2026-11-11
    section Stage B Implementation
    Phase 1: Foundation & Auth       :active, p1, 2026-11-12, 2026-11-25
    Phase 2: Clinic Settings Engine  :p2, 2026-11-26, 2026-12-03
    Phase 3: Doctors, Rosters & Slot :p3, 2026-12-04, 2026-12-17
    Phase 4: Patient Demographics    :p4, 2026-12-18, 2026-12-28
    Phase 5: Appointment Engine      :p5, 2026-12-29, 2027-01-15
    Phase 6: OPD Ingress & Queue     :p6, 2027-01-16, 2027-01-30
    Phase 7: Doctor Workspace & Rx   :p7, 2027-01-31, 2027-02-16
    Phase 8: Billing, Analytics, QA  :p8, 2027-02-17, 2027-03-02
    section Staging & Go-Live
    Staging Pilot in Clinic          :s1, 2027-03-03, 2027-03-10
    Production Cutover               :milestone, m1, 2027-03-11, 0d
```

---

## 2. Phase-by-Phase Technical Execution Breakdown

### Phase 1: Foundation, Infrastructure & Authentication (Weeks 1–2)
- **Objective**: Establish monorepo structure, secure Express server, MongoDB connection, JWT auth, and React boilerplate.
- **Backend Deliverables**:
  - Express app with CORS, Helmet, Morgan, and custom `AppError` handler.
  - MongoDB connection using Mongoose v8 with reconnect retry logic.
  - `User` schema with bcrypt hashing (work factor 12).
  - Auth routes: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
  - JWT middleware (`authenticate`) + RBAC middleware (`restrictTo('ADMIN', 'DOCTOR', 'RECEPTIONIST')`).
- **Frontend Deliverables**:
  - Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui setup.
  - React Router v6 with `ProtectedRoute` wrappers for all 4 roles.
  - `AuthContext` with automatic background token refresh via Axios interceptors.
  - Clean Login, Patient Registration, and Forgot Password pages.
- **Phase Gate**: 100% passing tests for login/refresh lifecycle and role route guards.

### Phase 2: Clinic Profile & Configuration Management (Week 3)
- **Objective**: Provide dynamic clinic branding, working hours, and fee schedules with zero hardcoded identities.
- **Backend Deliverables**:
  - `ClinicSetting` schema and `/clinic` CRUD endpoints.
  - Department taxonomy management endpoints.
- **Frontend Deliverables**:
  - Admin Clinic Settings form: name, address, CEA registration, contact, logo uploader.
  - Operating hours matrix editor (Mon–Sun shifts and breaks).
  - Dynamic branding provider injecting clinic name and logo across all portals.
- **Phase Gate**: Admin updates clinic name/logo, immediately reflected across all portal headers.

### Phase 3: Doctor Rostering, Availability & Capacity Engine (Weeks 3–4)
- **Objective**: Doctor profiles, weekly shift schedules, leave calendar, capacity thresholds, and discrete slot calculation.
- **Backend Deliverables**:
  - `Doctor`, `DoctorSchedule`, and `DoctorLeave` models with capacity parameters (`maxDailyPatients`, `averageConsultationMinutes`, `isAutoAllocatable`).
  - Dynamic slot generation algorithm (`GET /doctors/:id/available-slots?date=YYYY-MM-DD`).
- **Frontend Deliverables**:
  - Admin Doctor Management table (add, edit, deactivate doctor, set capacity).
  - Interactive weekly schedule grid editor.
  - Doctor leave request modal.
- **Phase Gate**: Slot engine accurately computes available slots accounting for shift hours, consultation duration, existing bookings, and leaves.

### Phase 4: Patient Demographics & Medical Profile (Weeks 4–5)
- **Objective**: Rapid patient registration, unique UHID allocation, and indexed phone/name search.
- **Backend Deliverables**:
  - `Patient` model with sequential UHID generator (`OPD-YYMM-XXXXX`).
  - High-speed indexed search API (`GET /patients/search?q=`).
- **Frontend Deliverables**:
  - Receptionist slide-out drawer (`Sheet`) for rapid walk-in patient creation.
  - Debounced search bar with keyboard shortcut (`Alt + C` or `⌘K`).
  - Patient demographic card with allergy alert badges.
- **Phase Gate**: Search returns patient profiles under 100ms across a database of 10,000 seeded test records.

### Phase 5: Appointment Scheduling & Smart Doctor Auto-Allocation (Weeks 5–7)
- **Objective**: End-to-end appointment lifecycle with double-booking prevention and smart specialist auto-allocation.
- **Backend Deliverables**:
  - `Appointment` model with state machine and `allocationDetails` subdocument.
  - Dedicated `DoctorAllocationService`: Multi-factor workload calculation ($W_i$), 7-step priority pipeline, and tie-breaking.
  - Endpoints: `POST /appointments/auto-allocate` and `POST /appointments/override-allocation`.
  - Atomic booking transaction preventing double-booking race conditions.
  - Cancellation and rescheduling endpoints enforcing clinic policy cutoffs.
- **Frontend Deliverables**:
  - Patient Booking Wizard: Specialty → Doctor Auto-Allocation or Manual Choice → Date Picker → Slot Grid → Confirmation.
  - Receptionist allocation override drawer with reason code picker and live workload breakdown.
  - Doctor personal daily schedule calendar.
- **Phase Gate**: Simulated concurrent load test of 10 simultaneous bookings on the same slot results in exactly 1 booking and 9 atomic conflict errors.

### Phase 6: OPD Ingress, Sequential Tokens & Live WebSocket Queue (Weeks 7–8)
- **Objective**: Physical check-in, token generation, and real-time Socket.IO waiting room display.
- **Backend Deliverables**:
  - `Visit` and `QueueEntry` models with daily sequential token counter reset.
  - Check-in API converting appointments to active visits and queue entries.
  - Socket.IO server with room topologies and queue events (`queue:called`, `queue:emergency`).
- **Frontend Deliverables**:
  - Receptionist Check-In button with instant token slip printing.
  - Full-screen Waiting Room TV display with high-contrast typography and audible chime.
  - Doctor queue controller ("CALL NEXT ▶", "SKIP", "EMERGENCY ⚠️").
- **Phase Gate**: Calling next token on doctor console updates waiting room TV display and plays audio chime within 500ms over WebSockets.

### Phase 7: Doctor Clinical Workspace, Rx Engine & PDFKit (Weeks 8–10)
- **Objective**: Ergonomic clinical consultation console, longitudinal timeline, and vector PDF prescription generator.
- **Backend Deliverables**:
  - `Prescription` model with vitals, complaints, diagnoses, and medications array.
  - Node.js PDFKit service streaming vector-sharp A4 prescriptions with QR verification code.
  - Cloudinary upload integration for diagnostic lab reports.
- **Frontend Deliverables**:
  - Split-screen Doctor Workspace: left panel EMR history, right panel active Rx form.
  - Searchable drug autocomplete with dosage, frequency, and duration selectors.
  - Embedded PDF preview modal with one-click direct print.
- **Phase Gate**: Doctor completes consultation; PDF prescription generates, streams, and prints in under 150ms.

### Phase 8: Billing, POS Settlement, Analytics & Hardening (Weeks 10–12)
- **Objective**: Cashier invoicing, split payment tracking, business analytics, audit logging, and production deployment.
- **Backend Deliverables**:
  - `Invoice` and `Payment` models with sequential invoice numbering.
  - PDFKit invoice receipt generator.
  - Recharts analytics aggregation pipelines (footfall, revenue, wait times).
  - Global tamper-evident audit logging middleware.
- **Frontend Deliverables**:
  - Receptionist Billing POS console (Cash, UPI QR, Card settlement).
  - Admin Analytics Dashboard with interactive Recharts.
  - Audit log inspector table with date and role filters.
- **Phase Gate**: Full end-to-end integration test from appointment booking to check-in, consultation, prescription, and final cashier billing.

---

## 3. Production Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION INFRASTRUCTURE                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Patient Browser]     [Staff Desktops]     [Waiting Room TV]         │
│          │                     │                     │                 │
│          ▼                     ▼                     ▼                 │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │               Cloudflare DNS + SSL / TLS 1.3                 │     │
│   └──────────────┬───────────────────────────────┬───────────────┘     │
│                  │                               │                     │
│                  ▼                               ▼                     │
│   ┌─────────────────────────────┐ ┌──────────────────────────────┐     │
│   │  Vercel Edge Network (CDN)  │ │   Render.com Web Service     │     │
│   │    React 18 SPA (Vite)      │ │   Node.js 20 + Express API   │     │
│   │    Static Assets & HTML5    │ │   Socket.IO WebSocket Server │     │
│   └─────────────────────────────┘ └──────────────┬───────────────┘     │
│                                                  │                     │
│                                                  ▼                     │
│                                   ┌──────────────────────────────┐     │
│                                   │    MongoDB Atlas Cluster     │     │
│                                   │   Dedicated Primary + Replicas│    │
│                                   │   Automated Daily Backups    │     │
│                                   └──────────────────────────────┘     │
│                                                  ▲                     │
│                                                  │                     │
│                                   ┌──────────────┴───────────────┐     │
│                                   │      Cloudinary Cloud        │     │
│                                   │   Secure Medical Documents   │     │
│                                   └──────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. CI/CD GitHub Actions Automation Workflows

### 4.1 Continuous Integration (`.github/workflows/ci.yml`)
```yaml
name: Smart OPD Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate-and-test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js v20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript Type Check (Client & Server)
        run: |
          pnpm --filter server run type-check
          pnpm --filter client run type-check

      - name: Run ESLint
        run: pnpm run lint

      - name: Run Backend Unit & Integration Tests
        run: pnpm --filter server test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/smart_opd_test
          JWT_ACCESS_SECRET: test_secret_access_key
          JWT_REFRESH_SECRET: test_secret_refresh_key

      - name: Run Frontend Tests
        run: pnpm --filter client test:run
```

### 4.2 Production Deployment (`.github/workflows/deploy-production.yml`)
```yaml
name: Deploy Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Deploy Backend to Render
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"

      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 5. Environment Variables Catalog

| Variable Name | Environment | Purpose | Sensitivity |
|---|---|---|---|
| `PORT` | Backend | Port Express listens on (default: 5000) | Low |
| `NODE_ENV` | Backend | Runtime mode (`development`, `production`, `test`) | Low |
| `MONGODB_URI` | Backend | MongoDB Atlas connection string with credentials | CRITICAL |
| `JWT_ACCESS_SECRET` | Backend | 256-bit secret for signing access JWTs (15m) | CRITICAL |
| `JWT_REFRESH_SECRET` | Backend | 256-bit secret for signing refresh tokens (7d) | CRITICAL |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud identifier | Medium |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API access key | High |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API access secret | CRITICAL |
| `MSG91_AUTH_KEY` | Backend | SMS Gateway API Key for DLT transactional SMS | High |
| `SENDGRID_API_KEY` | Backend | SendGrid API key for transactional emails | High |
| `CLINICAL_DISCOUNT_AUTH_PIN` | Backend | Master PIN required for receptionists to apply billing discounts | CRITICAL |
| `CORS_ORIGIN` | Backend | Whitelist of frontend domains allowed | Medium |
| `VITE_API_URL` | Frontend | Base URL of Express backend API | Low |
| `VITE_SOCKET_URL` | Frontend | Base URL for Socket.IO WebSocket gateway | Low |

> [!IMPORTANT]
> **MongoDB Replica Set Prerequisite for ACID Transactions**:
> Smart OPD utilizes multi-document ACID transactions for slot locking, token generation, and payment settlement. In local development and automated testing, MongoDB must run with a replica set enabled (e.g. `mongod --replSet rs0` or `MongoMemoryReplSet.create()` in Jest test setup). Production deployments on MongoDB Atlas provide this by default via 3-node replica sets.
