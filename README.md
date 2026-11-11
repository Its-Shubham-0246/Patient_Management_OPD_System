# 🏥 Smart OPD – Clinic Management Platform

> A modern outpatient department (OPD) clinic management software suite architected for private clinics, polyclinics, and outpatient healthcare centers. Built with **React 18, TypeScript, Node.js 20, Express, MongoDB 7, and Socket.IO**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: v20 LTS](https://img.shields.io/badge/Node.js-v20_LTS-green.svg)](https://nodejs.org/)
[![React: v18](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![TypeScript: v5](https://img.shields.io/badge/TypeScript-v5-3178C6.svg)](https://www.typescriptlang.org/)
[![MongoDB: v7](https://img.shields.io/badge/MongoDB-v7.0-47A248.svg)](https://www.mongodb.com/)
[![Tailwind CSS: v3](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Socket.IO: v4](https://img.shields.io/badge/Socket.IO-v4-010101.svg)](https://socket.io/)

---

## 🌟 Product Vision & Capabilities

**Smart OPD** digitalizes the outpatient lifecycle for healthcare practices. Rather than a generic administrative tool, it is designed around actual clinical and front-desk workflows:

- **Configurable Identity**: Multi-tenant database design with tenant boundary (`clinicId`). Clinic name, logo, contact, departments, operating hours, consultation fees, and appointment rules are fully configurable.
- **Appointment ≠ OPD Token**: An appointment reserves a scheduled doctor time slot. Physical arrival and receptionist check-in creates an active clinical `Visit` and issues a live, sequential OPD Token.
- **Real-Time Live Queue**: Waiting room screen and clinician workspace synchronize over WebSocket (Socket.IO). Doctors call the next patient with one click; priority emergency cases can be expedited with clinician approval.
- **Paperless Clinical Workspace**: Doctors access a clinical console with an interactive medical history timeline, diagnosis recording (with optional ICD-10 codes), drug dosage formulary, and one-click PDF prescription generation.
- **Complete Billing & E-Receipts**: Cashier billing console generates itemized receipts (consultations, diagnostic procedures, treatments) with multiple settlement options (Cash, UPI QR, Card) and automated PDF invoices.
- **Security & Privacy First**: Engineered in accordance with the Indian **Digital Personal Data Protection (DPDP) Act 2023**, with bcrypt password hashing (cost factor 12), short-lived access JWTs + rotated refresh tokens in `httpOnly` secure cookies, granular role-based access control (RBAC), and immutable audit logs.

---

## 👥 Four Distinct Role-Based Portals

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SMART OPD ROLE ECOSYSTEM                        │
├───────────────────┬───────────────────┬────────────────┬───────────────┤
│ 👑 Clinic Admin   │ 🩺 Doctor         │ 📋 Receptionist│ 🧑 Patient    │
├───────────────────┼───────────────────┼────────────────┼───────────────┤
│ - Clinic Profile  │ - Live OPD Queue  │ - Patient Reg  │ - Self Signup │
│ - Manage Doctors  │ - Patient EMR     │ - Book Appts   │ - Book Online │
│ - Staff Rosters   │ - Rx Generator    │ - Check-In     │ - Live Token  │
│ - Revenue Reports │ - Follow-up Engine│ - Token Dispatch│ - Rx Download │
│ - Audit Inspector │ - Report Review   │ - POS Billing  │ - Lab Reports │
└───────────────────┴───────────────────┴────────────────┴───────────────┘
```

---

## 📚 Master Documentation Suite (Stage A Complete)

Smart OPD is built following an enterprise-grade architectural specification. All 15 master documentation deliverables are available in the [`docs/`](./docs) directory:

| Document | Title | Description |
|---|---|---|
| [`01-SRS-Requirements.md`](./docs/01-SRS-Requirements.md) | **Software Requirements Specification (SRS)** | IEEE 830, 22 modules, 4 roles, smart auto-allocation, 50+ user stories, business rules. |
| [`02-UI-UX-Design.md`](./docs/02-UI-UX-Design.md) | **UI/UX Design Specification & Wireframes** | Screen-by-screen layouts, shadcn/ui components, 4 role dashboards, and 4K waiting TV display. |
| [`03-MongoDB-Database-Architecture.md`](./docs/03-MongoDB-Database-Architecture.md) | **MongoDB Database Architecture** | 16 Mongoose schemas, compound indexes, Mongoose validators, sample documents, and ERD. |
| [`04-REST-API-Documentation.md`](./docs/04-REST-API-Documentation.md) | **REST & WebSocket API Spec** | 70+ endpoints across 15 controllers, Zod validation schemas, and real-time Socket.IO events. |
| [`05-Workflow-Activity-Diagrams.md`](./docs/05-Workflow-Activity-Diagrams.md) | **Clinical & Administrative Workflows** | 22 Mermaid clinical sequence and activity diagrams including auto-allocation and emergency flow. |
| [`06-Development-Deployment-Roadmap.md`](./docs/06-Development-Deployment-Roadmap.md) | **Development & Deployment Roadmap** | 8 implementation phases, WBS, CI/CD pipelines (Render, Vercel, Atlas), and Gantt timeline. |
| [`07-Security-Threat-Model.md`](./docs/07-Security-Threat-Model.md) | **Security Architecture & Threat Model** | STRIDE threat model, OWASP Top 10, JWT rotation, RBAC matrix, and tamper-proof audit trails. |
| [`08-Healthcare-Compliance-Consent.md`](./docs/08-Healthcare-Compliance-Consent.md) | **Healthcare Compliance & Consent Design** | DPDP Act 2023 compliance, explicit consent notices (EN/HI), NMC ethics, and data retention. |
| [`09-Testing-Strategy-Test-Cases.md`](./docs/09-Testing-Strategy-Test-Cases.md) | **Testing Strategy & Test Cases** | Unit tests (Jest), API integration (Supertest), E2E (Playwright), k6 load, and 50+ test cases. |
| [`10-Reliability-Backup-Infrastructure.md`](./docs/10-Reliability-Backup-Infrastructure.md) | **Reliability, Backup & Infrastructure** | 99.5% SLO, 3-tier backups (Atlas PITR + cold dumps), RTO/RPO targets, and health checks. |
| [`11-Market-Research-Competitor-Analysis.md`](./docs/11-Market-Research-Competitor-Analysis.md) | **Indian Healthcare Market Research** | Practo, MediXcel, Clinicea benchmarks, verified Indian outpatient data, and UVP. |
| [`12-Business-Model-Onboarding.md`](./docs/12-Business-Model-Onboarding.md) | **Business Model & Clinic Onboarding** | 5-phase onboarding rollout, TCO breakdown, ROI analysis, and legacy data migration. |
| [`13-Notification-Integration-Strategy.md`](./docs/13-Notification-Integration-Strategy.md) | **Notification & Integration Strategy** | TRAI DLT transactional SMS templates, SendGrid HTML email, and Socket.IO in-app alerts. |
| [`14-Accessibility-Multilingual-Strategy.md`](./docs/14-Accessibility-Multilingual-Strategy.md) | **Accessibility & Multilingual Strategy** | WCAG 2.1 Level AA compliance, Hindi/English localization (`i18next`), and audio chime prompt. |
| [`15-AI-Governance-Validation.md`](./docs/15-AI-Governance-Validation.md) | **AI Governance & Validation Framework** | Non-autonomous clinician co-pilot, mandatory HITL approval, PII de-identification, and safety. |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose / Notes |
|---|---|---|
| **Frontend Runtime** | React 18 + Vite | Lightning-fast HMR and optimized SPA builds |
| **Language** | TypeScript 5 | Strict end-to-end type safety |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Clean, hospital ERP aesthetic in deep navy & slate |
| **Icons** | Lucide React | Unified healthcare and interface iconography |
| **Server State** | TanStack Query v5 | Automatic caching, background refetching, and pagination |
| **Forms & Validation** | React Hook Form + Zod | High-performance schema-validated forms |
| **Charts & Analytics** | Recharts | Revenue trends, appointment statistics, patient demographics |
| **Backend Runtime** | Node.js 20 LTS + Express.js | High-throughput asynchronous REST API |
| **Database** | MongoDB 7 + Mongoose 8 | Document store with ACID transactions & compound indexes |
| **Real-Time Sockets** | Socket.IO 4 | Low-latency live OPD token broadcast and queue updates |
| **PDF Authoring** | PDFKit | Microsecond vector rendering for prescriptions and invoices |
| **Media Storage** | Cloudinary | Secure storage for patient diagnostic reports and clinic logos |
| **Email & SMS** | SendGrid / Nodemailer + MSG91 | Transactional healthcare notifications |

---

## 📂 Monorepo Architecture

```
Patient_Management_OPD_System/
├── docs/                        # Complete 15 Stage A Architectural Deliverables
│   ├── 00_DOCUMENTATION_INDEX.md
│   ├── 01_PRD.md
│   ├── 02_DATABASE_ARCHITECTURE.md
│   ├── 03_API_DOCUMENTATION.md
│   ├── 04_UI_UX_SPECIFICATION.md
│   ├── 05_SECURITY_AND_COMPLIANCE.md
│   ├── 06_SYSTEM_ARCHITECTURE.md
│   ├── 07_WORKFLOWS.md
│   ├── 08_TESTING_STRATEGY.md
│   ├── 09_DEPLOYMENT_AND_DEVOPS.md
│   ├── 10_IMPLEMENTATION_ROADMAP.md
│   ├── 11_PROJECT_TRACKER.md
│   ├── 12_DATA_DICTIONARY.md
│   ├── 13_NOTIFICATION_SYSTEM.md
│   ├── 14_PDF_GENERATION.md
│   └── 15_OPEN_QUESTIONS.md
├── client/                      # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI & shadcn/ui components
│   │   ├── context/             # AuthContext, ClinicContext, SocketContext
│   │   ├── hooks/               # useLiveQueue, useAppointments, useAuth
│   │   ├── layouts/             # DashboardLayout, PatientPortalLayout
│   │   ├── pages/               # Admin, Doctor, Receptionist, Patient views
│   │   ├── services/            # Axios API client & endpoints
│   │   └── types/               # TypeScript interfaces & DTOs
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Node.js 20 + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/              # Database, Cloudinary, Email, Environment
│   │   ├── controllers/         # 15 domain controllers
│   │   ├── middleware/          # Auth, RBAC, Validation (Zod), Audit logger
│   │   ├── models/              # 16 Mongoose Schemas
│   │   ├── routes/              # Express API route modules
│   │   ├── services/            # Slot generation, PDFKit, Queue, Notifications
│   │   ├── sockets/             # Socket.IO room & event handlers
│   │   └── utils/               # AppError, AsyncHandler, Logger
│   ├── package.json
│   └── tsconfig.json
├── package.json                 # Monorepo root scripts
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v20.x or later installed
- **pnpm**: v9.x or later installed (`npm install -g pnpm`)
- **MongoDB**: Local MongoDB 7.0 instance or MongoDB Atlas connection string

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-org/smart-opd.git
cd smart-opd

# Install all dependencies across client and server
pnpm install
```

### 2. Environment Configuration
Create `.env` files in both `server/` and `client/` directories using the reference templates detailed in [`docs/09_DEPLOYMENT_AND_DEVOPS.md`](./docs/09_DEPLOYMENT_AND_DEVOPS.md).

```bash
# server/.env sample
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart_opd
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
CORS_ORIGIN=http://localhost:5173
```

### 3. Run Development Servers
```bash
# Start both backend and frontend concurrently
pnpm run dev

# Or start individually:
pnpm --filter server run dev   # Express API on http://localhost:5000
pnpm --filter client run dev   # Vite Frontend on http://localhost:5173
```

---

## 🔒 Security & Data Privacy

Smart OPD treats healthcare data with extreme confidentiality:
1. **Password Hashing**: Strong `bcrypt` salt rounds (12).
2. **Session Security**: Stateless short-lived JWT access tokens (15m) coupled with rotating refresh tokens stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
3. **Data Protection**: Prepared for the Indian **Digital Personal Data Protection (DPDP) Act 2023**, with patient consent capture, right to summary download, and audit trails.
4. **Tenant Boundary**: Every database query is bounded by `clinicId` to prevent cross-tenant data leakage.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

