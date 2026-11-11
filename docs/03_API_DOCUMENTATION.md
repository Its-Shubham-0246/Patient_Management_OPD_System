# Smart OPD — REST API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS  
**Content-Type:** `application/json` (unless noted otherwise)

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
   - 1.1 [Authentication & Authorization](#11-authentication--authorization)
   - 1.2 [Error Response Format](#12-error-response-format)
   - 1.3 [Pagination Pattern](#13-pagination-pattern)
   - 1.4 [File Upload Conventions](#14-file-upload-conventions)
   - 1.5 [Rate Limiting Strategy](#15-rate-limiting-strategy)
   - 1.6 [API Versioning Policy](#16-api-versioning-policy)
2. [WebSocket / Socket.IO Events](#2-websocket--socketio-events)
3. [Auth Endpoints](#3-auth-endpoints)
4. [Clinic Endpoints](#4-clinic-endpoints)
5. [Users / Staff Endpoints](#5-users--staff-endpoints)
6. [Doctor Endpoints](#6-doctor-endpoints)
7. [Patient Endpoints](#7-patient-endpoints)
8. [Appointment Endpoints](#8-appointment-endpoints)
9. [Visit Endpoints](#9-visit-endpoints)
10. [Queue Endpoints](#10-queue-endpoints)
11. [Consultation & Prescription Endpoints](#11-consultation--prescription-endpoints)
12. [Medical Report Endpoints](#12-medical-report-endpoints)
13. [Follow-up Endpoints](#13-follow-up-endpoints)
14. [Billing & Payment Endpoints](#14-billing--payment-endpoints)
15. [Notification Endpoints](#15-notification-endpoints)
16. [Analytics Endpoints](#16-analytics-endpoints)
17. [Audit Log Endpoints](#17-audit-log-endpoints)

---

## 1. Global Conventions

### 1.1 Authentication & Authorization

All protected endpoints require a valid JWT **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

- **Access Token** lifetime: 15 minutes (configurable via `JWT_ACCESS_EXPIRY` env).
- **Refresh Token** lifetime: 7 days; stored as an `httpOnly`, `Secure`, `SameSite=Strict` cookie named `refreshToken`.
- Tokens are invalidated on logout and password reset.

**Role Hierarchy:**

| Role | Code | Description |
|---|---|---|
| Clinic Admin | `admin` | Full system access |
| Doctor | `doctor` | Own schedule, consultations, patients |
| Receptionist | `receptionist` | Patient registration, queue, appointments |
| Patient | `patient` | Own records only |

**Authorization notation used in this document:**

- `🔓 Public` – No token required  
- `🔐 Authenticated` – Any valid token  
- `👑 admin` – Admin role only  
- `👨‍⚕️ doctor` – Doctor role only  
- `🧑‍💼 receptionist` – Receptionist role only  
- `🧑‍🤝‍🧑 patient` – Patient role only  
- Combined roles are listed with `|` (e.g., `admin | receptionist`)

---

### 1.2 Error Response Format

All error responses follow a consistent envelope:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable summary of the error.",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email address."
    }
  ],
  "requestId": "req_7f3a9c12"
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `false` for errors |
| `code` | string | Machine-readable error code |
| `message` | string | Human-readable top-level message |
| `details` | array \| null | Per-field or sub-errors; `null` when not applicable |
| `requestId` | string | Unique request ID for tracing |

**Standard HTTP Status Codes:**

| Status | Meaning |
|---|---|
| `200` | OK – request succeeded |
| `201` | Created – resource created |
| `204` | No Content – successful with no body |
| `400` | Bad Request – malformed JSON / missing required fields |
| `401` | Unauthorized – missing or invalid token |
| `403` | Forbidden – authenticated but insufficient role |
| `404` | Not Found – resource does not exist |
| `409` | Conflict – duplicate resource |
| `422` | Unprocessable Entity – semantic validation failure |
| `429` | Too Many Requests – rate limit hit |
| `500` | Internal Server Error |

**Standard Error Codes:**

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `TOKEN_INVALID` | 401 | Malformed or tampered token |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate record |
| `VALIDATION_ERROR` | 422 | Input validation failure |
| `SLOT_UNAVAILABLE` | 409 | Requested appointment slot is taken |
| `DOCTOR_ON_LEAVE` | 422 | Doctor is on leave on the requested date |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

### 1.3 Pagination Pattern

All list endpoints support cursor-free page-based pagination via query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Records per page (max `100`) |
| `sort` | string | varies | Field name to sort by |
| `order` | string | `desc` | `asc` or `desc` |

**Paginated Response Envelope:**

```json
{
  "success": true,
  "data": [ /* array of records */ ],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

**Example:** `GET /api/v1/patients?page=2&limit=10&sort=createdAt&order=desc`

---

### 1.4 File Upload Conventions

File uploads use `multipart/form-data`. Do **not** set `Content-Type: application/json` for these endpoints.

| Attribute | Value |
|---|---|
| Field name | Documented per endpoint (e.g., `logo`, `file`) |
| Max file size | `10 MB` |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` (images); `application/pdf` (documents) |
| Storage | Cloudinary (CDN-backed); URL returned in response |
| Virus scan | ClamAV scan on upload; rejected if infected |

**Example Upload Request:**

```
POST /api/v1/clinic/logo
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="logo"; filename="clinic-logo.png"
Content-Type: image/png

<binary data>
------FormBoundary--
```

---

### 1.5 Rate Limiting Strategy

Rate limiting is enforced per IP (unauthenticated) and per `userId` (authenticated) using a sliding-window algorithm backed by Redis.

| Tier | Scope | Limit | Window |
|---|---|---|---|
| Auth endpoints | Per IP | 10 requests | 15 minutes |
| General API | Per `userId` | 300 requests | 1 minute |
| File uploads | Per `userId` | 20 requests | 1 hour |
| PDF generation | Per `userId` | 30 requests | 1 hour |
| Analytics | Per `userId` | 60 requests | 1 minute |
| Password reset | Per email | 3 requests | 1 hour |

On limit breach, response:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731312000
```

```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please retry after 60 seconds.",
  "details": null,
  "requestId": "req_ab12cd34"
}
```

---

### 1.6 API Versioning Policy

- Current version: **v1** (prefix `/api/v1`).
- Versioning is path-based.
- **Backward-compatible** changes (new optional fields, new endpoints) are added without a version bump.
- **Breaking changes** (removed fields, changed semantics) require a new version (`/api/v2`).
- Deprecated endpoints include the response header `Deprecation: true` and `Sunset: <date>`.
- Previous version support: 6 months after `Sunset` date, then removed.

---

## 2. WebSocket / Socket.IO Events

The server exposes a Socket.IO namespace at `/socket.io`. Clients authenticate the WebSocket connection by passing the JWT access token as a handshake query parameter:

```
wss://HOST/socket.io/?token=<access_token>
```

### 2.1 Room Structure

| Room Name | Joined By | Description |
|---|---|---|
| `queue:<doctorId>` | Doctor, Receptionist | Live queue updates for a specific doctor |
| `clinic:<clinicId>` | Admin | Clinic-wide broadcasts (new appointments, alerts) |
| `patient:<patientId>` | Patient | Personal notifications |

**Joining a Room (Client → Server):**

```json
// Event: "join:room"
{
  "room": "queue:64f1a2b3c4d5e6f7a8b9c0d1"
}
```

### 2.2 Queue Events

#### `queue:updated` — Server → Client

Emitted to `queue:<doctorId>` whenever the queue changes (entry added, priority changed, status changed).

```json
{
  "event": "queue:updated",
  "doctorId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "queue": [
    {
      "entryId": "64abc123",
      "tokenNumber": 7,
      "patientName": "Ravi Sharma",
      "patientId": "64xyz789",
      "status": "waiting",
      "priority": "normal",
      "estimatedWaitMinutes": 12,
      "checkInTime": "2024-11-11T09:15:00Z"
    }
  ],
  "timestamp": "2024-11-11T09:15:03Z"
}
```

#### `queue:called` — Server → Client

Emitted when a doctor/receptionist calls the next patient.

```json
{
  "event": "queue:called",
  "doctorId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "entryId": "64abc123",
  "tokenNumber": 7,
  "patientName": "Ravi Sharma",
  "timestamp": "2024-11-11T09:28:00Z"
}
```

#### `queue:priority_changed` — Server → Client

```json
{
  "event": "queue:priority_changed",
  "entryId": "64abc123",
  "newPriority": "emergency",
  "updatedBy": "64doctorId",
  "timestamp": "2024-11-11T09:30:00Z"
}
```

#### `appointment:new` — Server → Client (clinic room)

```json
{
  "event": "appointment:new",
  "appointmentId": "64apptId",
  "patientName": "Priya Mehta",
  "doctorId": "64docId",
  "scheduledAt": "2024-11-12T10:00:00Z",
  "timestamp": "2024-11-11T14:22:00Z"
}
```

---

## 3. Auth Endpoints

### `POST /auth/register`

**Description:** Patient self-registration. Creates a `patient` role user and a corresponding patient profile.  
**Auth:** 🔓 Public  

**Request Body:**

```json
{
  "name": "Priya Mehta",
  "email": "priya@example.com",
  "phone": "9876543210",
  "password": "Secure@123",
  "dateOfBirth": "1992-05-14",
  "gender": "female"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | ✅ | 2–100 chars |
| `email` | string | ✅ | Valid email, unique |
| `phone` | string | ✅ | 10-digit mobile number |
| `password` | string | ✅ | Min 8 chars, 1 uppercase, 1 digit, 1 special char |
| `dateOfBirth` | string (ISO date) | ✅ | Past date |
| `gender` | string | ✅ | `male` \| `female` \| `other` |

**Response `201`:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "64usr123",
    "patientId": "64pat456",
    "email": "priya@example.com"
  }
}
```

**Business Rules:**
- Email verification link sent; account active immediately but email marked unverified.
- Duplicate email returns `409 CONFLICT`.

---

### `POST /auth/login`

**Description:** Authenticates any user (all roles) and returns tokens.  
**Auth:** 🔓 Public  

**Request Body:**

```json
{
  "email": "admin@clinic.com",
  "password": "Admin@123"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "64usr001",
      "name": "Dr. Anjali Singh",
      "email": "anjali@clinic.com",
      "role": "doctor",
      "avatarUrl": "https://res.cloudinary.com/..."
    }
  }
}
```

- `refreshToken` is set as `httpOnly` cookie.
- Failed login increments lockout counter; account locked after 5 consecutive failures for 30 minutes.

---

### `POST /auth/refresh`

**Description:** Exchanges the `refreshToken` cookie for a new access token.  
**Auth:** 🔓 Public (cookie required)  

**Request:** No body. Requires `refreshToken` cookie.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

**Notes:** Refresh token is rotated on each use (refresh token rotation). Old refresh token is invalidated.

---

### `POST /auth/logout`

**Description:** Invalidates the refresh token and clears the cookie.  
**Auth:** 🔐 Authenticated  

**Request:** No body.

**Response `200`:**

```json
{ "success": true, "message": "Logged out successfully." }
```

---

### `POST /auth/forgot-password`

**Description:** Sends a password-reset link to the registered email.  
**Auth:** 🔓 Public  

**Request Body:**

```json
{ "email": "priya@example.com" }
```

**Response `200`:** Always returns success (to prevent email enumeration):

```json
{ "success": true, "message": "If that email is registered, a reset link has been sent." }
```

**Rate limit:** 3 requests per email per hour.

---

### `POST /auth/reset-password`

**Description:** Resets password using the token from the email link.  
**Auth:** 🔓 Public  

**Request Body:**

```json
{
  "token": "abc123resettoken",
  "newPassword": "NewSecure@456"
}
```

**Response `200`:**

```json
{ "success": true, "message": "Password reset successful." }
```

**Notes:** Reset token expires in 1 hour. Used tokens are invalidated immediately.

---

### `GET /auth/me`

**Description:** Returns the authenticated user's profile.  
**Auth:** 🔐 Authenticated  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "64usr001",
    "name": "Dr. Anjali Singh",
    "email": "anjali@clinic.com",
    "phone": "9876543210",
    "role": "doctor",
    "avatarUrl": "https://res.cloudinary.com/...",
    "isEmailVerified": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 4. Clinic Endpoints

### `GET /clinic`

**Description:** Returns the clinic's public and configuration profile.  
**Auth:** 🔐 Authenticated  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "clinicId": "64clinic001",
    "name": "{{CLINIC_NAME}}",
    "tagline": "{{CLINIC_TAGLINE}}",
    "logoUrl": "https://res.cloudinary.com/...",
    "address": { "street": "...", "city": "...", "state": "...", "pincode": "..." },
    "phone": "0120-4567890",
    "email": "info@clinic.com",
    "website": "https://clinic.com",
    "registrationNumber": "MCI-XXXX",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }
}
```

---

### `PUT /clinic`

**Description:** Updates clinic profile information.  
**Auth:** 👑 admin  

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Clinic Name",
  "phone": "0120-9999999",
  "address": { "city": "Noida" },
  "currency": "INR",
  "timezone": "Asia/Kolkata"
}
```

**Response `200`:** Returns updated clinic object.

---

### `PUT /clinic/logo`

**Description:** Uploads/replaces the clinic logo.  
**Auth:** 👑 admin  
**Content-Type:** `multipart/form-data`  

**Request:** Form field `logo` — image file (JPEG/PNG/WEBP, max 5 MB).

**Response `200`:**

```json
{
  "success": true,
  "data": { "logoUrl": "https://res.cloudinary.com/clinic/logo_v2.png" }
}
```

---

### `GET /clinic/departments`

**Description:** Lists all departments configured in the clinic.  
**Auth:** 🔐 Authenticated  

**Response `200`:**

```json
{
  "success": true,
  "data": [
    { "id": "64dep001", "name": "Cardiology", "description": "Heart & vascular", "isActive": true }
  ]
}
```

---

### `POST /clinic/departments`

**Description:** Creates a new department.  
**Auth:** 👑 admin  

**Request Body:**

```json
{ "name": "Neurology", "description": "Brain & nervous system" }
```

**Response `201`:** Returns created department.

---

### `PUT /clinic/departments/:id`

**Description:** Updates a department by ID.  
**Auth:** 👑 admin  

**Path Params:** `id` — department ObjectId.

**Request Body:** Any department fields to update.

**Response `200`:** Returns updated department.

---

### `DELETE /clinic/departments/:id`

**Description:** Soft-deletes a department (sets `isActive: false`).  
**Auth:** 👑 admin  

**Response `200`:** `{ "success": true, "message": "Department deactivated." }`

**Business Rule:** Cannot delete a department that has active doctors assigned.

---

### `GET /clinic/working-hours`

**Description:** Returns the clinic's daily working hours.  
**Auth:** 🔐 Authenticated  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "workingHours": [
      { "day": "monday", "open": "09:00", "close": "18:00", "isOpen": true },
      { "day": "sunday", "open": null, "close": null, "isOpen": false }
    ]
  }
}
```

---

### `PUT /clinic/working-hours`

**Description:** Updates the clinic working hours schedule.  
**Auth:** 👑 admin  

**Request Body:**

```json
{
  "workingHours": [
    { "day": "monday", "open": "09:00", "close": "17:00", "isOpen": true }
  ]
}
```

**Response `200`:** Returns updated working hours.

---

### `POST /clinic/holidays`

**Description:** Adds a clinic holiday (all doctors unavailable on this date).  
**Auth:** 👑 admin  

**Request Body:**

```json
{
  "date": "2024-12-25",
  "name": "Christmas",
  "description": "Clinic closed"
}
```

**Response `201`:** Returns created holiday object.

---

### `GET /clinic/holidays`

**Description:** Lists all upcoming clinic holidays.  
**Auth:** 🔐 Authenticated  

**Query Params:** `from` (ISO date), `to` (ISO date)

**Response `200`:** Array of holiday objects.

---

## 5. Users / Staff Endpoints

### `GET /users`

**Description:** Lists all users (staff and doctors). Supports filtering by role.  
**Auth:** 👑 admin  

**Query Params:**

| Param | Type | Description |
|---|---|---|
| `role` | string | Filter by `admin \| doctor \| receptionist` |
| `isActive` | boolean | Filter active/inactive |
| `page`, `limit`, `sort`, `order` | — | Pagination |

**Response `200`:** Paginated list of user objects (password excluded).

---

### `POST /users`

**Description:** Admin creates a staff or doctor account. Doctor accounts also create a `doctors` profile.  
**Auth:** 👑 admin  

**Request Body:**

```json
{
  "name": "Dr. Ramesh Kumar",
  "email": "ramesh@clinic.com",
  "phone": "9876500001",
  "role": "doctor",
  "departmentId": "64dep001",
  "password": "Temp@1234",
  "sendWelcomeEmail": true
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | ✅ | |
| `email` | ✅ | Unique |
| `phone` | ✅ | |
| `role` | ✅ | `doctor \| receptionist \| admin` |
| `departmentId` | For doctors | |
| `password` | ✅ | Temporary password; user prompted to change on first login |
| `sendWelcomeEmail` | ❌ | Default `true` |

**Response `201`:** Returns created user (and `doctorId` if role is `doctor`).

---

### `GET /users/:id`

**Description:** Returns a single user by ID.  
**Auth:** 👑 admin  

**Response `200`:** Full user object.

---

### `PUT /users/:id`

**Description:** Updates a user's basic info.  
**Auth:** 👑 admin  

**Request Body:** Any user fields to update (name, phone, departmentId, etc.).

**Response `200`:** Updated user object.

---

### `PUT /users/:id/status`

**Description:** Activates or deactivates a user account.  
**Auth:** 👑 admin  

**Request Body:**

```json
{ "isActive": false, "reason": "On long leave" }
```

**Response `200`:** `{ "success": true, "message": "User deactivated." }`

**Business Rule:** Admin cannot deactivate their own account.

---

### `PUT /users/me/profile`

**Description:** Authenticated user updates their own profile (name, phone, avatar).  
**Auth:** 🔐 Authenticated  

**Request Body:**

```json
{
  "name": "Priya Mehta",
  "phone": "9876500002",
  "avatarUrl": "https://res.cloudinary.com/..."
}
```

**Response `200`:** Updated user profile.

---

## 6. Doctor Endpoints

### `GET /doctors`

**Description:** Lists all active doctors.  
**Auth:** `admin | receptionist`  

**Query Params:** `departmentId`, `isActive`, `page`, `limit`, `sort`, `order`

**Response `200`:** Paginated doctor list.

---

### `POST /doctors`

**Description:** Creates a full doctor profile (linked to an existing user with role `doctor`).  
**Auth:** 👑 admin  

**Request Body:**

```json
{
  "userId": "64usr002",
  "specialization": "Cardiologist",
  "qualifications": ["MBBS", "MD (Cardiology)"],
  "registrationNumber": "MCI-98765",
  "departmentId": "64dep001",
  "consultationFee": 500,
  "slotDurationMinutes": 15,
  "bio": "15+ years experience in cardiac care."
}
```

**Response `201`:** Returns full doctor profile.

---

### `GET /doctors/:id`

**Description:** Returns a single doctor's public profile.  
**Auth:** 🔐 Authenticated  

**Response `200`:** Doctor profile including specialization, qualifications, fees.

---

### `PUT /doctors/:id`

**Description:** Updates a doctor profile.  
**Auth:** 👑 admin  

**Response `200`:** Updated doctor profile.

---

### `DELETE /doctors/:id`

**Description:** Soft-deletes a doctor (sets `isActive: false`).  
**Auth:** 👑 admin  

**Response `200`:** `{ "success": true, "message": "Doctor deactivated." }`

**Business Rule:** Future appointments are flagged; admin must reassign or cancel them.

---

### `GET /doctors/:id/schedule`

**Description:** Returns the doctor's weekly recurring schedule.  
**Auth:** 🔐 Authenticated  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "doctorId": "64doc001",
    "schedule": [
      {
        "day": "monday",
        "isWorking": true,
        "slots": [
          { "start": "09:00", "end": "13:00" },
          { "start": "15:00", "end": "18:00" }
        ]
      }
    ]
  }
}
```

---

### `PUT /doctors/:id/schedule`

**Description:** Updates the doctor's weekly schedule.  
**Auth:** `admin | doctor` (doctor can only update own schedule)  

**Request Body:** Array of day-schedule objects (same shape as GET response).

**Response `200`:** Updated schedule.

---

### `POST /doctors/:id/leaves`

**Description:** Applies a leave period for a doctor.  
**Auth:** `admin | doctor` (doctor applies own leaves)  

**Request Body:**

```json
{
  "fromDate": "2024-12-20",
  "toDate": "2024-12-28",
  "reason": "Personal",
  "isHalfDay": false
}
```

**Response `201`:** Returns created leave record.

**Business Rule:** System automatically flags/cancels appointments in the leave window.

---

### `GET /doctors/:id/leaves`

**Description:** Returns leave records for a doctor.  
**Auth:** `admin | doctor` (doctor sees own leaves)  

**Query Params:** `from`, `to` (ISO dates)

**Response `200`:** Array of leave records.

---

### `DELETE /doctors/:id/leaves/:leaveId`

**Description:** Cancels a doctor's leave.  
**Auth:** `admin | doctor`  

**Response `200`:** `{ "success": true, "message": "Leave cancelled." }`

---

### `GET /doctors/:id/available-slots`

**Description:** Returns available appointment slots for a doctor on a given date.  
**Auth:** 🔐 Authenticated  

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `date` | string | ✅ | ISO date, e.g., `2024-11-20` |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "doctorId": "64doc001",
    "date": "2024-11-20",
    "availableSlots": [
      { "start": "09:00", "end": "09:15", "isBooked": false },
      { "start": "09:15", "end": "09:30", "isBooked": true }
    ]
  }
}
```

**Business Rule:** Returns `[]` if the date falls on a clinic holiday or doctor leave.

---

## 7. Patient Endpoints

### `GET /patients`

**Description:** Lists all patient records (paginated).  
**Auth:** `admin | receptionist`  

**Query Params:** `isActive`, `page`, `limit`, `sort`, `order`

**Response `200`:** Paginated patient list.

---

### `POST /patients`

**Description:** Creates a new patient profile (walk-in registration by staff).  
**Auth:** `admin | receptionist`  

**Request Body:**

```json
{
  "name": "Suresh Nair",
  "phone": "9876543211",
  "email": "suresh@example.com",
  "dateOfBirth": "1980-03-22",
  "gender": "male",
  "bloodGroup": "B+",
  "address": { "city": "Delhi", "state": "Delhi" },
  "emergencyContact": {
    "name": "Meena Nair",
    "phone": "9876540000",
    "relation": "spouse"
  }
}
```

**Response `201`:** Returns created patient profile with generated `patientId`.

---

### `GET /patients/:id`

**Description:** Returns a patient's full profile.  
**Auth:** `admin | receptionist | doctor` (for their patients) `| patient` (self)  

**Response `200`:** Full patient profile.

---

### `PUT /patients/:id`

**Description:** Updates a patient profile.  
**Auth:** `admin | receptionist | patient` (self — limited fields)  

**Response `200`:** Updated patient profile.

---

### `GET /patients/:id/medical-history`

**Description:** Returns a timeline of all visits, diagnoses, prescriptions, and reports.  
**Auth:** `admin | receptionist | doctor | patient` (self)  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "patientId": "64pat001",
    "timeline": [
      {
        "date": "2024-11-01",
        "type": "visit",
        "visitId": "64vis001",
        "doctorName": "Dr. Anjali Singh",
        "diagnosis": "Hypertension",
        "prescriptionId": "64presc001"
      }
    ]
  }
}
```

---

### `GET /patients/:id/appointments`

**Description:** Lists all appointments for a patient.  
**Auth:** `admin | receptionist | doctor | patient` (self)  

**Query Params:** `status`, `page`, `limit`

**Response `200`:** Paginated appointment list.

---

### `GET /patients/:id/prescriptions`

**Description:** Lists all prescriptions for a patient.  
**Auth:** `admin | doctor | patient` (self)  

**Response `200`:** Paginated prescription list.

---

### `GET /patients/:id/reports`

**Description:** Lists all uploaded medical reports for a patient.  
**Auth:** `admin | doctor | patient` (self)  

**Response `200`:** Paginated reports list.

---

### `GET /patients/:id/invoices`

**Description:** Lists all invoices for a patient.  
**Auth:** `admin | receptionist | patient` (self)  

**Response `200`:** Paginated invoices list.

---

### `GET /patients/search`

**Description:** Full-text search across patients by name, phone, or email.  
**Auth:** `admin | receptionist`  

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search query (min 2 chars) |
| `limit` | integer | ❌ | Default 10, max 50 |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    { "id": "64pat001", "name": "Suresh Nair", "phone": "9876543211", "dateOfBirth": "1980-03-22" }
  ]
}
```

---

## 8. Appointment Endpoints

### `GET /appointments`

**Description:** Lists appointments. Doctors see their own; patients see their own; admin/receptionist see all.  
**Auth:** 🔐 Authenticated  

**Query Params:**

| Param | Type | Description |
|---|---|---|
| `doctorId` | string | Filter by doctor |
| `patientId` | string | Filter by patient |
| `status` | string | `scheduled \| completed \| cancelled \| no-show` |
| `date` | string | Filter by date (ISO) |
| `page`, `limit`, `sort`, `order` | — | Pagination |

**Response `200`:** Paginated appointment list.

---

### `POST /appointments`

**Description:** Books a new appointment.  
**Auth:** 🔐 Authenticated  

**Request Body:**

```json
{
  "patientId": "64pat001",
  "doctorId": "64doc001",
  "scheduledDate": "2024-11-20",
  "scheduledTime": "10:00",
  "type": "consultation",
  "reasonForVisit": "Chest pain follow-up",
  "notes": "Patient requests morning slot"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `patientId` | string | ✅ | Valid patient ObjectId |
| `doctorId` | string | ✅ | Valid doctor ObjectId |
| `scheduledDate` | string | ✅ | Future ISO date |
| `scheduledTime` | string | ✅ | `HH:mm`, within doctor working hours |
| `type` | string | ✅ | `consultation \| follow-up \| review` |
| `reasonForVisit` | string | ❌ | Max 500 chars |

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "appointmentId": "64appt001",
    "tokenPreview": null,
    "status": "scheduled",
    "scheduledAt": "2024-11-20T10:00:00+05:30"
  }
}
```

**Business Rules:**
- Checks doctor availability; returns `409 SLOT_UNAVAILABLE` if taken.
- Checks doctor leave and clinic holiday; returns `422 DOCTOR_ON_LEAVE` if applicable.
- Double-booking prevention: same patient, same doctor, same date returns `409 CONFLICT`.
- Reminder notifications scheduled automatically (email/SMS at 24h and 1h before).

---

### `GET /appointments/:id`

**Description:** Returns a single appointment's full details.  
**Auth:** 🔐 Authenticated (role-based access as above)  

**Response `200`:** Full appointment object.

---

### `PUT /appointments/:id`

**Description:** Updates appointment details (e.g., reason, notes).  
**Auth:** `admin | receptionist`  

**Response `200`:** Updated appointment.

---

### `PUT /appointments/:id/cancel`

**Description:** Cancels an appointment.  
**Auth:** `admin | receptionist | patient` (own) `| doctor` (own)  

**Request Body:**

```json
{ "reason": "Patient requested cancellation" }
```

**Response `200`:** `{ "success": true, "message": "Appointment cancelled.", "data": { "refundEligible": true } }`

**Business Rules:**
- Cancellation < 2 hours before scheduled time is non-refundable (configurable).
- Cancelled appointment slot is immediately freed for rebooking.

---

### `PUT /appointments/:id/reschedule`

**Description:** Reschedules an appointment to a new date/time.  
**Auth:** `admin | receptionist | patient` (own)  

**Request Body:**

```json
{
  "newDate": "2024-11-22",
  "newTime": "11:00",
  "reason": "Conflict with work"
}
```

**Response `200`:** Updated appointment with new schedule.

---

### `PUT /appointments/:id/checkin`

**Description:** Marks patient as checked-in. Creates a `visit` record and assigns an OPD token.  
**Auth:** `receptionist`  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "visitId": "64vis001",
    "tokenNumber": 5,
    "queuePosition": 3,
    "estimatedWaitMinutes": 25
  }
}
```

**Business Rule:** One visit/token per appointment per day.

---

### `PUT /appointments/:id/no-show`

**Description:** Marks a patient as no-show for the appointment.  
**Auth:** `receptionist`  

**Response `200`:** `{ "success": true, "message": "Appointment marked as no-show." }`

---

### `GET /appointments/today`

**Description:** Returns all appointments for today across the clinic.  
**Auth:** `admin | receptionist`  

**Query Params:** `doctorId` (optional filter)

**Response `200`:** Array of today's appointment objects with status.

---

### `GET /appointments/calendar`

**Description:** Returns appointments in a date range for calendar view.  
**Auth:** 🔐 Authenticated  

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `doctorId` | string | ❌ | Filter by doctor |
| `start` | string | ✅ | ISO date |
| `end` | string | ✅ | ISO date (max 60 day range) |

**Response `200`:** Array of appointment summaries suitable for calendar rendering.

---

## 9. Visit Endpoints

### `GET /visits`

**Description:** Lists OPD visit records.  
**Auth:** `admin | receptionist`  

**Query Params:** `doctorId`, `patientId`, `date`, `status`, `page`, `limit`

**Response `200`:** Paginated visit list.

---

### `GET /visits/:id`

**Description:** Returns full visit details including token, queue status, and linked consultation.  
**Auth:** `admin | receptionist | doctor`  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "visitId": "64vis001",
    "appointmentId": "64appt001",
    "patientId": "64pat001",
    "doctorId": "64doc001",
    "tokenNumber": 5,
    "status": "in-consultation",
    "checkInTime": "2024-11-20T09:45:00Z",
    "consultationId": "64cons001"
  }
}
```

---

### `PUT /visits/:id/status`

**Description:** Updates a visit's status.  
**Auth:** `admin | receptionist | doctor`  

**Request Body:**

```json
{ "status": "completed" }
```

Allowed status values: `waiting | called | in-consultation | completed | cancelled`

**Response `200`:** Updated visit object.

---

### `GET /visits/active-today`

**Description:** Returns all visits currently in progress today (waiting/in-consultation).  
**Auth:** `admin | receptionist`  

**Response `200`:** Array of active visit objects.

---

## 10. Queue Endpoints

### `GET /queue/:doctorId`

**Description:** Returns the current live queue for a doctor.  
**Auth:** `admin | receptionist | doctor`  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "doctorId": "64doc001",
    "currentToken": 5,
    "queue": [
      {
        "entryId": "64qe001",
        "tokenNumber": 5,
        "patientId": "64pat001",
        "patientName": "Suresh Nair",
        "status": "called",
        "priority": "normal",
        "checkInTime": "2024-11-20T09:45:00Z",
        "estimatedWaitMinutes": 0
      },
      {
        "entryId": "64qe002",
        "tokenNumber": 6,
        "patientName": "Priya Mehta",
        "status": "waiting",
        "priority": "emergency",
        "estimatedWaitMinutes": 5
      }
    ]
  }
}
```

**Note:** Also updated in real-time via Socket.IO `queue:updated` event.

---

### `POST /queue/walkin`

**Description:** Registers a walk-in patient directly into the queue (no prior appointment needed). Creates patient record if new, creates visit + queue entry.  
**Auth:** `receptionist`  

**Request Body:**

```json
{
  "patientId": "64pat001",
  "doctorId": "64doc001",
  "reasonForVisit": "Fever",
  "priority": "normal"
}
```

| Field | Required | Notes |
|---|---|---|
| `patientId` | ✅ | Existing patient, or use `POST /patients` first |
| `doctorId` | ✅ | |
| `reasonForVisit` | ❌ | |
| `priority` | ❌ | `normal` (default) \| `emergency` |

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "entryId": "64qe003",
    "tokenNumber": 7,
    "queuePosition": 3,
    "estimatedWaitMinutes": 30
  }
}
```

---

### `PUT /queue/:entryId/call-next`

**Description:** Marks the current patient as "called" and advances the queue.  
**Auth:** `doctor | receptionist`  

**Response `200`:** Returns the entry that was called.

---

### `PUT /queue/:entryId/priority`

**Description:** Changes a queue entry's priority (e.g., to emergency for critical patients).  
**Auth:** `admin | doctor`  

**Request Body:**

```json
{ "priority": "emergency", "reason": "Severe chest pain" }
```

**Response `200`:** Updated queue entry. Emits `queue:priority_changed` Socket.IO event.

---

### `PUT /queue/:entryId/complete`

**Description:** Marks a queue entry as completed (consultation done).  
**Auth:** `doctor | receptionist`  

**Response `200`:** `{ "success": true, "message": "Visit completed." }`

---

### `PUT /queue/:entryId/skip`

**Description:** Skips a patient in the queue (patient not present when called).  
**Auth:** `doctor | receptionist`  

**Response `200`:** Returns updated queue order.

---

## 11. Consultation & Prescription Endpoints

### `GET /consultations/:visitId`

**Description:** Returns consultation notes for a visit.  
**Auth:** `admin | doctor | patient` (own)  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "visitId": "64vis001",
    "chiefComplaint": "Persistent headache for 3 days",
    "history": "No prior diagnosis",
    "vitals": {
      "bloodPressure": "130/85",
      "pulse": 78,
      "temperature": 98.6,
      "weight": 72,
      "height": 170,
      "oxygenSaturation": 98
    },
    "diagnosis": "Tension headache",
    "treatmentPlan": "Rest, paracetamol, reduce screen time",
    "notes": "Follow up in 1 week if symptoms persist",
    "createdAt": "2024-11-20T10:30:00Z"
  }
}
```

---

### `POST /consultations/:visitId`

**Description:** Creates a new consultation record for a visit.  
**Auth:** 👨‍⚕️ doctor  

**Request Body:**

```json
{
  "chiefComplaint": "Persistent headache for 3 days",
  "history": "No prior diagnosis",
  "vitals": {
    "bloodPressure": "130/85",
    "pulse": 78,
    "temperature": 98.6,
    "weight": 72,
    "height": 170,
    "oxygenSaturation": 98
  },
  "diagnosis": "Tension headache",
  "treatmentPlan": "Rest, paracetamol",
  "notes": "Follow up in 1 week if symptoms persist",
  "icdCodes": ["G44.2"]
}
```

**Response `201`:** Returns created consultation.

**Business Rule:** Only one consultation per visit. Returns `409 CONFLICT` if already exists (use PUT to update).

---

### `PUT /consultations/:visitId`

**Description:** Updates an existing consultation.  
**Auth:** 👨‍⚕️ doctor (own consultation only)  

**Request Body:** Any fields from POST body.

**Response `200`:** Updated consultation.

**Business Rule:** Editable only on the same day as the visit (configurable grace period).

---

### `POST /prescriptions/:visitId`

**Description:** Creates a prescription for a visit.  
**Auth:** 👨‍⚕️ doctor  

**Request Body:**

```json
{
  "medicines": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "frequency": "3 times a day",
      "duration": "5 days",
      "instructions": "After meals",
      "quantity": 15
    }
  ],
  "advice": "Rest for 2 days. Avoid cold beverages.",
  "followUpDate": "2024-11-27",
  "isDigitallySigned": true
}
```

**Response `201`:** Returns prescription with auto-generated `prescriptionNumber`.

---

### `GET /prescriptions/:id`

**Description:** Returns a prescription by ID.  
**Auth:** `admin | doctor | patient` (own)  

**Response `200`:** Full prescription object.

---

### `GET /prescriptions/:id/pdf`

**Description:** Generates and streams a PDF of the prescription.  
**Auth:** `admin | doctor | patient` (own)  

**Response `200`:**  
- `Content-Type: application/pdf`  
- `Content-Disposition: attachment; filename="prescription_<id>.pdf"`

---

### `PUT /prescriptions/:id`

**Description:** Updates a prescription (e.g., corrections).  
**Auth:** 👨‍⚕️ doctor (own prescription only)  

**Business Rule:** An audit trail entry is created for every prescription edit.

---

## 12. Medical Report Endpoints

### `GET /reports/patient/:patientId`

**Description:** Lists all uploaded medical reports for a patient.  
**Auth:** `admin | doctor | patient` (self)  

**Query Params:** `type` (e.g., `lab`, `radiology`, `ecg`), `page`, `limit`

**Response `200`:** Paginated list of report metadata.

---

### `POST /reports/patient/:patientId`

**Description:** Uploads a medical report (PDF or image) for a patient.  
**Auth:** `doctor | admin`  
**Content-Type:** `multipart/form-data`  

**Request Form Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | PDF/JPEG/PNG, max 10 MB |
| `reportType` | string | ✅ | `lab \| radiology \| ecg \| other` |
| `reportDate` | string | ✅ | ISO date |
| `title` | string | ✅ | Report title |
| `description` | string | ❌ | Additional notes |

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "reportId": "64rep001",
    "fileUrl": "https://res.cloudinary.com/...",
    "mimeType": "application/pdf",
    "reportType": "lab",
    "title": "CBC Blood Test",
    "reportDate": "2024-11-20"
  }
}
```

---

### `GET /reports/:id`

**Description:** Returns a single report's metadata and signed file URL.  
**Auth:** `admin | doctor | patient` (own)  

**Response `200`:** Report metadata + signed Cloudinary URL valid for 1 hour.

---

### `DELETE /reports/:id`

**Description:** Soft-deletes a medical report.  
**Auth:** 👑 admin  

**Response `200`:** `{ "success": true, "message": "Report deleted." }`

---

## 13. Follow-up Endpoints

### `GET /followups`

**Description:** Lists follow-up reminders.  
**Auth:** `doctor` (own) | `admin` (all)  

**Query Params:** `patientId`, `doctorId`, `status` (`pending | completed | overdue`), `dueDate`, `page`, `limit`

**Response `200`:** Paginated follow-up list.

---

### `POST /followups`

**Description:** Creates a follow-up reminder for a patient.  
**Auth:** 👨‍⚕️ doctor  

**Request Body:**

```json
{
  "patientId": "64pat001",
  "visitId": "64vis001",
  "dueDate": "2024-11-27",
  "notes": "Review blood pressure readings",
  "notifyPatient": true
}
```

**Response `201`:** Returns created follow-up. Notification sent to patient if `notifyPatient: true`.

---

### `PUT /followups/:id`

**Description:** Updates a follow-up (reschedule or mark complete).  
**Auth:** `doctor | admin`  

**Request Body:**

```json
{
  "dueDate": "2024-11-29",
  "status": "completed",
  "completionNotes": "Patient reviewed, BP normalized."
}
```

**Response `200`:** Updated follow-up.

---

### `DELETE /followups/:id`

**Description:** Deletes a follow-up reminder.  
**Auth:** `doctor | admin`  

**Response `200`:** `{ "success": true, "message": "Follow-up removed." }`

---

## 14. Billing & Payment Endpoints

### `GET /invoices`

**Description:** Lists invoices. Admin/receptionist see all; patients see own.  
**Auth:** `admin | receptionist | patient` (own)  

**Query Params:** `patientId`, `status` (`draft | issued | paid | partially-paid | cancelled`), `from`, `to`, `page`, `limit`

**Response `200`:** Paginated invoice list.

---

### `POST /invoices`

**Description:** Creates a new invoice for a visit/consultation.  
**Auth:** `admin | receptionist`  

**Request Body:**

```json
{
  "patientId": "64pat001",
  "visitId": "64vis001",
  "lineItems": [
    { "description": "Consultation Fee", "amount": 500, "quantity": 1 },
    { "description": "ECG", "amount": 300, "quantity": 1 }
  ],
  "discountPercent": 10,
  "taxPercent": 18,
  "notes": "Insurance claim eligible"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "invoiceId": "64inv001",
    "invoiceNumber": "INV-2024-0042",
    "subtotal": 800,
    "discount": 80,
    "tax": 129.6,
    "total": 849.6,
    "status": "issued",
    "dueDate": "2024-11-27"
  }
}
```

---

### `GET /invoices/:id`

**Description:** Returns full invoice details.  
**Auth:** `admin | receptionist | patient` (own)  

**Response `200`:** Full invoice object with line items.

---

### `GET /invoices/:id/pdf`

**Description:** Generates and streams invoice PDF.  
**Auth:** `admin | receptionist | patient` (own)  

**Response `200`:**  
- `Content-Type: application/pdf`  
- `Content-Disposition: attachment; filename="invoice_INV-2024-0042.pdf"`

---

### `PUT /invoices/:id`

**Description:** Updates an invoice (adjust items, apply discount, change status).  
**Auth:** `admin | receptionist`  

**Business Rule:** Invoices with status `paid` cannot be edited; must issue a credit note.

**Response `200`:** Updated invoice.

---

### `POST /payments`

**Description:** Records a payment against an invoice.  
**Auth:** `admin | receptionist`  

**Request Body:**

```json
{
  "invoiceId": "64inv001",
  "amount": 849.6,
  "method": "upi",
  "transactionRef": "UPI-TXN-9876543",
  "paidAt": "2024-11-20T11:00:00Z",
  "notes": "Full payment"
}
```

| Field | Required | Validation |
|---|---|---|
| `invoiceId` | ✅ | Valid invoice ObjectId |
| `amount` | ✅ | Positive number, ≤ outstanding amount |
| `method` | ✅ | `cash \| card \| upi \| netbanking \| insurance \| other` |
| `transactionRef` | ❌ | Required for non-cash methods |
| `paidAt` | ❌ | ISO datetime, default now |

**Response `201`:** Returns payment record. Invoice status updated automatically (`paid` or `partially-paid`).

---

### `GET /payments/:invoiceId`

**Description:** Returns all payment transactions for an invoice.  
**Auth:** `admin | receptionist | patient` (own)  

**Response `200`:** Array of payment records with method, amount, date.

---

## 15. Notification Endpoints

### `GET /notifications`

**Description:** Returns the authenticated user's notifications.  
**Auth:** 🔐 Authenticated  

**Query Params:** `isRead` (boolean), `page`, `limit`

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "64notif001",
      "type": "appointment_reminder",
      "title": "Appointment Reminder",
      "body": "Your appointment with Dr. Anjali Singh is tomorrow at 10:00 AM.",
      "isRead": false,
      "createdAt": "2024-11-19T10:00:00Z"
    }
  ],
  "pagination": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### `PUT /notifications/:id/read`

**Description:** Marks a notification as read.  
**Auth:** 🔐 Authenticated  

**Response `200`:** `{ "success": true, "data": { "id": "64notif001", "isRead": true } }`

**Business Rule:** Users can only mark their own notifications as read.

---

## 16. Analytics Endpoints

> All analytics endpoints are restricted to `admin`. Accepts `from` and `to` query params (ISO dates). Default range: last 30 days.

---

### `GET /analytics/overview`

**Description:** High-level dashboard metrics.  
**Auth:** 👑 admin  

**Query Params:** `from`, `to`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "period": { "from": "2024-11-01", "to": "2024-11-30" },
    "totalPatients": 320,
    "newPatients": 48,
    "totalAppointments": 540,
    "completedConsultations": 490,
    "totalRevenue": 245000,
    "averageWaitTimeMinutes": 18,
    "occupancyRate": 82.5
  }
}
```

---

### `GET /analytics/appointments`

**Description:** Appointment statistics broken down by status, doctor, and day.  
**Auth:** 👑 admin  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "byStatus": { "scheduled": 10, "completed": 490, "cancelled": 32, "no-show": 8 },
    "byDay": [ { "date": "2024-11-01", "count": 18 } ],
    "byDoctor": [ { "doctorId": "64doc001", "name": "Dr. Anjali Singh", "count": 95 } ]
  }
}
```

---

### `GET /analytics/revenue`

**Description:** Revenue breakdown by period, payment method, and doctor.  
**Auth:** 👑 admin  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "totalRevenue": 245000,
    "collected": 230000,
    "outstanding": 15000,
    "byMethod": { "cash": 90000, "upi": 110000, "card": 30000 },
    "byDay": [ { "date": "2024-11-01", "revenue": 8500 } ]
  }
}
```

