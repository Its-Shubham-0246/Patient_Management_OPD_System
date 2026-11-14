# Smart OPD – Single Clinic Outpatient Department Platform

> A production-grade Outpatient Department (OPD) management suite architected for private clinics, polyclinics, and outpatient healthcare centers. Built with **React 18, TypeScript, Node.js 20/24, Express, MongoDB 8, and Socket.IO**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: v20 LTS](https://img.shields.io/badge/Node.js-v20_LTS-green.svg)](https://nodejs.org/)
[![React: v18](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![TypeScript: v5](https://img.shields.io/badge/TypeScript-v5-3178C6.svg)](https://www.typescriptlang.org/)
[![MongoDB: v8](https://img.shields.io/badge/MongoDB-v8.0-47A248.svg)](https://www.mongodb.com/)
[![Tailwind CSS: v3](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Socket.IO: v4](https://img.shields.io/badge/Socket.IO-v4-010101.svg)](https://socket.io/)

---

## 1. Product Capabilities & Clinical Principles

**Smart OPD** digitalizes the complete outpatient healthcare encounter from arrival to post-consultation follow-up, designed around actual clinical and front-desk workflows:

- **Single-Clinic Tenant Boundary**: Single-clinic architecture enforcing strict `clinicId` boundaries on all collections.
- **Appointment != OPD Token**: An appointment reserves a scheduled doctor time slot. Physical arrival and check-in creates an active clinical `Visit` and issues a live, sequential daily OPD Token (`Token #1`, `#2`...).
- **Real-Time Live Queue & 4K TV Display**: Waiting room 4K TV screen and clinician workspace synchronize over WebSocket (Socket.IO). Doctors call the next patient with one click; priority emergency cases can be expedited; audio chimes (Web Audio API D5 -> A5 slide) notify patients. DPDP Act 2023 compliant name masking (`RAHUL M.`).
- **Paperless Clinical Workspace**: Doctors access an interactive longitudinal EMR timeline, vitals logging with automatic BMI calculation, chief complaints, ICD-10 diagnostic coding, and digital prescription generation (`RX-YYMM-XXXXX`) with printable A4 letterhead.
- **Non-Autonomous Clinical AI Co-Pilot**: Dictation-to-SOAP structuring, ICD-10 grounding, longitudinal patient summaries, and pharmacovigilance screening (allergy and contraindication cross-checks). Governed strictly under mandatory Human-in-the-Loop (HITL) doctor review with immutable medico-legal audit trails.
- **Complete Billing & Cashier Ledger**: Cashier console generates itemized receipts (consultations, lab tests, procedures) with multiple settlement options (Cash, Dynamic UPI, Card), Admin PIN discount authorization, printable GST tax invoices (`INV-YYMM-XXXXX`), and thermal slips (`RCPT-YYMM-XXXXX`).
- **Multi-Channel Notifications**: TRAI DLT Compliant SMS (Header: `SMROPD`, <= 160 GSM chars), Nodemailer SMTP emails with DPDP footers, and Socket.IO real-time in-app alerts.
- **Patient Self-Service Portal**: Mobile-first live token tracker (`/portal/token`), appointment booking/cancellation, digital prescription vault, and profile management.
- **Executive Analytics & BI**: Interactive Recharts dashboards for revenue trends, footfall, payment channels, doctor workload, age cohorts, and 1-click accounting CSV export.
- **Security & Privacy First**: Compliant with the Indian **Digital Personal Data Protection (DPDP) Act 2023**, DISHA 7-year retention guidelines, bcrypt password hashing (cost 12), dual-token JWT (15m access + 7d rotated httpOnly refresh cookies), and immutable audit logs.

---

## 2. Four Distinct Role-Based Portals

```
+---------------------------------------------------------------------------------------------------+
| CLINICAL & ADMINISTRATIVE ROLES                                                                   |
+-------------------+-------------------------------------------------------------------------------+
| Portal            | Core Capabilities                                                             |
+-------------------+-------------------------------------------------------------------------------+
| Administrator     | Clinic branding, CEA registration, doctor roster matrix, staff management,    |
|                   | revenue analytics, cashier ledger, compliance audit logs, and backup tool.    |
| Receptionist      | Patient ingress, UHID search (Alt+C), new patient registration (Alt+N),       |
|                   | token check-in, walk-in scheduling, billing settlement, and cash drawer.      |
| Doctor            | Waiting queue, vitals & BMI, longitudinal EMR, Clinical AI Co-Pilot (SOAP),   |
|                   | drug safety allergy screen, e-Prescriptions (RX), and follow-up scheduling.   |
| Patient           | Self-service portal, live token queue tracking (/portal/token), appointments, |
|                   | digital prescription PDF downloads, diagnostic vault, and payment receipts.   |
+-------------------+-------------------------------------------------------------------------------+
```

---

## 3. Tech Stack Architecture

```
                                SMART OPD ARCHITECTURE
                                
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                           FRONTEND (React 18 + Vite)                            │
  │   Tailwind CSS · Lucide Icons · Recharts · Socket.IO Client · Web Audio API     │
  └────────────────────────┬───────────────────────────────────────┬────────────────┘
                           │ HTTPS / REST (JSON)                   │ WSS / WebSocket
                           ▼                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                         BACKEND (Node.js 20/24 + Express)                       │
  │   TypeScript · JWT Auth · Helmet · Nodemailer · AI Co-Pilot (PII Redaction)     │
  └────────────────────────┬───────────────────────────────────────┬────────────────┘
                           │ Mongoose 8.x ODM                      │ Event Broadcast
                           ▼                                       ▼
  ┌─────────────────────────────────────────────────┐   ┌───────────────────────────┐
  │                 DATABASE                        │   │     SOCKET.IO ROOMS       │
  │              MongoDB 8.x                        │   │  clinic:{id} · role:{role}│
  │   16 Collections · ACID Compound Indexes        │   │  user:{id} · TV Display   │
  └─────────────────────────────────────────────────┘   └───────────────────────────┘
```

---

## 4. Project Directory Structure

```
Patient_Management_OPD_System/
├── backend/
│   ├── src/
│   │   ├── config/              # Database & Environment configurations
│   │   ├── controllers/         # Express controllers (Auth, Patient, Queue, AI, etc.)
│   │   ├── middleware/          # Auth, RBAC, error handling, rate limiting
│   │   ├── models/              # 16 Mongoose Schemas (AuditLog, Prescription, etc.)
│   │   ├── routes/              # Express API Route handlers
│   │   ├── services/            # Clinical AI, Notifications, Billing, Queue engines
│   │   ├── utils/               # ApiResponse, DLT SMS sanitizer, UHID generators
│   │   ├── index.ts             # HTTP & Socket.IO server startup
│   │   └── server.ts            # Express application factory
│   ├── scripts/
│   │   ├── backup.mjs           # Automated SHA-256 database snapshot tool
│   │   └── restore.mjs          # Cryptographic restore tool
│   ├── test_phase11.mjs         # Notifications test suite (30/30 passed)
│   ├── test_phase12.mjs         # Patient Portal test suite (20/20 passed)
│   ├── test_phase13.mjs         # Analytics test suite (57/57 passed)
│   ├── test_phase14.mjs         # Clinical AI Co-Pilot test suite (67/67 passed)
│   ├── test_phase15_e2e.mjs     # Master E2E Lifecycle test suite (41/41 passed)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI, Layout, Modals, Doctor AI Drawer
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── pages/               # Dashboards, Consultation, Portal, Analytics, TV
│   │   ├── services/            # Axios API clients for all subsystems
│   │   ├── utils/               # Classnames, formatters, audio chime synth
│   │   ├── App.tsx              # React Router v6 routing & role guards
│   │   └── main.tsx             # Application mount point
│   ├── package.json
│   └── vite.config.ts
├── docs/                        # 15 Master Stage A architectural specifications
├── README.md                    # System documentation and production runbook
└── PROJECT_TRACKER.md           # Master Phase 1 - 15 completion tracker
```

---

## 5. Quick Start & Development Setup

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x+
- **MongoDB**: Local instance running on `127.0.0.1:27017` or MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/patient-management-opd-system.git
cd patient-management-opd-system

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Configuration
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smart_opd
JWT_ACCESS_SECRET=your_super_secret_access_jwt_key_here_32chars
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_32chars
CORS_ORIGIN=http://localhost:5173
API_PREFIX=/api/v1
ADMIN_DISCOUNT_PIN=1234
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start Development Servers
```bash
# Terminal 1: Backend
npm --prefix backend run dev

# Terminal 2: Frontend
npm --prefix frontend run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Default Demo Credentials

You can use the single-click quick login buttons on the login screen or manually enter:

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@smartopd.in` | `Admin@123` |
| **Consulting Doctor** | `doctor@smartopd.in` | `Doctor@123` |
| **Front-Desk Receptionist** | `reception@smartopd.in` | `Reception@123` |
| **Patient** | `patient@smartopd.in` | `Patient@123` |

---

## 7. Key Operational Endpoints Catalog (`/api/v1`)

```
+------------------------------------------------------------------------------------+
| CORE API ROUTE MATRIX                                                              |
+-------------------+------------------------+---------------------------------------+
| Subsystem         | Route                  | Description                           |
+-------------------+------------------------+---------------------------------------+
| Health Probe      | GET  /health           | Database connection & uptime status   |
| Authentication    | POST /auth/login       | Authenticate user & issue dual JWTs   |
|                   | POST /auth/refresh     | Rotate HTTP-only refresh token        |
|                   | POST /auth/seed        | Seed initial demo clinic & users      |
| Clinic Settings   | GET  /clinic           | Retrieve CEA registration & profile   |
|                   | PUT  /clinic           | Update operating rules & timings      |
| Doctor Directory  | GET  /doctors          | List doctors, fees, & room numbers    |
| Patient Records   | GET  /patients         | Search patients by name, UHID, phone  |
|                   | POST /patients         | Register patient & issue UHID         |
| Appointments      | POST /appointments     | Book appointment with slot lock       |
| Live OPD Queue    | GET  /queue/:doctorId  | Doctor's live token queue             |
|                   | POST /queue/checkin    | Receptionist arrival check-in         |
|                   | POST /queue/call-next  | Doctor calls next waiting patient     |
| Prescriptions     | POST /prescriptions    | Finalize digital prescription (RX)    |
| Diagnostics       | POST /records/patient/:id/reports | Upload lab report (DISHA 7-yr)  |
| Billing & Ledger  | POST /billing/invoices | Create itemized invoice (INV)         |
|                   | POST /payments         | Record payment transaction & receipt  |
| Clinical AI       | POST /ai/soap-assist   | Dictation-to-SOAP structuring (HITL)  |
|                   | POST /ai/drug-interaction-check | Drug-allergy safety screen   |
|                   | POST /ai/audit-accept  | Record doctor approval in audit trail |
| Notifications     | GET  /notifications    | Live alerts & DLT SMS log hub         |
| Business BI       | GET  /analytics/overview | Executive KPIs & financial totals   |
|                   | GET  /analytics/revenue | Collections by payment method & day   |
+-------------------+------------------------+---------------------------------------+
```

---

## 8. Automated Database Backup & Disaster Recovery

### Create a Point-in-Time Snapshot
```bash
node backend/scripts/backup.mjs
```
* Generates a timestamped JSON dump of all 16 collections in `backend/backups/backup-<timestamp>/`.
* Computes cryptographic SHA-256 hashes for each collection and outputs `manifest.json`.

### Reconstitute Database from Snapshot
```bash
# Restore latest backup
node backend/scripts/restore.mjs

# Or specify custom snapshot
node backend/scripts/restore.mjs --dir=backend/backups/backup-2026-11-14T14-17-51-215Z
```
* Verifies SHA-256 checksums before touching database.
* Performs atomic upserts to restore data without duplicates.

---

## 9. Automated Testing & Verification

Every subsystem is covered by automated verification scripts:

```bash
# Run Phase 11 (Notifications & TRAI DLT):
node backend/test_phase11.mjs       # 30 / 30 Passed (100%)

# Run Phase 12 (Patient Portal & Token Tracker):
node backend/test_phase12.mjs       # 20 / 20 Passed (100%)

# Run Phase 13 (Analytics & Financial Aggregations):
node backend/test_phase13.mjs       # 57 / 57 Passed (100%)

# Run Phase 14 (Clinical AI Co-Pilot & Safety Gates):
node backend/test_phase14.mjs       # 67 / 67 Passed (100%)

# Run Phase 15 (Master Full-Lifecycle Regression):
node backend/test_phase15_e2e.mjs   # 41 / 41 Passed (100%)
```

### Production Build Verification
```bash
# Backend TypeScript build
npm --prefix backend run build       # 0 errors

# Frontend Vite build
npm --prefix frontend run build      # 0 errors (dist/ ready for CDN/Nginx)
```

---

## 10. Regulatory Compliance & Medico-Legal Standards

1. **Digital Personal Data Protection (DPDP) Act 2023**:
   - Digital patient consent recorded during registration.
   - PII de-identification layer sanitizes patient identifiers before clinical AI structuring.
   - Public 4K TV Waiting Room display board masks patient names (`RAHUL M.`).
2. **Clinical Establishments Act (CEA)**:
   - Mandatory statutory clinic registration number (`REG-XXXXX`) embedded on all prescriptions and tax invoices.
3. **DISHA (Digital Information Security in Healthcare Act)**:
   - 7-year statutory retention index on all diagnostic reports and clinical encounter records.
4. **TRAI Telecom Commercial Communications Customer Preference Regulations (TCCCPR)**:
   - 6-character registered SMS header `SMROPD` strictly <= 160 GSM characters per template.
5. **WHO Ethics & Governance of AI for Health**:
   - Strictly non-autonomous advisory. Mandatory Human-in-the-Loop (HITL) doctor review with visual UI differentiation and audit logging.

---

## 11. Production Deployment Runbook

### Option A: Standard Node.js & Process Manager (PM2)
```bash
# 1. Build frontend and backend
npm --prefix backend run build
npm --prefix frontend run build

# 2. Start backend via PM2
pm2 start backend/dist/index.js --name "smart-opd-api" -i max

# 3. Serve frontend static build via Nginx or Caddy
# Point root to F:/Patient_Management_OPD_System/frontend/dist
```

### Sample Nginx Configuration
```nginx
server {
    listen 80;
    server_name clinic.smartopd.in;

    # Frontend Single Page App
    location / {
        root /var/www/smart-opd/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 12. License & Medico-Legal Disclaimer

Distributed under the **MIT License**.

> **Clinical Disclaimer:** Smart OPD is designed to facilitate clinical workflows and practice management. Clinical AI features are strictly non-autonomous cognitive assistants. The registered medical practitioner remains 100% legally and clinically responsible for all medical diagnoses, prescriptions, and treatments provided.
