# Smart OPD – Master Documentation Index & Architecture Guide

> **Project Name:** Smart OPD – Clinic Management Platform  
> **Classification:** Commercial Healthcare Management SaaS  
> **Architecture Level:** Enterprise Grade / Production Ready  
> **Status:** Stage A Documentation Complete (15 of 15 Deliverables)  
> **Last Updated:** 2026-11-11  

---

## 1. Project Overview

**Smart OPD** is an outpatient department (OPD) clinic management software suite architected for private clinics, polyclinics, and outpatient healthcare centers. Built on the modern MERN stack (MongoDB, Express.js, React, Node.js) with TypeScript, Tailwind CSS, shadcn/ui, and Socket.IO, Smart OPD unifies the clinical and administrative outpatient lifecycle into a cohesive platform.

Before undertaking application implementation, the system underwent an architectural design phase. This index catalogs the 15 documentation deliverables that govern the implementation, testing, deployment, and operation of the platform.

---

## 2. Master Documentation Map

The table below catalogs all documentation deliverables in the `docs/` repository:

| Doc ID | Filename | Document Title | Primary Scope & Contents | Status | Target Audience |
|---|---|---|---|---|---|
| **00** | [`00_DOCUMENTATION_INDEX.md`](./00_DOCUMENTATION_INDEX.md) | **Master Documentation Index** | Navigation roadmap, reading paths, and documentation directory. | **APPROVED** | All Stakeholders |
| **01** | [`01_PRD.md`](./01_PRD.md) | **Product Requirements Document (PRD)** | 22 functional modules, 4 user roles, 50+ user stories, business rules, and personas. | **APPROVED** | Product, Dev, Clinic Owner |
| **02** | [`02_DATABASE_ARCHITECTURE.md`](./02_DATABASE_ARCHITECTURE.md) | **Database Architecture & Data Models** | 16 MongoDB/Mongoose schemas, ERD diagram, compound indexes, and transactions. | **APPROVED** | Backend, DB Architects |
| **03** | [`03_API_DOCUMENTATION.md`](./03_API_DOCUMENTATION.md) | **REST & WebSocket API Specification** | 70+ endpoints across 15 controllers, request/response contracts, and Socket.IO events. | **APPROVED** | Backend, Frontend, QA |
| **04** | [`04_UI_UX_SPECIFICATION.md`](./04_UI_UX_SPECIFICATION.md) | **UI/UX Design System & Dashboards** | Navy/slate healthcare theme, 4 role dashboards, shadcn/ui components, and wireframes. | **APPROVED** | Frontend, UI/UX Designers |
| **05** | [`05_SECURITY_AND_COMPLIANCE.md`](./05_SECURITY_AND_COMPLIANCE.md) | **Security, Privacy & DPDP Compliance** | JWT rotation, RBAC matrix, DPDP 2023 compliance, audit logging, and OWASP defenses. | **APPROVED** | Security, Compliance, DevOps |
| **06** | [`06_SYSTEM_ARCHITECTURE.md`](./06_SYSTEM_ARCHITECTURE.md) | **System Architecture & Technical Design** | Layered backend, TanStack Query frontend, Socket.IO rooms, and sequence flows. | **APPROVED** | Solution Architects, Leads |
| **07** | [`07_WORKFLOWS.md`](./07_WORKFLOWS.md) | **Clinical & Operational Workflows** | 22 end-to-end clinical workflows with step-by-step logic and sequence diagrams. | **APPROVED** | Business Analysts, Doctors |
| **08** | [`08_TESTING_STRATEGY.md`](./08_TESTING_STRATEGY.md) | **Testing Strategy & Quality Assurance** | Jest unit tests, Supertest API suites, Playwright E2E journeys, and load benchmarks. | **APPROVED** | QA Engineers, SDETs |
| **09** | [`09_DEPLOYMENT_AND_DEVOPS.md`](./09_DEPLOYMENT_AND_DEVOPS.md) | **Deployment, DevOps & CI/CD** | GitHub Actions CI/CD, Vercel frontend, Render backend, Atlas backups, and monitoring. | **APPROVED** | DevOps, SREs |
| **10** | [`10_IMPLEMENTATION_ROADMAP.md`](./10_IMPLEMENTATION_ROADMAP.md) | **Implementation Roadmap (8 Phases)** | Week-by-week delivery plan, phase gates, acceptance criteria, and Gantt chart. | **APPROVED** | Project Managers, Tech Lead |
| **11** | [`11_PROJECT_TRACKER.md`](./11_PROJECT_TRACKER.md) | **Project Tracker & Living Status Board** | Granular WBS tasks, defect tracking log, phase sign-off criteria, and completion metrics. | **ACTIVE** | PM, Team Leads |
| **12** | [`12_DATA_DICTIONARY.md`](./12_DATA_DICTIONARY.md) | **Comprehensive Data Dictionary** | Field-level specifications, data types, validation regex, and enum references. | **APPROVED** | Backend, Data Engineers |
| **13** | [`13_NOTIFICATION_SYSTEM.md`](./13_NOTIFICATION_SYSTEM.md) | **Notification System Specification** | Email (SendGrid), SMS (MSG91/Twilio), In-App alerts, templates, and DLT formatting. | **APPROVED** | Backend, Integrations |
| **14** | [`14_PDF_GENERATION.md`](./14_PDF_GENERATION.md) | **PDF Generation Engine Specification** | PDFKit coordinate layouts for prescriptions, itemized invoices, and EMR summaries. | **APPROVED** | Backend, Report Engineers |
| **15** | [`15_OPEN_QUESTIONS.md`](./15_OPEN_QUESTIONS.md) | **Clinic Configuration & Decision Log** | 30 business questions pending clinic owner input with default operational assumptions. | **PENDING INPUT** | Clinic Owner, Medical Lead |

