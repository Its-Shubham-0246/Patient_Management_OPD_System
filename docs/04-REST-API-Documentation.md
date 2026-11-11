# Smart OPD – REST API & WebSocket Specification
## Single-Clinic Outpatient Department Management System

> **Document ID:** 04-REST-API-Documentation.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Protocol:** RESTful JSON over HTTPS + Socket.IO v4 WebSockets  
> **Base URL:** `https://{{CLINIC_DOMAIN}}/api/v1`  
> **Auth Scheme:** JWT Bearer Token (`Authorization: Bearer <token>`) + `httpOnly` Refresh Cookie  

---

## 1. Global API Standards & Envelope Conventions

### 1.1 Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalRecords": 84,
    "totalPages": 5
  }
}
```

### 1.2 Standard Error Envelope (RFC 7807 Compliant)
```json
{
  "success": false,
  "error": {
    "code": "SLOT_ALREADY_RESERVED",
    "message": "The selected appointment slot has already been booked by another patient.",
    "statusCode": 409,
    "timestamp": "2026-11-11T11:24:00.000Z",
    "path": "/api/v1/appointments",
    "details": [
      {
        "field": "timeSlot",
        "issue": "Slot 10:15 is no longer available for Dr. Sharma on 2026-11-12."
      }
    ]
  }
}
```

### 1.3 RBAC Permission Tags
- `[ALL]` : Unauthenticated / Public endpoint.
- `[PATIENT]` : Authenticated Patient or higher.
- `[RECEPTIONIST]` : Receptionist or Admin.
- `[DOCTOR]` : Medical Practitioner or Admin.
- `[ADMIN]` : Clinic Owner / Administrator only.

---

## 2. API Endpoint Catalog by Controller

### 2.1 Controller 01: Authentication & Session (`/auth`)

#### `POST /auth/login` `[ALL]`
Authenticates a user by phone or email + password. Returns short-lived access JWT and sets `httpOnly` refresh token.
- **Zod Validation Schema**:
```typescript
const LoginSchema = z.object({
  loginIdentifier: z.string().min(3), // phone or email
  password: z.string().min(6)
});
```
- **Request Body**:
```json
{
  "loginIdentifier": "9876543210",
  "password": "SecurePassword#123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "6731ecb01234567890abcdef",
      "fullName": "Dr. Rajesh Sharma",
      "phone": "9876543210",
      "role": "DOCTOR",
      "clinicId": "6731ecb00000000000000001"
    }
  }
}
```

#### `POST /auth/register` `[ALL]`
Patient self-registration. Creates `User` and linked `Patient` profile with auto-generated UHID.

#### `POST /auth/refresh` `[ALL]`
Rotates refresh token cookie and returns a fresh access JWT.

#### `POST /auth/logout` `[ALL]`
Clears `refreshToken` cookie and blacklists session token.

#### `GET /auth/me` `[PATIENT, RECEPTIONIST, DOCTOR, ADMIN]`
Returns authenticated user session details, role, permissions, and linked profile (`doctorProfileId` or `patientProfileId`).

#### `POST /auth/forgot-password` `[ALL]`
Dispatches a single-use 15-minute cryptographically signed password reset token to the user's verified email.

#### `POST /auth/reset-password` `[ALL]`
Validates password reset token and securely updates password with bcrypt work factor 12.

---

### 2.2 Controller 02: Clinic Configuration (`/clinic`)

#### `GET /clinic` `[ALL]`
Retrieves public clinic metadata (name, logo, address, contact, operating hours, active departments).

#### `PUT /clinic` `[ADMIN]`
Updates clinic configuration (fees, policies, operating shifts, tax parameters, auto-allocation weights).

#### `GET /clinic/holidays` `[ALL]`
Lists all upcoming scheduled clinic holidays and annual closures.

#### `POST /clinic/holidays` `[ADMIN]`
Adds a clinic-wide closure date (e.g. National Holidays / Festivals).

#### `DELETE /clinic/holidays/:id` `[ADMIN]`
Removes a clinic holiday from the master schedule.

---

### 2.3 Controller 03: Doctors, Availability & Allocation (`/doctors`)

#### `GET /doctors` `[ALL]`
Lists all active doctors with department, qualifications, room number, consultation fee, and max daily capacity.

#### `POST /doctors` `[ADMIN]`
Onboards a new physician into the clinic system, setting medical council registration number, department, room, and capacity limits.

#### `PUT /doctors/:id` `[ADMIN]`
Updates doctor configuration (consultation fee, room number, maxDailyPatients, isAutoAllocatable, status).

#### `GET /doctors/:id/schedule` `[ALL]`
Fetches the recurring weekly shift schedule for a specific doctor.

#### `PUT /doctors/:id/schedule` `[DOCTOR (own), ADMIN]`
Configures split-shifts and slot duration for a doctor's weekly calendar.

#### `GET /doctors/:id/leaves` `[DOCTOR (own), RECEPTIONIST, ADMIN]`
Lists planned and approved leaves for a doctor.

#### `POST /doctors/:id/leaves` `[DOCTOR (own), ADMIN]`
Submits a leave request for a date range or specific shift.

#### `PUT /doctors/leaves/:leaveId/status` `[ADMIN]`
Approves or rejects a leave request. If approved, automatically marks conflicting appointments as `SCHEDULE_CONFLICT_LEAVE` and triggers patient reschedule alerts.

#### `GET /doctors/:id/available-slots?date=YYYY-MM-DD` `[ALL]`
Calculates available appointment slots by subtracting booked slots, leaves, and shift breaks.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "doctorId": "6731ecb01234567890doc001",
    "doctorName": "Dr. Rajesh Sharma",
    "date": "2026-11-12",
    "slotDurationMinutes": 15,
    "slots": [
      { "time": "09:00", "isAvailable": true },
      { "time": "09:15", "isAvailable": false, "reason": "BOOKED" },
      { "time": "09:30", "isAvailable": true },
      { "time": "09:45", "isAvailable": true },
      { "time": "10:00", "isAvailable": false, "reason": "LUNCH_BREAK" }
    ]
  }
}
```

