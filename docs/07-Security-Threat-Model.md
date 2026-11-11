# Smart OPD – Security Architecture & Threat Model (STRIDE)
## Single-Clinic Outpatient Department Management System

> **Document ID:** 07-Security-Threat-Model.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Methodology:** Microsoft STRIDE Threat Modeling + OWASP Top 10 (2021) + Defense-in-Depth  

---

## 1. Protected Healthcare Assets & Trust Boundaries

In Smart OPD, security controls are architected around safeguarding critical clinical and financial assets:

```
+-----------------------------------------------------------------------------------------------+
| ASSET CLASSIFICATION MATRIX                                                                   |
+-------------------+---------------------------------------------+-----------------------------+
| Asset Category    | Specific Data Elements                      | Impact Level if Compromised |
+-------------------+---------------------------------------------+-----------------------------+
| Clinical Records  | Diagnoses, Clinical Findings, Prescriptions | CRITICAL (Medical Privacy)  |
| Diagnostic Media  | Lab Reports, Radiology PDFs, Blood Tests    | HIGH (Confidentiality)      |
| Patient Identity  | Full Name, Phone Number, UHID, Address      | HIGH (Identity & DPDP Act)  |
| Financial Data    | Invoices, Cash Collections, Tax Records     | HIGH (Financial Integrity)  |
| System Security   | Password Hashes, JWT Secrets, Audit Logs    | CRITICAL (System Takeover)  |
+-------------------+---------------------------------------------+-----------------------------+
```

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRUST BOUNDARY ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────┤
│   [UNTRUSTED ZONE: Public Internet]                                    │
│   • Patient Smartphones / Browsers                                     │
│   • Potential External Attackers                                       │
│                                                                        │
│   ─────────────── Boundary 1: TLS 1.3 / Reverse Proxy ───────────────  │
│                                                                        │
│   [DMZ / APPLICATION ZONE: Render & Vercel]                            │
│   • Helmet.js Security Headers & Rate Limiters                         │
│   • JWT Auth & RBAC Authorization Middleware                           │
│   • Zod Schema Input Sanitization                                      │
│                                                                        │
│   ─────────────── Boundary 2: Authenticated VPC / Peering ─────────────│
│                                                                        │
│   [SECURE DATA ZONE: MongoDB Atlas & Cloudinary]                       │
│   • Mongoose Parameterized Queries (NoSQL Injection Immune)            │
│   • AES-256 Storage Encryption at Rest                                 │
│   • Append-Only Immutable Audit Log Store                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Role-Based Access Control (RBAC) Permission Matrix

The table below defines the strict CRUD permissions enforced at the API route level:

| Resource Entity | Clinic Admin / Owner | Attending Doctor | Front-Desk Receptionist | Patient |
|---|---|---|---|---|
| **Users / Staff** | Full (CRUD) | None | None | Profile self-update |
| **Clinic Settings** | Full (CRUD) | Read Only | Read Only | Read Only (Public) |
| **Doctors** | Full (CRUD) | Read / Profile update | Read Only | Read Only |
| **Schedules / Leaves** | Full (CRUD) | Own Schedule (CRUD) | Read Only | Read Free Slots |
| **Patients** | Full (CRUD) | Read / Medical update | Create & Read & Edit | Own Profile (RU) |
| **Appointments** | Full (CRUD) | Own Patients (R) | Full (CRUD) | Own Appts (CR) |
| **Queue / Tokens** | Full (CRUD) | Room Queue (RU) | Full (CRUD) | Own Token (R) |
| **Visits** | Read Only | Create & Update | Create (Check-in) | Read Own |
| **Prescriptions** | Read Only | Create & Sign (C) | None (Medical Privacy)* | Read & Download Own |
| **Medical Reports** | Full (CRUD) | Create & Read | Create (Upload only) | Read Own |
| **Invoices / Bills** | Full (CRUD) | Read Only | Create & Settle (CRU)** | Read Own |
| **Payments** | Full (CRUD) | None | Record Payment (C) | View Own |
| **Audit Logs** | Read Only (No D/U)| None | None | None |
| **Analytics** | Full (Read) | Own Statistics | Daily Cash Report | None |

> *\* **Medical Privacy Constraint**: Under the DPDP Act 2023 and medical confidentiality rules, front-desk receptionists are strictly prohibited from viewing doctor consultation notes, provisional diagnoses, psychiatric notes, or prescribed medications. Receptionists only receive itemized procedure/consultation billing line items.*  
> *\*\* **Discount Authorization Guard**: Receptionists may generate standard invoices, but applying custom discounts or fee waivers requires Admin authorization or Admin PIN verification.*

---

## 3. STRIDE Threat Analysis & Defense Engineering

### 3.1 Spoofing (Identity Spoofing)
- **Threat Scenario**: Attacker impersonates a doctor or receptionist to access unauthorized patient records or issue illicit prescriptions.
- **Defensive Controls**:
  1. *Password Hashing*: Passwords hashed with `bcrypt` using 12 salt rounds (resistant to GPU rainbow tables).
  2. *Dual-Token Architecture*: Short-lived access JWT (15-minute lifespan) paired with an encrypted refresh token (7-day lifespan) stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie inaccessible to JavaScript.
  3. *Token Rotation*: Every token refresh invalidates the prior refresh token and issues a new pair. Detection of reuse immediately terminates all active sessions for that user.
  4. *Brute Force Lockout*: IP and phone-based rate limiting (5 failed attempts within 15 minutes locks the account for 30 minutes).