---

## 3. Targeted Reading Pathways

To review the documentation based on stakeholder role:

### 3.1 Pathway A: Full-Stack Developer
1. **Understand Goals & Roles**: Read [`01_PRD.md`](./01_PRD.md).
2. **Review Tech Architecture**: Read [`06_SYSTEM_ARCHITECTURE.md`](./06_SYSTEM_ARCHITECTURE.md).
3. **Database Schema & Enums**: Read [`02_DATABASE_ARCHITECTURE.md`](./02_DATABASE_ARCHITECTURE.md) and [`12_DATA_DICTIONARY.md`](./12_DATA_DICTIONARY.md).
4. **API Contracts**: Read [`03_API_DOCUMENTATION.md`](./03_API_DOCUMENTATION.md).
5. **Frontend UI Components**: Read [`04_UI_UX_SPECIFICATION.md`](./04_UI_UX_SPECIFICATION.md).
6. **Execution Plan**: Follow [`10_IMPLEMENTATION_ROADMAP.md`](./10_IMPLEMENTATION_ROADMAP.md) and [`11_PROJECT_TRACKER.md`](./11_PROJECT_TRACKER.md).

### 3.2 Pathway B: Clinic Owner & Medical Director
1. **Scope & Personas**: Review [`01_PRD.md`](./01_PRD.md) (Sections 1–4).
2. **Real-world Workflows**: Review [`07_WORKFLOWS.md`](./07_WORKFLOWS.md) (Examine check-in, queue, and prescription flows).
3. **Prescription & Invoice Samples**: Review [`14_PDF_GENERATION.md`](./14_PDF_GENERATION.md).
4. **Action Required**: Answer the 30 operational decisions in [`15_OPEN_QUESTIONS.md`](./15_OPEN_QUESTIONS.md).

### 3.3 Pathway C: QA Engineer & Tester
1. **Acceptance Criteria**: Review [`01_PRD.md`](./01_PRD.md) (User Stories).
2. **Clinical Workflows**: Read [`07_WORKFLOWS.md`](./07_WORKFLOWS.md) for alternate and error flows.
3. **Test Plans & Test Code**: Execute the strategy in [`08_TESTING_STRATEGY.md`](./08_TESTING_STRATEGY.md).
4. **API Validation**: Cross-reference request/response formats in [`03_API_DOCUMENTATION.md`](./03_API_DOCUMENTATION.md).

### 3.4 Pathway D: Security & DevOps Engineer
1. **Security Architecture & DPDP**: Audit [`05_SECURITY_AND_COMPLIANCE.md`](./05_SECURITY_AND_COMPLIANCE.md).
2. **CI/CD & Infrastructure**: Execute setup per [`09_DEPLOYMENT_AND_DEVOPS.md`](./09_DEPLOYMENT_AND_DEVOPS.md).
3. **Environmental Variables**: Reference the environment variable table in [`09_DEPLOYMENT_AND_DEVOPS.md`](./09_DEPLOYMENT_AND_DEVOPS.md).

---

## 4. Key Architectural Standards Summary

- **Multi-Tenant Ready**: Every database collection enforces a tenant boundary via `clinicId`.
- **Stateless Authentication**: Access tokens (15m JWT) paired with rotated Refresh Tokens (7d in httpOnly secure cookies).
- **Physical Check-in vs Appointment**: Booking an appointment reserves a time slot; OPD Token generation and queue entry occur strictly upon physical check-in at reception.
- **Clinical Data Immutability**: Medical consultations and prescriptions are write-once historical records; revisions are versioned and never destructively overwrite past clinical encounters.
- **Audit Traceability**: Every sensitive write, clinical access, and financial transaction creates a non-deletable log entry in `auditLogs`.

---

## 5. Version History & Changelog

| Version | Date | Author / Role | Changes Summary |
|---|---|---|---|
| **1.0.0** | 2026-11-11 | Senior Healthcare Software Architect | Initial full release of all 15 architecture specifications. |