#### `GET /doctors/allocate/specialty` `[ALL, RECEPTIONIST, ADMIN]`
**Smart Doctor Allocation Endpoint**: Evaluates all verified active doctors in a requested department, computes multi-factor Workload Index ($W_i$), and returns the optimal recommended specialist.
- **Query Parameters**:
  - `department`: e.g., "General Medicine" (required)
  - `date`: e.g., "2026-11-12" (required)
  - `timeSlot`: e.g., "10:15" (optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "department": "General Medicine",
    "targetDate": "2026-11-12",
    "recommendedDoctor": {
      "doctorId": "6731ecb01234567890doc001",
      "fullName": "Dr. Rajesh Sharma",
      "roomNumber": "Room 1",
      "workloadIndex": 0.34,
      "workloadCategory": "LOW",
      "estWaitMinutes": 10,
      "availableSlots": ["10:15", "10:30", "11:00"]
    },
    "eligibleDoctors": [
      {
        "doctorId": "6731ecb01234567890doc001",
        "fullName": "Dr. Rajesh Sharma",
        "workloadIndex": 0.34,
        "activeWaitingCount": 2,
        "confirmedAppointmentsCount": 4,
        "isRecommended": true
      },
      {
        "doctorId": "6731ecb01234567890doc002",
        "fullName": "Dr. Sunil Mehta",
        "workloadIndex": 0.78,
        "activeWaitingCount": 6,
        "confirmedAppointmentsCount": 8,
        "isRecommended": false
      }
    ],
    "allocationReason": "Dr. Rajesh Sharma has the lowest committed clinical load (0.34) and 4 available slots matching the requested timeframe."
  }
}
```

---

### 2.4 Controller 04: Patient Directory (`/patients`)

#### `GET /patients/search?q=98765` `[RECEPTIONIST, DOCTOR, ADMIN]`
Instant debounced search matching UHID, mobile number, or full name.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "6731ecb09999999999999001",
      "uhid": "OPD-2611-00042",
      "fullName": "Rahul Mehta",
      "phone": "9876543210",
      "gender": "MALE",
      "age": 34,
      "bloodGroup": "B+",
      "allergies": ["PENICILLIN"]
    }
  ]
}
```