### 3.2 Tampering (Data Modification)
- **Threat Scenario**: Malicious user modifies consultation diagnoses, alters prescribed medication dosages, or tampers with cash collection figures.
- **Defensive Controls**:
  1. *Write-Once Clinical Records*: `prescriptions` documents are immutable once finalized. Updates require creating an append-only revision record referencing the prior document.
  2. *Schema Enforcement with Zod*: Strict backend schema validation rejects unexpected or malicious JSON payloads before reaching controllers.
  3. *Cryptographic Prescription Verification*: Every generated prescription PDF contains a signed SHA-256 HMAC verification QR code. Tampering with the physical printout or PDF invalidates verification.

### 3.3 Repudiation (Denial of Action)
- **Threat Scenario**: A doctor denies prescribing a contraindicated drug, or a receptionist denies collecting a ₹ 1,000 cash fee.
- **Defensive Controls**:
  1. *Tamper-Evident Audit Logging*: Every write, update, status change, and financial settlement is logged to the `auditLogs` collection with `actorUserId`, `actorRole`, `action`, `timestamp`, `ipAddress`, and `userAgent`.
  2. *No Delete Endpoints*: The audit collection exposes zero `DELETE` or `PUT` endpoints in the REST API.

### 3.4 Information Disclosure (Data Leakage & Insecure Direct Object References - IDOR)
- **Threat Scenario**: An authenticated patient queries `/api/v1/patients/:id/medical-history` with another patient's ID to view their confidential clinical notes.
- **Defensive Controls**:
  1. *Object-Level Authorization (IDOR Prevention)*: The authorization middleware enforces ownership rules:
     ```typescript
     export const verifyPatientOwnership = (req: Request, res: Response, next: NextFunction) => {
       if (req.user.role === 'PATIENT') {
         if (req.params.patientId && req.params.patientId !== req.user.patientProfileId?.toString()) {
           return next(new AppError('Forbidden: You can only access your own medical records', 403));
         }
       }
       next();
     };
     ```
  2. *Cloudinary Signed URLs*: Diagnostic reports are stored in private Cloudinary folders. Clients receive only time-limited pre-signed URLs (TTL = 15 minutes).
  3. *Zero PII in Server Logs*: Application loggers (Morgan / Winston) automatically redact password fields, credit card numbers, and patient phone numbers.
  4. *Waiting Room TV Anonymization*: Under Section 6 of the DPDP Act 2023, public displays in waiting lounges must not broadcast full patient identities, diagnoses, or phone numbers. TV display WebSocket payloads transmit strictly `maskedPatientName` (e.g., `RAHUL M.`), `tokenNumber`, and `roomNumber`. Clinical complaints and full contact details are stripped from all public broadcasts.

### 3.5 Denial of Service (DoS)
- **Threat Scenario**: Malicious actor floods the appointment slot generation endpoint or spams SMS verification OTPs to exhaust the clinic's budget.
- **Defensive Controls**:
  1. *Tiered Rate Limiting (`express-rate-limit`)*:
     - Global API: 100 requests per 15 minutes per IP.
     - Auth Routes (`/auth/login`, `/auth/register`): 10 requests per 15 minutes per IP.
     - Slot Generation (`/doctors/:id/available-slots`): 30 requests per minute per IP.
  2. *Payload Size Caps*: Express body parser strictly capped at `100kb` for JSON; file uploads capped at `10MB` via Multer.

### 3.6 Elevation of Privilege
- **Threat Scenario**: A receptionist modifies their own role in the JWT payload or calls `/api/v1/analytics/revenue` to inspect clinic profit margins.
- **Defensive Controls**:
  1. *Cryptographic Signature Verification*: JWTs signed with a high-entropy 256-bit secret (`HS256`). Client tampering invalidates the signature.
  2. *Strict RBAC Middleware*:
     ```typescript
     export const restrictTo = (...allowedRoles: string[]) => {
       return (req: Request, res: Response, next: NextFunction) => {
         if (!allowedRoles.includes(req.user.role)) {
           return next(new AppError('Forbidden: Insufficient privileges', 403));
         }
         next();
       };
     };
     ```

---

## 4. Backup Access Controls & Infrastructure Hardening

1. **Database Access Boundary**:
   - MongoDB Atlas network access restricted via IP Whitelisting (Render egress IP and Admin bastion only; zero 0.0.0.0/0 open access).
   - Database user roles follow principle of least privilege (`readWrite` role assigned to application service; `dbAdmin` restricted to system architect).
2. **Off-Site Cold Backup Access**:
   - Off-site backups stored in AWS S3 Glacier encrypted via AWS KMS customer-managed keys.
   - S3 bucket policy strictly denies public read and requires multi-factor authentication (MFA) delete.
   - Access to backup download requires IAM role `RoleBackupRestoreOperator` with mandatory approval logging.
3. **HTTP Security Headers (Helmet.js Configuration)**:
   ```typescript
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", "data:", "res.cloudinary.com"],
         connectSrc: ["'self'", "wss://{{CLINIC_DOMAIN}}"]
       }
     },
     crossOriginEmbedderPolicy: false,
     hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
   }));
   ```
