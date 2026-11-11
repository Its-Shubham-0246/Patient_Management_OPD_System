# 05 · Security & Compliance Specification

**Smart OPD – MERN-Stack OPD Clinic Management Platform**  
**Document version:** 1.0  
**Status:** Living document – update with every architectural change  
**Classification:** Internal – Engineering & Security Team  

> [!IMPORTANT]
> This document describes the intended security posture of Smart OPD. It is an engineering specification, not a legal compliance certificate. Healthcare compliance under the DPDP Act 2023 and any sector-specific regulations must be validated by qualified legal counsel before go-live.

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [Authorization (RBAC)](#3-authorization-rbac)
4. [Input Validation & Injection Prevention](#4-input-validation--injection-prevention)
5. [API Security](#5-api-security)
6. [Data Security](#6-data-security)
7. [Audit Logging](#7-audit-logging)
8. [Healthcare Privacy & Indian Compliance](#8-healthcare-privacy--indian-compliance)
9. [Infrastructure Security](#9-infrastructure-security)
10. [Security Testing](#10-security-testing)
11. [Incident Response](#11-incident-response)
12. [Pre-Launch Security Checklist](#12-pre-launch-security-checklist)

---

## 1. Threat Model

### 1.1 Assets to Protect

| Asset | Classification | Sensitivity | Location |
|---|---|---|---|
| Patient PII (name, DOB, address, phone, Aadhaar/ID) | Critical | Very High | MongoDB `patients` collection |
| Medical history & diagnoses | Critical | Very High | MongoDB `visits`, `prescriptions` |
| Prescription records | Critical | Very High | MongoDB `prescriptions` |
| Medical reports (uploaded files) | Critical | Very High | Cloudinary (private bucket) |
| Audit logs | High | High | MongoDB `auditLogs` |
| Authentication credentials (password hashes, tokens) | Critical | Very High | MongoDB `users` |
| Billing & payment records | High | High | MongoDB `invoices`, `payments` |
| Clinic configuration & doctor schedules | Medium | Medium | MongoDB `clinicSettings`, `doctorSchedules` |
| JWT signing secrets & API keys | Critical | Very High | Environment variables (Render/AWS) |
| Cloudinary API credentials | Critical | Very High | Environment variables |

### 1.2 Threat Actors

| Actor | Motivation | Capability | Access Vector |
|---|---|---|---|
| **Unauthenticated external attacker** | Data theft, ransomware, credential stuffing | Medium–High | Public API endpoints, brute-force |
| **Authenticated malicious user (patient)** | IDOR to access other patients' records | Low–Medium | Valid JWT, crafted API requests |
| **Malicious insider (staff/receptionist)** | Data exfiltration, privacy violation | High (direct DB access) | Application layer, potential direct DB |
| **Compromised clinic admin account** | Full clinic data breach | Very High | Full admin privileges |
| **Automated bot / script-kiddie** | Credential stuffing, scraping | Low–Medium | Public endpoints |
| **Supply chain attacker** | Backdoor via npm package | High | Build pipeline |
| **Platform provider (Vercel/Render)** | Regulated by provider ToS; infra-level access | Very High | Infrastructure |

### 1.3 STRIDE Analysis

| Threat | Category | Affected Component | Description | Mitigation |
|---|---|---|---|---|
| **S**poofing – Token forgery | Spoofing | JWT auth | Attacker forges/replays a JWT | Strong secret (256-bit), short expiry, RS256 or HS256 with rotation |
| **S**poofing – Credential theft | Spoofing | Login endpoint | Phishing or credential stuffing | bcrypt cost 12, rate limiting, lockout, MFA (future) |
| **T**ampering – Prescription edit | Tampering | `prescriptions` API | Attacker modifies prescription after signing | RBAC (only doctor can write), audit log on all writes |
| **T**ampering – Audit log delete | Tampering | `auditLogs` collection | Insider deletes incriminating audit entries | Append-only logs, no DELETE endpoint, DB-level role restrictions |
| **T**ampering – Request body injection | Tampering | All API routes | Attacker injects `$where`, `$gt` operators | Mongoose strict mode, Zod schema validation |
| **R**epudiation – Denied action | Repudiation | Write operations | Staff denies having modified a record | Immutable audit logs with userId, IP, timestamp, before/after diff |
| **I**nformation Disclosure – IDOR | Info Disclosure | Patient records API | Patient A accesses Patient B's records via crafted ID | clinicId + ownership checks on every query |
| **I**nformation Disclosure – Log leakage | Info Disclosure | Application logs | PII appears in server logs | Sanitized logging middleware, never log req.body for sensitive routes |
| **I**nformation Disclosure – Report URL | Info Disclosure | Cloudinary URLs | Permanent public URL to medical report shared/leaked | Signed, time-limited Cloudinary URLs only |
| **D**oS – Rate exhaustion | DoS | Express API | Flooding login/API endpoints | express-rate-limit, Helmet, Cloudflare/WAF at edge |
| **D**oS – Large payload | DoS | File upload endpoint | Multi-GB upload crashes Node process | express body-parser size limit, Cloudinary upload size cap |
| **E**oP – Role escalation | Elevation of Privilege | User management API | Receptionist elevates own role to Admin | Role field immutable after creation except by Admin, RBAC middleware on every route |
| **E**oP – Cross-clinic access | Elevation of Privilege | All data APIs | Doctor in Clinic A accesses Clinic B data | Mandatory `clinicId` filter on every Mongoose query |

### 1.4 Risk Matrix

**Likelihood:** 1 = Rare, 2 = Unlikely, 3 = Possible, 4 = Likely, 5 = Almost Certain  
**Impact:** 1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Catastrophic  
**Risk Score = Likelihood × Impact**

| Threat | Likelihood | Impact | Score | Priority |
|---|---|---|---|---|
| Credential stuffing / brute-force login | 4 | 4 | 16 | 🔴 Critical |
| IDOR – patient accessing other records | 3 | 5 | 15 | 🔴 Critical |
| Cross-clinic data leakage (missing clinicId filter) | 2 | 5 | 10 | 🟠 High |
| NoSQL injection via crafted request | 2 | 5 | 10 | 🟠 High |
| JWT secret compromise | 1 | 5 | 5 | 🟡 Medium |
| Audit log tampering by insider | 2 | 4 | 8 | 🟠 High |
| Medical report URL leakage | 3 | 4 | 12 | 🟠 High |
| Malicious file upload | 2 | 4 | 8 | 🟠 High |
| Denial-of-service on API | 3 | 3 | 9 | 🟠 High |
| Sensitive PII in application logs | 4 | 3 | 12 | 🟠 High |
| XSS via stored patient notes | 2 | 3 | 6 | 🟡 Medium |
| Supply chain compromise (npm) | 1 | 5 | 5 | 🟡 Medium |
| Environment variable exposure | 1 | 5 | 5 | 🟡 Medium |

---

## 2. Authentication & Session Management

### 2.1 Password Hashing

All passwords are hashed with **bcrypt** at a minimum cost factor of **12** before storage. Plain-text passwords must never be stored, logged, or transmitted beyond the initial login/register request.

```js
// backend/src/utils/password.js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12; // minimum; increase as hardware permits

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash); // timing-safe comparison built in
}
```

> [!NOTE]
> bcrypt.compare is inherently timing-safe. Never use string equality (`===`) to compare password hashes.

### 2.2 JWT Implementation

Smart OPD uses a **dual-token strategy**:

| Token | Expiry | Storage | Transmission |
|---|---|---|---|
| **Access Token** | 15 minutes | In-memory (React state / zustand) | `Authorization: Bearer <token>` header |
| **Refresh Token** | 7 days | httpOnly, Secure, SameSite=Strict cookie | Automatic via cookie on `/auth/refresh` |

**Access token claims:**
```json
{
  "sub": "<userId>",
  "clinicId": "<clinicId>",
  "role": "doctor",
  "sessionId": "<uuid-v4>",
  "iat": 1700000000,
  "exp": 1700000900
}
```

**Refresh token rotation:** Every call to `POST /auth/refresh`:
1. Validates the refresh token cookie.
2. Checks the `sessionId` exists in the `sessions` collection and is not invalidated.
3. Issues a **new** access token and a **new** refresh token.
4. Marks the old refresh token as consumed (one-time use).
5. Detects reuse: if an already-consumed token is presented, the entire session family is invalidated (refresh token theft detection).

**Signing algorithm:** HS256 with a 256-bit random secret stored in environment variables. Consider upgrading to RS256 (asymmetric) if a third-party service needs to verify tokens without sharing the secret.

### 2.3 Brute-Force Protection

**Layer 1 – IP-based rate limiting** (applied to `/auth/login`, `/auth/refresh`, `/auth/forgot-password`):
```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});
```

**Layer 2 – Per-account lockout:**
- After **5 consecutive failed logins**, the account is locked for **30 minutes**.
- The `users` collection tracks `loginAttempts` (integer) and `lockUntil` (Date).
- On successful login, both fields are reset to 0 / null.
- Lockout message must NOT reveal whether the account exists (generic "Invalid credentials or account locked" response).

### 2.4 Logout & Token Invalidation

- **Frontend logout:** Clears in-memory access token; calls `POST /auth/logout`.
- **Backend `/auth/logout`:** Marks the `sessionId` as revoked in the `sessions` collection; clears the httpOnly cookie via `Set-Cookie: refreshToken=; Max-Age=0`.
- Access tokens issued before logout remain valid until their 15-minute expiry. This window is acceptable; if stricter invalidation is required, maintain a Redis deny-list of `sessionId` values.
- **Admin force-logout:** Admin can invalidate all sessions for a user by deleting all `sessions` documents for that userId.

### 2.5 Password Policy

| Requirement | Rule |
|---|---|
| Minimum length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| Maximum length | 128 characters (bcrypt input limit protection) |
| Common password check | Reject passwords in HIBP top-10k list (checked client-side + server-side) |
| History | Last 5 passwords must not be reused (hash stored in `passwordHistory[]`) |
| Expiry | 90-day expiry for Admin and Doctor accounts; reminder at 75 days |

Validation is enforced by a **shared Zod schema** imported by both the Express validation middleware and the React form.

### 2.6 Password Reset Flow

1. User submits email to `POST /auth/forgot-password`.
2. Server generates a **cryptographically random 32-byte token** (`crypto.randomBytes(32).toString('hex')`), stores its **SHA-256 hash** in the `users` document with an expiry of **1 hour**.
3. Server sends a reset link: `https://app.smartopd.in/reset-password?token=<raw-token>`.
4. Response is always `200 OK` with generic message (prevents user enumeration).
5. User submits new password + token to `POST /auth/reset-password`.
6. Server hashes the submitted token, compares to stored hash, checks expiry.
7. On success: updates password, clears reset token, invalidates all existing sessions.

### 2.7 Multi-Device Session Handling

Each login creates a row in the `sessions` collection:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  sessionId: String,       // UUID v4, embedded in JWT
  refreshTokenHash: String, // SHA-256 of the refresh token
  deviceInfo: {
    userAgent: String,
    ip: String,
  },
  createdAt: Date,
  expiresAt: Date,         // 7 days
  revokedAt: Date | null,
}
```

Users (and Admins on behalf of staff) can list and revoke individual sessions from the profile/admin panel. A "log out all devices" action deletes all non-revoked sessions for the user.

---

## 3. Authorization (RBAC)

### 3.1 Role Definitions

| Role | Code | Description |
|---|---|---|
| **Clinic Admin** | `admin` | Full access to all clinic resources; manages users and config |
| **Doctor** | `doctor` | Consultation workspace; own appointments; read all patients |
| **Receptionist** | `receptionist` | Patient registration, appointments, queue, billing |
| **Patient** | `patient` | Own records only; appointment booking; view prescriptions & reports |

### 3.2 Permission Matrix

`C` = Create, `R` = Read, `U` = Update, `D` = Delete, `—` = No access, `*` = Own records only

| Resource | Admin | Doctor | Receptionist | Patient |
|---|---|---|---|---|
| **Users** | CRUD | R (self) | R (self) | R (self) |
| **Clinic Settings** | CRUD | R | R | — |
| **Doctors** | CRUD | R | R | R |
| **Patients** | CRUD | CR, R | CRU | R* |
| **Appointments** | CRUD | CRU (own clinic) | CRUD | CR, R*, U* (cancel) |
| **Doctor Schedules** | CRUD | RU (own) | R | — |
| **Doctor Leaves** | CRUD | CRUD (own) | R | — |
| **Visits / OPD Tokens** | CRUD | R, U (notes) | CRU | R* |
| **Queue Entries** | CRUD | R | CRUD | — |
| **Prescriptions** | CRUD | CRU (own) | R | R* |
| **Medical Reports** | CRUD | CRU | R | R* |
| **Invoices** | CRUD | R | CRU | R* |
| **Payments** | CRUD | R | CRU | R* |
| **Follow-ups** | CRUD | CRUD | CRU | R* |
| **Notifications** | CRUD | R (own) | R (own) | R* |
| **Audit Logs** | R | — | — | — |
| **Analytics** | R | R (own stats) | — | — |

### 3.3 Middleware Implementation Pattern

```js
// backend/src/middleware/authorize.js
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (!allowedRoles.includes(req.user.role)) {
    // Log permission denial
    auditLog({
      userId: req.user._id,
      role: req.user.role,
      action: 'PERMISSION_DENIED',
      resource: req.originalUrl,
      ip: req.ip,
      outcome: 'denied',
    });
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Usage:
router.get('/audit-logs', authenticate, authorize('admin'), auditLogController.list);
router.post('/prescriptions', authenticate, authorize('admin', 'doctor'), prescriptionController.create);
```

### 3.4 Clinic-Level Tenant Isolation

Every Mongoose query that touches multi-tenant collections **must** include `clinicId` from the authenticated user's JWT claim. This is enforced at the service layer, not just the route layer:

```js
// backend/src/services/patientService.js
async function getPatient(id, requestingUser) {
  const patient = await Patient.findOne({
    _id: id,
    clinicId: requestingUser.clinicId,  // ← mandatory tenant filter
  });
  if (!patient) throw new NotFoundError('Patient not found');
  return patient;
}
```

A Mongoose plugin (`clinicIdPlugin`) is applied globally to enforce this at the schema level as an additional safety net by pre-populating `clinicId` on `save()` and enforcing it on `find()` via query middleware.

### 3.5 Patient Self-Service Scope Restrictions

When `req.user.role === 'patient'`, service functions apply an additional filter:

```js
// appointments only returned if patientId matches the authenticated user
const appointments = await Appointment.find({
  clinicId: req.user.clinicId,
  patientId: req.user.patientProfileId,  // ← own records only
});
```

Patients cannot:
- Access other patients' records by ID (returns 404, not 403, to prevent enumeration).
- Modify appointment status to anything other than `cancelled`.
- View doctor notes marked `internal: true`.
- Access audit logs.

---

## 4. Input Validation & Injection Prevention

### 4.1 Request Validation with Zod

Every API endpoint that accepts a request body, query string, or URL parameter uses a **Zod schema** for validation, enforced by a reusable middleware:

```js
// backend/src/middleware/validate.js
const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);  // strips unknown keys by default
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    next(err);
  }
};

// Example schema
const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  dob:       z.string().date(),
  phone:     z.string().regex(/^\+91[6-9]\d{9}$/),
  email:     z.string().email().optional(),
  // Zod strips all extra keys — no prototype pollution
});
```

Zod's `.strict()` or default key-stripping prevents prototype pollution and over-posting attacks.

### 4.2 MongoDB Injection Prevention

- **Mongoose strict mode** is enabled globally (`{ strict: true }`), rejecting undefined schema paths.
- **Never pass raw `req.body` or `req.query` directly into a Mongoose query.**  
  ❌ `Patient.find(req.body)` — directly exploitable  
  ✅ `Patient.find({ clinicId, _id: id })` — only validated, trusted values
- Parameterized queries via Mongoose's typed schema (e.g., `_id` is always cast to `ObjectId`) prevent operator injection.
- Disable HTTP parameter pollution with the `hpp` npm package.

```js
// backend/src/app.js
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // strips $ and . from req.body, req.query, req.params
```

### 4.3 XSS Prevention

**Server-side:**
- API responses are always `Content-Type: application/json` — the browser never renders them as HTML.
- Rich-text fields (doctor notes, prescription instructions) are stored raw and sanitized on output using **DOMPurify** on the React side.
- Helmet.js sets a strict `Content-Security-Policy` (see §5).

**Client-side (React):**
- JSX auto-escapes string interpolations. `dangerouslySetInnerHTML` is forbidden in this codebase except in the PDF-preview component, where DOMPurify sanitization is applied first.
- All user-generated content displayed in the UI passes through a `sanitize(html)` utility wrapping DOMPurify.

### 4.4 File Upload Validation

Applied to the medical report upload endpoint (`POST /reports/upload`):

| Check | Implementation |
|---|---|
| **MIME type (magic bytes)** | `file-type` npm package checks actual file content, not just the `Content-Type` header |
| **Allowed types** | `image/jpeg`, `image/png`, `application/pdf` only |
| **Maximum file size** | 10 MB per file; enforced by multer `limits.fileSize` and by Cloudinary upload preset |
| **Filename sanitization** | Original filename replaced with a UUID; special characters stripped |
| **Virus scanning** | Integrate **ClamAV** (self-hosted) or **Cloudmersive Virus Scan API** as an async post-upload hook; infected files are deleted and the upload rejected |
| **Rate limiting** | Separate `uploadLimiter`: 20 uploads per user per hour |

---

## 5. API Security

### 5.1 CORS Policy

```js
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','), // e.g. ['https://app.smartopd.in']
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,          // required for httpOnly cookie with refresh token
  maxAge: 86400,              // preflight cache: 24 hours
};
app.use(cors(corsOptions));
```

- Wildcard `*` is **never** used in production.
- In development, `localhost:5173` (Vite) is allowed explicitly.
- Staging uses a separate origin allowlist.

### 5.2 Rate Limiting

| Limiter | Window | Max Requests | Routes |
|---|---|---|---|
| `globalLimiter` | 15 min | 500 / IP | All routes |
| `loginLimiter` | 15 min | 10 / IP | `/auth/login`, `/auth/refresh` |
| `forgotPasswordLimiter` | 1 hour | 5 / IP | `/auth/forgot-password` |
| `uploadLimiter` | 1 hour | 20 / user | `/reports/upload` |
| `searchLimiter` | 1 min | 30 / IP | `/patients/search`, `/appointments/search` |

All limiters use `express-rate-limit` with a Redis store (`rate-limit-redis`) in production to handle multi-instance deployments on Render/AWS.

### 5.3 Helmet.js Security Headers

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],   // Tailwind requires inline; harden with nonces in v2
      imgSrc:         ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc:     ["'self'", "https://api.smartopd.in"],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
}));
```

### 5.4 Request Size Limits

```js
app.use(express.json({ limit: '100kb' }));       // JSON body
app.use(express.urlencoded({ limit: '100kb', extended: true }));
// File uploads handled by multer with its own size limit (10MB)
```

### 5.5 HTTPS Enforcement

- **Render / AWS:** TLS termination at the load balancer; plain HTTP requests are redirected to HTTPS at the infrastructure level. The `trust proxy` setting is enabled so Express sees the correct `X-Forwarded-Proto` header.
- **Vercel (frontend):** HTTPS is enforced by default; HSTS is added via Vercel's headers config.
- Minimum TLS version: **TLS 1.2**. TLS 1.0 and 1.1 are disabled at the platform level.
- Preferred cipher suites: AES-256-GCM, CHACHA20-POLY1305 (ECDHE key exchange).

### 5.6 API Key vs JWT Strategy

| Use Case | Mechanism |
|---|---|
| User-facing frontend → backend | JWT (access token in Authorization header) |
| Backend → Cloudinary | Cloudinary API key/secret in environment variables; requests signed server-side |
| Backend → email service (SendGrid/Resend) | API key in environment variables |
| Future: machine-to-machine (cron, analytics) | Static API key in `Authorization: ApiKey <key>` header; separate from user JWT flow |
| Webhooks from payment gateway | Shared HMAC secret; validate `X-Webhook-Signature` header |

---

## 6. Data Security

### 6.1 Encryption at Rest

| Data Store | Mechanism |
|---|---|
| **MongoDB Atlas** | Encryption at rest enabled by default (AES-256) on all Atlas tiers M10+. For self-hosted MongoDB on AWS EC2, use EBS encrypted volumes (AES-256). |
| **Cloudinary** | Files stored in Cloudinary's infrastructure are encrypted at rest per their enterprise-grade storage policy. |
| **Render / AWS** | Render persistent disks and AWS EBS volumes must have encryption enabled at provisioning time. Verify in platform console. |
| **Application secrets** | Stored in Render Environment Groups or AWS Secrets Manager / Parameter Store — never on disk. |

### 6.2 Encryption in Transit

- All client–server communication uses **HTTPS (TLS 1.2+)**.
- MongoDB Atlas connections use TLS by default; the connection string uses `mongodb+srv://` which enforces TLS.
- Cloudinary SDK communicates over HTTPS.
- Internal service-to-service calls (e.g., backend → email provider) use HTTPS.
- Certificate management: Vercel and Render manage TLS certificates automatically via Let's Encrypt.

### 6.3 PII Handling in Logs

- **Never log** `req.body` on routes that accept patient data, authentication credentials, or PII.
- Log only: HTTP method, URL path, status code, response time, userId (hashed or opaque reference).
- Use a custom Winston transport or Pino redaction to strip sensitive fields:

```js
const pino = require('pino');
const logger = pino({
  redact: {
    paths: ['req.body.password', 'req.body.phone', 'req.body.email',
            'req.body.aadhaar', 'req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
});
```

- Logs shipped to external services (Datadog, Logtail) must be reviewed to confirm no PII leaks.

### 6.4 Cloudinary Signed URLs for Medical Reports

Medical reports must never be served via permanent public Cloudinary URLs. All access is via **server-generated signed URLs**:

```js
const cloudinary = require('cloudinary').v2;

function getSignedReportUrl(publicId, expiresInSeconds = 300) {
  return cloudinary.url(publicId, {
    sign_url:    true,
    secure:      true,
    type:        'authenticated', // requires Cloudinary auth delivery type
    expires_at:  Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}
```

- Cloudinary delivery type must be set to **Authenticated** (not Public) for the medical-reports folder.
- URLs expire in **5 minutes** by default; download tokens can be extended to 1 hour for in-progress workflows.
- The signed URL endpoint (`GET /reports/:id/url`) is RBAC-protected.

### 6.5 Environment Variable Management

| Rule | Implementation |
|---|---|
| No secrets in source code | `.env` files are in `.gitignore`; `git-secrets` or `gitleaks` pre-commit hook scans for key patterns |
| No secrets in frontend bundle | Vite `VITE_*` env vars are public; only non-secret config (API base URL) goes here |
| Secret injection at runtime | Render Environment Groups or AWS Secrets Manager; environment variables injected into the Node process |
| Secret rotation | JWT signing secrets and DB passwords rotated quarterly or immediately on suspected compromise |
| `.env.example` | Committed to repo with placeholder values only; documents required keys without exposing values |

---

## 7. Audit Logging

### 7.1 Events to Log

| Category | Events |
|---|---|
| **Authentication** | Login success, login failure, logout, password reset request, password changed, account locked |
| **Data writes** | Create/Update/Delete on: patients, appointments, prescriptions, medical reports, invoices, payments, visits |
| **Access control** | Permission denied (403), unauthorized access attempt (401) |
| **Admin actions** | User created/deactivated, role changed, clinic settings updated, doctor schedule modified |
| **Data exports** | PDF prescription generated, PDF invoice generated, analytics report downloaded |
| **Session events** | Refresh token issued, session revoked |
| **System events** | Application startup, configuration changes |

### 7.2 Audit Log Schema

```js
// backend/src/models/AuditLog.js
const auditLogSchema = new Schema({
  userId:     { type: ObjectId, ref: 'User', required: true },
  clinicId:   { type: ObjectId, ref: 'ClinicSettings', required: true },
  role:       { type: String, enum: ['admin', 'doctor', 'receptionist', 'patient'], required: true },
  action:     { type: String, required: true },     // e.g. 'CREATE_PRESCRIPTION'
  resource:   { type: String, required: true },     // e.g. 'prescriptions'
  resourceId: { type: ObjectId },                   // the affected document ID
  ip:         { type: String, required: true },
  userAgent:  { type: String },
  timestamp:  { type: Date, default: Date.now, immutable: true },
  outcome:    { type: String, enum: ['success', 'denied', 'error'], required: true },
  metadata:   { type: Schema.Types.Mixed },         // e.g. { patientId, appointmentId }
  // No before/after diff stored here — diffs tracked in a separate changelog if required
}, {
  capped: false,         // do NOT use capped collections; use TTL + backup instead
  timestamps: false,     // manually manage timestamp for immutability guarantee
});

auditLogSchema.set('strict', true);
```

> [!CAUTION]
> Never expose an HTTP endpoint that allows deleting or updating audit log documents. The only allowed operations are INSERT and READ (admin-only read).

### 7.3 Log Integrity

- The `auditLogs` collection has **no** DELETE or UPDATE routes in the Express API.
- The MongoDB Atlas database user used by the application has `readWrite` permissions on all collections **except** `auditLogs`, where it has `insert` and `find` only. A separate Atlas user (admin-read) is used for audit reports.
- Atlas Data Lake or S3 export is used to archive audit logs monthly (see §9).
- Optionally: compute a rolling HMAC chain over sequential log entries to detect tampering even at the database level.

### 7.4 Log Retention Policy

| Log Type | Retention | Storage |
|---|---|---|
| **Audit logs (application)** | 5 years | MongoDB Atlas (hot: 1 year) + S3 Glacier (cold: 4 years) |
| **Application/server logs** | 90 days | Render log stream / CloudWatch |
| **Access logs (HTTP)** | 180 days | CDN/WAF logs |
| **Authentication failure logs** | 1 year | Dedicated security log group |

---

## 8. Healthcare Privacy & Indian Compliance

> [!WARNING]
> The following describes Smart OPD's intended alignment with the Digital Personal Data Protection (DPDP) Act, 2023. This is NOT a legal compliance certificate. Engage a qualified privacy lawyer before processing live patient data.

### 8.1 DPDP Act 2023 – Relevant Provisions

| Provision | DPDP Act Obligation | Smart OPD Implementation |
|---|---|---|
| **Lawful basis for processing** | Health data requires explicit consent or specific legal ground | Consent captured at patient registration; stored with timestamp |
| **Purpose limitation** | Data collected only for stated purposes | Only data necessary for clinical care is collected |
| **Data minimisation** | Collect only what is necessary | Registration form collects minimum required fields; optional fields clearly marked |
| **Accuracy** | Keep data accurate and up to date | Patients can update profile; updates are audited |
| **Data Principal rights** | Right to access, correct, and nominate | Patient portal provides read access; correction requests logged |
| **Erasure (Right to be forgotten)** | On request, erase data unless retention required by law | Soft-delete with legal hold flag; see §8.4 |
| **Grievance redressal** | Appoint Data Protection Officer (DPO) | DPO contact stored in `clinicSettings.dpoContact` |
| **Breach notification** | Notify DPDB within prescribed time | Incident response plan in §11 |
| **Cross-border transfer** | Restricted unless recipient country is approved | See §8.5 |
| **Children's data** | Heightened protection for minors | Age flag on `patients` schema; parental consent required for <18 |

### 8.2 Consent Management

Consent is captured and stored as a first-class object:

```js
// Embedded in patients document
consent: {
  givenAt:    Date,          // timestamp of consent
  givenBy:    ObjectId,      // userId (self or guardian)
  ipAddress:  String,
  version:    String,        // consent form version e.g. '2024-v1'
  purposes:   [String],      // ['clinical_care', 'appointment_reminders', 'billing']
  revokedAt:  Date | null,
}
```

- Consent is re-collected if the consent form version changes.
- Marketing/promotional communication consent is separate and opt-in only.
- Revocation of non-clinical consent (e.g., marketing) is processed immediately.

### 8.3 Data Minimization Principles

- Patient registration collects: name, DOB, sex, phone, address, emergency contact. Email and Aadhaar are **optional**.
- Consultation notes are written by the treating doctor; free-text is not analysed by third-party services.
- Analytics dashboards display aggregated, anonymised statistics only — no individual patient identifiers.
- Third-party integrations (email/SMS provider) receive only the information required for delivery (recipient address/phone, message content). They do not receive medical data.

### 8.4 Right to Deletion Workflow and Limitations

1. Patient submits a deletion request via the patient portal.
2. Request is logged as an audit event.
3. Admin reviews within 30 days and approves or rejects with justification.
4. **Limitations on deletion:** Records that are part of:
   - A live insurance claim or legal proceeding — placed on **legal hold**.
   - Medical records required by Indian Medical Council regulations (retention mandated by law — typically 3–7 years) — **deletion deferred** until retention period expires.
5. On approved deletion: patient PII is overwritten with anonymised tokens; the clinical record structure is retained for statistical purposes.
6. The deletion action itself is recorded in the audit log (non-deletable).

### 8.5 Cross-Border Data Transfer Restrictions

- MongoDB Atlas cluster must be hosted in **ap-south-1 (Mumbai)** or another Indian region to keep data domiciled in India.
- Cloudinary: select the **Asia (India)** region for the medical reports bucket (Cloudinary Enterprise/Business plans).
- Email delivery provider (SendGrid/Resend): patient email addresses transferred to their servers; ensure a DPA (Data Processing Agreement) is in place.
- SMS provider: same DPA requirement; prefer India-based providers (e.g., MSG91, Textlocal).
- No patient data is processed by LLMs or AI services without explicit opt-in and legal review.

---

## 9. Infrastructure Security

### 9.1 Environment Separation

| Environment | Purpose | URL | Data |
|---|---|---|---|
| **Development** | Local development | `localhost` | Synthetic/anonymised data only |
| **Staging** | Pre-release QA | `staging.smartopd.in` | Sanitised copy of prod schema; no real patient data |
| **Production** | Live clinic operations | `app.smartopd.in` | Real patient data |

- Each environment has its own MongoDB Atlas cluster, Cloudinary environment, and JWT secrets.
- Staging mirrors production infrastructure at smaller scale.
- Production secrets are never accessible to development machines.

### 9.2 Dependency Auditing

```bash
# Run before every release
npm audit --audit-level=high      # fail CI on high/critical vulnerabilities
npx snyk test                     # Snyk for deeper dependency graph analysis
```

- **GitHub Dependabot** is enabled on the repository with auto-PR for patch updates.
- Snyk is integrated into the CI pipeline (GitHub Actions); critical findings block the merge.
- Dependencies are pinned with exact versions (`"express": "4.18.3"`) in `package.json`; the lockfile (`package-lock.json`) is committed and verified.
- `npm ci` (not `npm install`) is used in CI/CD to ensure deterministic builds.

### 9.3 Container / Server Hardening

**Render (backend hosting):**
- Run the Node process as a non-root user (Render enforces this).
- Disable debug endpoints and verbose error messages in production (`NODE_ENV=production`).
- Use Render's private networking for internal services.

**AWS EC2 / ECS (if self-hosted):**
- Harden AMI: disable SSH password auth, use key-pair only; restrict SSH to a bastion or VPN IP.
- Apply Security Groups: only ports 80, 443 (and optionally 22 from bastion) open.
- Enable AWS Shield Standard for DDoS mitigation.
- Use IAM roles for EC2/ECS rather than embedding AWS credentials.

**General Node.js:**
```bash
# Disable source maps in production build
NODE_ENV=production node dist/server.js

# Never expose stack traces to clients
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
  // ↑ No err.stack in the response
});
```

### 9.4 Backup Strategy

| Item | Frequency | Location | Encryption | Retention |
|---|---|---|---|---|
| MongoDB Atlas continuous backup | Continuous (point-in-time) | Atlas cloud (same region) | AES-256 (Atlas default) | 7 days PITR + 30-day snapshots |
| Monthly full snapshot export | Monthly | AWS S3 (ap-south-1), Glacier after 90 days | SSE-S3 (AES-256) | 5 years |
| Cloudinary media | Cloudinary replication | Cloudinary CDN | At-rest encryption | Indefinite (until deletion) |
| Application config / secrets | On every change | AWS Secrets Manager version history | KMS | 1 year |

**Restoration testing:** A restoration drill is performed quarterly in the staging environment, documenting the time-to-restore and verifying data integrity.

### 9.5 Disaster Recovery Targets

| Metric | Target | Notes |
|---|---|---|
| **RTO** (Recovery Time Objective) | 4 hours | Time to restore service after a major incident |
| **RPO** (Recovery Point Objective) | 1 hour | Maximum data loss window; achievable with Atlas continuous backup |
| **MTTR** (Mean Time to Recovery) | < 2 hours | For common failures (instance restart, config rollback) |

---

## 10. Security Testing

### 10.1 OWASP Top 10 (2021) – Application Checklist

| # | Vulnerability | Smart OPD Risk | Mitigation Status |
|---|---|---|---|
| A01 | **Broken Access Control** | High – IDOR, missing clinicId filter | RBAC middleware + clinicId plugin + unit tests |
| A02 | **Cryptographic Failures** | Medium – weak hashing, plain-text transmission | bcrypt-12, TLS 1.2+, httpOnly cookies |
| A03 | **Injection** | High – NoSQL injection | Mongoose strict, express-mongo-sanitize, Zod |
| A04 | **Insecure Design** | Medium – threat model not formalised | This document + design reviews |
| A05 | **Security Misconfiguration** | Medium – default configs | Helmet.js, Render hardening, env separation |
| A06 | **Vulnerable & Outdated Components** | Medium – npm dependency risk | Dependabot, `npm audit`, Snyk |
| A07 | **Identification & Authentication Failures** | High – brute-force, weak tokens | Rate limiting, lockout, bcrypt-12, JWT rotation |
| A08 | **Software & Data Integrity Failures** | Medium – supply chain | npm ci, lockfile, Snyk |
| A09 | **Security Logging & Monitoring Failures** | Medium – insufficient audit trail | Comprehensive audit log schema (§7) |
| A10 | **Server-Side Request Forgery (SSRF)** | Low – no URL-fetching features | No outbound user-controlled URL fetch; validate if added |

### 10.2 Penetration Testing Recommendations

**Before go-live (mandatory):**
1. **External black-box pentest** – simulate an unauthenticated attacker targeting the public API and frontend.
2. **Authenticated API pentest** – test each role (patient, receptionist, doctor, admin) for IDOR, privilege escalation, and tenant isolation bypass.
3. **Static Application Security Testing (SAST)** – run `eslint-plugin-security` and Semgrep on the codebase.

**Tooling:**
- OWASP ZAP (automated scan on staging)
- Burp Suite Professional (manual API testing)
- `sqlmap` adapted for NoSQL (`nosqlmap`) – test Mongoose query endpoints
- `nuclei` with healthcare templates

**Frequency:** Annual pentest + after every major architectural change.

### 10.3 Security-Focused Test Cases

```js
// 1. IDOR – patient cannot access another patient's record
it('should return 404 when patient accesses another patient record', async () => {
  const res = await request(app)
    .get(`/api/patients/${otherPatientId}`)
    .set('Authorization', `Bearer ${patientJwt}`);
  expect(res.status).toBe(404); // 404 not 403 to prevent enumeration
});

// 2. Tenant isolation – doctor in Clinic A cannot see Clinic B prescriptions
it('should not return prescriptions from another clinic', async () => {
  const res = await request(app)
    .get(`/api/prescriptions/${clinicBPrescriptionId}`)
    .set('Authorization', `Bearer ${clinicADoctorJwt}`);
  expect(res.status).toBe(404);
});

// 3. Role escalation – receptionist cannot change own role
it('should forbid receptionist from updating their own role', async () => {
  const res = await request(app)
    .patch(`/api/users/${receptionistId}`)
    .set('Authorization', `Bearer ${receptionistJwt}`)
    .send({ role: 'admin' });
  expect(res.status).toBe(403);
});

// 4. Brute-force lockout – after 5 failures account is locked
it('should lock account after 5 failed login attempts', async () => {
  for (let i = 0; i < 5; i++) {
    await request(app).post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });
  }
  const res = await request(app).post('/api/auth/login')
    .send({ email, password: correctPassword });
  expect(res.status).toBe(423); // 423 Locked
});

// 5. NoSQL injection – should not accept operator in body
it('should reject NoSQL injection in login body', async () => {
  const res = await request(app).post('/api/auth/login')
    .send({ email: { $gt: '' }, password: { $gt: '' } });
  expect(res.status).toBe(422); // Zod validation failure
});

// 6. XSS – stored malicious script should be sanitised on output
it('should sanitise patient notes containing script tags', async () => {
  const malicious = '<script>alert(1)</script>Important note';
  // create note, then retrieve
  const res = await request(app).get(`/api/visits/${visitId}`)
    .set('Authorization', `Bearer ${doctorJwt}`);
  expect(res.body.notes).not.toContain('<script>');
});

// 7. Rate limiting – login endpoint throttled after 10 attempts per IP
it('should return 429 after 10 login requests in 15 minutes', async () => {
  for (let i = 0; i < 10; i++) {
    await request(app).post('/api/auth/login').send({ email: 'x', password: 'y' });
  }
  const res = await request(app).post('/api/auth/login').send({ email: 'x', password: 'y' });
  expect(res.status).toBe(429);
});
```

---

## 11. Incident Response

### 11.1 Breach Detection Indicators

| Indicator | Signal Source | Threshold |
|---|---|---|
| Login failure spike | Audit logs / rate-limit logs | > 50 failures/minute from single IP |
| Off-hours admin access | Audit logs | Admin login between 00:00–05:00 IST |
| Bulk data export | Audit logs | > 100 patient records read in 5 minutes |
| Unusual geographic IP | Auth logs | Login from outside India |
| Token reuse detected | Sessions service | Refresh token presented after already consumed |
| Dependency vulnerability | Snyk/Dependabot alert | Critical CVE in a production dependency |
| Anomalous file upload | Upload logs | > 20 uploads in 10 minutes from one user |
| Application error spike | Server logs | > 5% 500-error rate over 5 minutes |

### 11.2 Response Procedure

```
CONTAIN → ASSESS → NOTIFY → REMEDIATE → DOCUMENT
```

**1. Contain (0–2 hours)**
- Revoke all sessions for affected users (admin force-logout via `/api/admin/sessions/revoke-all`).
- Rotate JWT signing secret (triggers immediate invalidation of all tokens).
- If a database breach is suspected: rotate MongoDB Atlas credentials; restrict Atlas network access to known IPs.
- If Cloudinary is compromised: rotate API key/secret; re-sign all report URLs.
- Enable IP-based allowlist on the API if available (Render/AWS Security Group).

**2. Assess (2–8 hours)**
- Review audit logs for the breach window.
- Identify affected records: which patients, what data, what timeframe.
- Determine the attack vector (credential theft, injection, misconfiguration, insider).
- Preserve evidence: export audit logs and server logs to tamper-evident storage before any remediation that could overwrite them.

**3. Notify (8–72 hours)**
- **Internally:** Notify clinic owner, DPO, and legal counsel immediately.
- **Patients:** If personal data was exposed, notify affected patients with:
  - What data was involved.
  - What risk it poses.
  - What steps have been taken.
  - What they should do (e.g., change passwords).
- **Regulator:** See §11.3.

**4. Remediate**
- Patch the exploited vulnerability.
- Reset all affected user credentials.
- Conduct a full security audit before restoring normal operations.
- Engage a third-party forensics firm for significant breaches.

**5. Document**
- Write a post-incident report within 72 hours covering: timeline, root cause, affected data, response actions, lessons learned.
- Update this security specification with new controls.
- Schedule a follow-up pentest.

### 11.3 Notification Obligations Under Indian Law

Under the **DPDP Act 2023** and **CERT-In Directions (2022)**:

| Obligation | Requirement | Timeline |
|---|---|---|
| **CERT-In breach notification** | Report cybersecurity incidents (data breaches, ransomware, unauthorized access) to CERT-In | Within **6 hours** of becoming aware |
| **DPDB breach notification** (when DPDP rules are notified) | Notify the Data Protection Board of India of personal data breaches | Within the period prescribed by DPDB rules (not yet notified as of 2024) |
| **Patient (Data Principal) notification** | Notify affected individuals of a breach in a form prescribed by the Board | As per DPDB-prescribed format |
| **Record keeping** | Maintain records of the breach and notifications | Minimum 5 years |

> [!NOTE]
> CERT-In's 6-hour reporting requirement applies broadly to any significant cybersecurity incident involving patient data systems. Establish a direct contact with CERT-In (incident@cert-in.org.in) before go-live.

---

## 12. Pre-Launch Security Checklist

### Authentication & Sessions
- [ ] bcrypt cost factor set to minimum 12 in production
- [ ] JWT access token expiry set to 15 minutes
- [ ] Refresh token stored in httpOnly, Secure, SameSite=Strict cookie
- [ ] Refresh token rotation and reuse detection implemented
- [ ] Login rate limiting: 10 attempts per IP per 15 min
- [ ] Account lockout after 5 consecutive failures
- [ ] Password reset tokens are single-use, hashed, expire in 1 hour
- [ ] Multi-device session listing and revocation working
- [ ] "Log out all devices" feature implemented
- [ ] JWT signing secret is 256-bit random, stored in env var, not in code

### Authorization
- [ ] Every route protected by `authenticate` + `authorize(roles)` middleware
- [ ] `clinicId` filter applied on every Mongoose query across all controllers
- [ ] Patient routes filtered by `patientId === req.user.patientProfileId`
- [ ] Role field on `users` document is not modifiable by non-admin
- [ ] Permission denied events logged to audit log

### Input Validation
- [ ] All request bodies validated with Zod schemas
- [ ] `express-mongo-sanitize` applied globally
- [ ] File uploads: MIME type checked via magic bytes, size capped at 10 MB
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization in React

### API Security
- [ ] CORS whitelist set to production frontend domain only
- [ ] Helmet.js applied with strict CSP
- [ ] Global rate limiter + per-route limiters configured
- [ ] Request body size limit set (100 KB JSON, 10 MB multipart)
- [ ] All API traffic served over HTTPS; plain HTTP redirected
- [ ] HSTS header present with preload directive

### Data Security
- [ ] MongoDB Atlas cluster in ap-south-1 (India region)
- [ ] MongoDB Atlas encryption at rest enabled
- [ ] All Cloudinary medical report folders set to Authenticated delivery type
- [ ] Signed, time-limited URLs used for all report access
- [ ] No secrets in source code or committed `.env` files
- [ ] `.env.example` committed with placeholder values only
- [ ] `gitleaks` pre-commit hook installed in repo

### Audit Logging
- [ ] Audit log created for every write operation
- [ ] Audit log created for all auth events (login, logout, failures)
- [ ] Audit log created for all permission denials
- [ ] No DELETE or UPDATE endpoint exists for `auditLogs` collection
- [ ] MongoDB Atlas DB user for app has only insert+find on `auditLogs`
- [ ] Log retention policy configured (5 years, with Glacier cold storage after 1 year)

### Infrastructure
- [ ] Environment separation: dev/staging/production use separate clusters and secrets
- [ ] `npm audit --audit-level=high` passes with zero critical/high findings
- [ ] Snyk integrated in CI/CD pipeline
- [ ] Dependabot enabled on GitHub repository
- [ ] `npm ci` used in CI (not `npm install`)
- [ ] MongoDB Atlas network access restricted to backend server IPs
- [ ] Render/AWS server not running as root
- [ ] MongoDB Atlas automated backups enabled with 7-day PITR
- [ ] Quarterly backup restoration drill scheduled

### Compliance
- [ ] Patient consent captured at registration with version tracking
- [ ] DPO contact information stored in clinic settings
- [ ] Right-to-deletion workflow documented and implemented (soft delete + legal hold)
- [ ] Data Processing Agreements (DPAs) signed with SendGrid/Resend and SMS provider
- [ ] CERT-In incident reporting contact established (incident@cert-in.org.in)

### Security Testing
- [ ] `eslint-plugin-security` running in CI
- [ ] OWASP ZAP automated scan run against staging before release
- [ ] Manual pentest completed against authenticated endpoints
- [ ] All 7 security-specific test cases in §10.3 passing
- [ ] Stack traces not exposed in production API error responses

---

*Last updated: v1.0 | Smart OPD Engineering Team*  
*Review schedule: Before every major release; annually at minimum.*