#### `POST /patients` `[RECEPTIONIST, ADMIN]`
Registers a new patient and generates a sequential UHID.

#### `GET /patients/:id` `[RECEPTIONIST, DOCTOR, ADMIN, PATIENT(self)]`
Fetches a single patient demographic profile, verified emergency contact, and documented drug allergies.

#### `PUT /patients/:id` `[RECEPTIONIST, ADMIN, PATIENT(self)]`
Updates patient contact information, address, emergency contact, or documented allergies.

#### `GET /patients/:id/prescriptions` `[DOCTOR, ADMIN, PATIENT(self)]`
Returns chronological list of all signed prescriptions issued to this patient across clinical visits.

#### `POST /patients/:id/reports` `[RECEPTIONIST, DOCTOR, ADMIN]`
Uploads diagnostic lab report or radiology scan (PDF/JPG/PNG up to 10MB) to secure Cloudinary storage.

#### `GET /patients/reports/:id/download` `[DOCTOR, ADMIN, PATIENT(self)]`
Generates a time-limited pre-signed secure download URL (TTL = 15 minutes) for a diagnostic report.

#### `GET /patients/:id/medical-history` `[DOCTOR, ADMIN, PATIENT(self)]`
Aggregates longitudinal EMR: visits, prescriptions, vitals trends, lab reports, and billing history.

---

### 2.5 Controller 05: Appointments & Allocation Engine (`/appointments`)

#### `GET /appointments` `[RECEPTIONIST, DOCTOR, ADMIN, PATIENT(self)]`
Lists appointments filterable by date, doctorId, status, and patientId. Patients can only query their own appointments.

#### `GET /appointments/:id` `[RECEPTIONIST, DOCTOR, ADMIN, PATIENT(self)]`
Retrieves full details of an appointment reservation, including assigned doctor and allocation details.

#### `POST /appointments` `[PATIENT, RECEPTIONIST, ADMIN]`
Standard appointment reservation when patient chooses a specific doctor manually.

#### `POST /appointments/auto-allocate` `[PATIENT, RECEPTIONIST, ADMIN]`
Atomically runs the auto-allocation engine, selects the lowest-workload specialist in the chosen department, and books the reservation in a single atomic transaction.
- **Request Body**:
```json
{
  "patientId": "6731ecb09999999999999001",
  "department": "General Medicine",
  "appointmentDate": "2026-11-12",
  "preferredTimeSlot": "10:15",
  "bookingChannel": "ONLINE_PATIENT"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "appointmentId": "6731ecb0aaaaaaaaaaaa0001",
    "assignedDoctor": {
      "id": "6731ecb01234567890doc001",
      "fullName": "Dr. Rajesh Sharma",
      "roomNumber": "Room 1",
      "workloadIndex": 0.34
    },
    "appointmentDate": "2026-11-12",
    "timeSlot": "10:15",
    "allocationMethod": "AUTOMATIC",
    "status": "CONFIRMED"
  }
}
```

#### `POST /appointments/override-allocation` `[RECEPTIONIST, ADMIN]`
Allows authorized receptionists or administrators to manually bypass the recommended doctor and assign an alternate specialist, requiring an explicit reason and logging an immutable audit event.
- **Request Body**:
```json
{
  "patientId": "6731ecb09999999999999001",
  "selectedDoctorId": "6731ecb01234567890doc002",
  "recommendedDoctorId": "6731ecb01234567890doc001",
  "appointmentDate": "2026-11-12",
  "timeSlot": "10:30",
  "overrideReasonCode": "PATIENT_REQUESTED_SPECIFIC_PHYSICIAN",
  "overrideNotes": "Patient has longstanding history with Dr. Sunil Mehta"
}
```

#### `PUT /appointments/:id/reschedule` `[PATIENT, RECEPTIONIST, ADMIN]`
Reschedules an appointment to a new date/timeSlot. Validates that the request complies with the 4-hour clinic cancellation cutoff.