---

### `GET /analytics/doctors`

**Description:** Per-doctor performance: consultations, revenue, avg consultation time.  
**Auth:** 👑 admin  

**Response `200`:** Array of per-doctor stats.

---

### `GET /analytics/patients`

**Description:** Patient acquisition stats: new vs returning, demographics.  
**Auth:** 👑 admin  

**Response `200`:** Patient demographic breakdown and growth metrics.

---

### `GET /analytics/queue`

**Description:** Queue efficiency metrics: average wait time, peak hours, skip/no-show rates.  
**Auth:** 👑 admin  

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "averageWaitMinutes": 18,
    "peakHour": "10:00–11:00",
    "skipRate": 4.2,
    "emergencyCount": 7,
    "byDoctor": [ { "doctorId": "64doc001", "avgWait": 14 } ]
  }
}
```

---

## 17. Audit Log Endpoints

### `GET /audit-logs`

**Description:** Returns a paginated, filterable list of audit log entries covering all sensitive actions in the system.  
**Auth:** 👑 admin  

**Query Params:**

| Param | Type | Description |
|---|---|---|
| `userId` | string | Filter by acting user |
| `action` | string | e.g., `CREATE_PATIENT`, `UPDATE_PRESCRIPTION`, `DELETE_REPORT` |
| `resource` | string | Resource type, e.g., `patient`, `invoice` |
| `resourceId` | string | Specific resource ObjectId |
| `from` | string | ISO datetime |
| `to` | string | ISO datetime |
| `page`, `limit`, `sort`, `order` | — | Pagination |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "64audit001",
      "userId": "64usr001",
      "userName": "Admin User",
      "action": "UPDATE_PRESCRIPTION",
      "resource": "prescription",
      "resourceId": "64presc001",
      "ipAddress": "192.168.1.10",
      "userAgent": "Mozilla/5.0 ...",
      "changes": {
        "before": { "medicines[0].dosage": "1 tablet" },
        "after":  { "medicines[0].dosage": "2 tablets" }
      },
      "timestamp": "2024-11-20T11:05:00Z"
    }
  ],
  "pagination": { "total": 2850, "page": 1, "limit": 20, "totalPages": 143 }
}
```

**Business Rule:** Audit logs are **immutable** — no update or delete endpoints exist. Retained for minimum 5 years per regulatory policy.

---

*End of Smart OPD API Documentation v1.0.0*

> **Document generated for:** Smart OPD MERN-stack Clinic Management Platform  
> **Maintained by:** Engineering Team  
> **Review cycle:** Quarterly or on each breaking API change