#### `PUT /appointments/:id/cancel` `[PATIENT, RECEPTIONIST, ADMIN]`
Cancels an appointment reservation with a mandatory `cancellationReason`. Re-opens the slot in real time.

#### `PUT /appointments/:id/no-show` `[RECEPTIONIST, ADMIN]`
Marks a patient appointment as `NO_SHOW` when the 20-minute post-slot arrival grace period expires.

#### `PUT /appointments/:id/checkin` `[RECEPTIONIST, ADMIN]`
**Physical Ingress Trigger**: Converts scheduled appointment to `CHECKED_IN`, creates active `Visit`, and issues daily sequential `QueueEntry` token.

---

### 2.6 Controller 06: Live OPD Queue & Waiting Room (`/queue`)

#### `GET /queue/:doctorId?date=YYYY-MM-DD` `[RECEPTIONIST, DOCTOR, ADMIN]`
Fetches today's active waiting queue for a specific doctor.

#### `GET /queue/display` `[ALL]`
Public endpoint feeding the 4K Waiting Room TV monitors. Aggregates current calling tokens, doctor rooms, and upcoming tokens across all active consultation rooms with privacy-masked patient names (e.g., `RAHUL M.`).

#### `POST /queue/walkin` `[RECEPTIONIST, ADMIN]`
Registers an unscheduled walk-in patient, atomically creates a `Visit`, and allocates the next available FIFO daily token.

#### `PUT /queue/:entryId/call-next` `[DOCTOR, RECEPTIONIST]`
Advances doctor's queue. Emits real-time `queue:called` event over Socket.IO to waiting room screens and triggers audio chime.

#### `PUT /queue/:entryId/start` `[DOCTOR]`
Transitions token status from `CALLED` to `IN_CONSULTATION` when patient enters the consultation room.

#### `PUT /queue/:entryId/complete` `[DOCTOR]`
Transitions token status from `IN_CONSULTATION` to `COMPLETED` upon prescription finalization.

#### `PUT /queue/:entryId/skip` `[DOCTOR, RECEPTIONIST]`
Marks a token as `SKIPPED` when a patient fails to report after 3 audible calls. Preserves token for later recall.

#### `PUT /queue/:entryId/recall` `[RECEPTIONIST, DOCTOR]`
Recalls a previously skipped patient token back to the active queue.

#### `PUT /queue/:entryId/priority` `[DOCTOR, ADMIN]`
Elevates critical patient to `TOKEN-EMERGENCY` at head of queue with clinician sign-off.

---

### 2.7 Controller 07: Clinical Consultation & Prescriptions (`/prescriptions`)

#### `POST /prescriptions/:visitId` `[DOCTOR]`
Finalizes clinical consultation, saves diagnosis and medications, and triggers background PDFKit generation.
- **Request Body**:
```json
{
  "vitals": {
    "bloodPressureSystolic": 120,
    "bloodPressureDiastolic": 80,
    "pulseRate": 74,
    "temperatureFahrenheit": 98.6
  },
  "chiefComplaints": ["Fever for 3 days", "Productive cough"],
  "diagnosis": "Acute Bronchitis",
  "icd10Code": "J20.9",
  "medications": [
    {
      "drugName": "Tab. Azithromycin 500mg",
      "dosageStrength": "500mg",
      "dosageForm": "TABLET",
      "frequency": "1-0-0",
      "durationDays": 3,
      "timing": "AFTER_FOOD"
    }
  ],
  "generalAdvice": "Adequate hydration. Avoid cold exposure.",
  "followUpDays": 5
}
```

#### `GET /prescriptions/:id/pdf` `[ALL (with signed token) | DOCTOR | PATIENT]`
Streams the official signed A4 prescription PDF generated by PDFKit.

#### `GET /prescriptions/visit/:visitId` `[DOCTOR, ADMIN, PATIENT(self)]`
Retrieves the finalized clinical prescription and examination notes for a specific visit encounter.

#### `GET /prescriptions/verify/:verificationToken` `[ALL]`
Public QR-code verification endpoint for pharmacists. Returns doctor name, medical council registration, date, clinic name, and cryptographic verification status.

---

### 2.8 Controller 08: Billing, Cashier Settlements & Daily Collections (`/invoices`, `/payments`)

#### `POST /invoices` `[RECEPTIONIST, ADMIN]`
Generates an itemized billing invoice for a consultation visit (supports adding ECG, wound dressings, laboratory tests, and nursing charges).

#### `GET /invoices` `[RECEPTIONIST, ADMIN]`
Paginated invoice ledger with filters for date, cashier, and payment status (`PAID`, `UNPAID`, `PARTIALLY_PAID`).

#### `GET /invoices/:id` `[RECEPTIONIST, ADMIN, PATIENT(self)]`
Retrieves full itemized invoice details and provides printable PDF receipt download.

#### `POST /invoices/:id/discount` `[ADMIN]`
Applies an authorized fixed or percentage discount to an invoice. Requires Clinic Admin role or authorized PIN, recording `discountReason` and `discountAuthorizedBy`.

#### `POST /payments` `[RECEPTIONIST, ADMIN]`
Records cashier settlement against an invoice (Cash, Static UPI QR, or Card POS terminal). Supports partial/split payments.

#### `GET /invoices/daily-collections?date=YYYY-MM-DD` `[RECEPTIONIST, ADMIN]`
Returns the daily cashier reconciliation summary breaking down collections across Cash, UPI QR, and Card with transaction counts.

---

### 2.9 Controller 09: Doctor-Assisted Follow-Ups (`/follow-ups`)

#### `GET /follow-ups` `[RECEPTIONIST, DOCTOR, ADMIN]`
Lists pending follow-up recommendations filterable by due date range and doctor. Enables receptionist proactive outreach.

#### `POST /follow-ups/:id/book` `[RECEPTIONIST, ADMIN, PATIENT(self)]`
Converts a recommended medical follow-up into a confirmed appointment. Automatically applies zero-fee waiver if within the clinic's configured `followUpFreeDays` window (default: 7 days).

---

### 2.10 Controller 10: Multi-Channel Notifications (`/notifications`)

#### `GET /notifications` `[ALL Authenticated Users]`
Fetches the current user's unread in-app notifications and announcements.

#### `PUT /notifications/:id/read` `[ALL Authenticated Users]`
Marks a specific notification as read.

---

### 2.11 Controller 11: Clinic Analytics & Audit Logs (`/analytics`, `/audit-logs`)

#### `GET /analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD` `[ADMIN]`
Returns executive KPIs: total patient footfall, new vs returning ratio, total revenue by payment mode, and average patient waiting times.

#### `GET /analytics/doctor-workload` `[ADMIN]`
Returns real-time and historical workload distribution across doctors and specialties for clinical staffing optimization.

#### `GET /audit-logs` `[ADMIN]`
Read-only query endpoint for statutory compliance inspection and forensic security review.

---

## 3. Real-Time WebSocket Specifications (Socket.IO v4)

### 3.1 Room Topology
- `clinic:{clinicId}:display` : All waiting room TV monitors.
- `clinic:{clinicId}:doctor:{doctorId}` : Doctor workspace and room-specific display.
- `user:{userId}` : Individual patient/staff real-time notification channel.

### 3.2 Key WebSocket Events

| Event Name | Direction | Payload Structure | Purpose |
|---|---|---|---|
| `queue:called` | Server → Room | `{ doctorId, roomNo, tokenNumber, maskedPatientName: "RAHUL M.", uhid: "OPD-2611-00042" }` | Updates TV display and triggers chime. *Enforces DPDP Act privacy (masked patient name only).* |
| `queue:updated` | Server → Room | `{ doctorId, waitingCount, currentToken }` | Synchronizes queue list on staff dashboard. |
| `queue:emergency` | Server → Room | `{ doctorId, tokenNumber: "EMERGENCY", roomNo }` | Flashes emergency banner on waiting room TV. |
| `notification:new` | Server → User | `{ id, title, message, type, actionUrl }` | Toast alert on patient or staff portal. |
