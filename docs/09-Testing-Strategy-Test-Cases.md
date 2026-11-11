# Smart OPD – Testing Strategy & Test Cases
## Single-Clinic Outpatient Department Management System

> **Document ID:** 09-Testing-Strategy-Test-Cases.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Testing Toolchain:** Jest 29 + Supertest (Backend) · Vitest + Testing Library (Frontend) · Playwright (E2E) · k6 (Load & Concurrency) · MongoMemoryServer (In-Memory Isolation)  
> **Target Quality Gates:** ≥ 85% Code Coverage · Zero High/Critical Security Flaws · p95 API Latency < 300ms  

---

## 1. Testing Pyramid & Multi-Layer Strategy

The Smart OPD quality assurance architecture enforces rigorous validation across all layers of the stack:

```
                  ┌───────────────────────┐
                  │    E2E Tests (10%)    │  Playwright Cross-Role Journeys
                  ├───────────────────────┤
                  │ Integration Tests (30%)│ Supertest + MongoMemoryServer
                  ├───────────────────────┤
                  │   Unit Tests (60%)    │  Jest / Vitest (Logic, Slots, Rx)
                  └───────────────────────┘
```

### 1.1 Scope of Test Coverage
- **Frontend Testing**: Vitest + React Testing Library verifying shadcn/ui components, React Hook Form + Zod schema validation, debounced search, optimistic live queue updates, role-based route guards, and responsive layouts.
- **Backend Testing**: Jest + TypeScript testing business services, slot generation algorithms, the multi-factor doctor auto-allocation engine ($W_i$), sequential daily token resets, and tax/discount financial math.
- **API Integration Testing**: Supertest against ephemeral in-memory MongoDB (`mongodb-memory-server`) verifying REST contracts, HTTP status codes, and RFC 7807 error envelopes.
- **Database & Concurrency Testing**: MongoDB schema validation, compound unique indexes, and multi-document ACID transactions under simulated concurrent booking races.
- **WebSocket Testing**: Socket.IO client connections verifying room joins, live queue calls, emergency alerts, and auto-reconnect resilience.
- **Security Testing**: Penetration test suites targeting Insecure Direct Object References (IDOR), NoSQL injection, Cross-Site Scripting (XSS), JWT session tampering, and brute-force lockouts.
- **Performance & Load Testing**: k6 scripts testing 50 concurrent virtual users executing slot queries and bookings.

---

## 2. Comprehensive Test Cases Catalog (60+ Test Cases)

### 2.1 Suite 01: Authentication, Session & Password Security

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-AUTH-01** | Backend | Successful patient registration | Valid name, phone, password, consent | 201 Created, User + Patient created, UHID issued | Auto-generates correct format `OPD-YYMM-XXXXX` |
| **TC-AUTH-02** | Backend | Reject duplicate phone registration | Phone number already in database | 409 Conflict with code `PHONE_ALREADY_REGISTERED` | Case-insensitive & stripped whitespace validation |
| **TC-AUTH-03** | Backend | Password hashing with bcrypt cost 12 | Password: `Password@123` | Password hash in DB starts with `$2b$12$` | Plaintext password never stored or logged |
| **TC-AUTH-04** | API | Login with valid credentials | Correct phone/email and password | 200 OK, returns access JWT (15m), sets httpOnly cookie | Refresh token is signed, Secure, SameSite=Strict |
| **TC-AUTH-05** | API | Login with incorrect password | Valid phone, incorrect password | 401 Unauthorized, increments `failedLoginAttempts` | Generic message to prevent user enumeration |
| **TC-AUTH-06** | Security | Brute-force lockout after 5 failures | 5 consecutive bad login attempts | 423 Locked with `lockUntil` timestamp (30m) | Resets failure counter on successful login |
| **TC-AUTH-07** | API | Refresh token rotation | Valid refresh token cookie | 200 OK, new access JWT issued, old refresh invalidated | Prevents token reuse across multiple devices |
| **TC-AUTH-08** | Security | Refresh token reuse detection | Submit already-rotated refresh token | 401 Unauthorized, invalidates all sessions for user | Shuts down compromised token replay attacks |
| **TC-AUTH-09** | API | Logout clears session cookie | Authenticated user clicks logout | 200 OK, `refreshToken` cookie set to maxAge=0 | Session invalidated server-side |
| **TC-AUTH-10** | Security | Password reset single-use token | Request password reset email | Signed reset token valid for 15m; invalid on reuse | Token invalidated immediately upon password change |

---

### 2.2 Suite 02: Role-Based Access Control (RBAC) & IDOR Security

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-RBAC-01** | Security | Doctor accessing Admin revenue analytics | Authenticated as DOCTOR on `/analytics/revenue` | 403 Forbidden with `INSUFFICIENT_PRIVILEGES` | Middleware blocks before controller execution |
| **TC-RBAC-02** | Security | Receptionist accessing clinical notes | Authenticated as RECEPTIONIST on `/consultations` | 403 Forbidden | Protects doctor-patient clinical privacy |
| **TC-RBAC-03** | Security | Patient accessing another's medical records | Authenticated as PATIENT with foreign `patientId` | 403 Forbidden (Object-level IDOR Guard) | Validates `req.user.patientProfileId === params.id` |
| **TC-RBAC-04** | Security | Receptionist attempting to delete audit logs | Authenticated as RECEPTIONIST calling `DELETE /audit-logs` | 405 Method Not Allowed / 404 Route Not Found | Zero delete endpoints exposed in API |
| **TC-RBAC-05** | Security | Unauthenticated request to protected route | No Authorization header on `GET /patients` | 401 Unauthorized (`AUTHENTICATION_REQUIRED`) | Missing, expired, and malformed JWT rejected |
| **TC-RBAC-06** | Security | Forged JWT signature rejected | JWT signed with wrong secret key | 401 Unauthorized (`INVALID_TOKEN_SIGNATURE`) | Tampered payloads rejected by jsonwebtoken |

---

### 2.3 Suite 03: Doctor Availability & Slot Generation Engine

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-SLOT-01** | Unit | Slot generator computes 15-minute slots | Shift 09:00 to 11:00, duration 15m | Returns 8 discrete slots (09:00, 09:15, ... 10:45) | Exact boundary alignment at start/end |
| **TC-SLOT-02** | Unit | Slot generator excludes lunch break | Shift 09:00–17:00, break 13:00–14:00 | Slots between 13:00–14:00 flagged `LUNCH_BREAK` | Prevents patient booking during physician break |
| **TC-SLOT-03** | Integration | Slot generator marks booked slots unavailable | 10:15 slot has confirmed appointment | 10:15 slot returns `isAvailable: false, reason: 'BOOKED'` | Reflects real-time database state |
| **TC-SLOT-04** | Integration | Approved doctor leave invalidates all slots | Doctor has approved leave on target date | All slots for target date return `isAvailable: false` | Accounts for both single-day and multi-day leaves |
| **TC-SLOT-05** | Unit | Clinic holiday blocks all doctor slots | Target date is clinic holiday in settings | Returns empty slot array with `CLINIC_CLOSED` alert | Prevents booking on recognized holidays |
| **TC-SLOT-06** | Unit | Booking outside doctor shift rejected | Slot requested at 22:00 (outside shift) | 400 Validation Error (`SLOT_OUTSIDE_WORKING_HOURS`) | Enforces shift boundary checks |

---

### 2.4 Suite 04: Appointment Scheduling & Concurrency Race Testing

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-APPT-01** | API | Successful standard appointment booking | Open slot 10:15 AM, valid patient | 201 Created, status CONFIRMED, slot locked | Dispatches SMS & Email confirmation |
| **TC-APPT-02** | Concurrency | **Concurrent booking race (50 requests)** | 50 simultaneous POSTs for same doctor & slot | Exactly 1 commits (201); 49 fail (409 Conflict) | Multi-document ACID session & unique compound index |
| **TC-APPT-03** | API | Cancellation within policy grace period | Cancel > 4 hours prior to slot | 200 OK, status CANCELLED, slot freed for re-booking | Slot immediately becomes available in slot query |
| **TC-APPT-04** | API | Cancellation after cutoff rejected | Cancel < 4 hours prior to slot | 400 Bad Request (`CANCELLATION_CUTOFF_EXCEEDED`) | Enforces clinic policy window |
| **TC-APPT-05** | API | Reschedule appointment to new date/time | Valid alternate open slot | Old slot freed, new slot reserved, status CONFIRMED | Atomic multi-document swap in single transaction |
| **TC-APPT-06** | API | Booking in the past rejected | Target date = yesterday | 400 Validation Error (`CANNOT_BOOK_PAST_DATE`) | Timezone-aware date normalization |
| **TC-APPT-07** | API | Booking beyond max advance window rejected | Target date = Today + 30 days (> 14d limit) | 400 Validation Error (`EXCEEDS_MAX_ADVANCE_WINDOW`) | Enforces configurable clinic booking window |
| **TC-APPT-08** | Integration | Doctor leave conflict resolution | Doctor logs approved leave for tomorrow | Affected appointments set to `SCHEDULE_CONFLICT_LEAVE`, SMS alerts dispatched | Proactive rescheduling link delivered to patients |

---

### 2.5 Suite 05: Smart Specialist Doctor Auto-Allocation Engine

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-ALLOC-01**| Unit | Lowest-workload specialist selection | Dr. A ($W_i=0.34$), Dr. B ($W_i=0.78$) | Engine selects Dr. A as recommended specialist | Deterministic mathematical ranking |
| **TC-ALLOC-02**| Unit | Multi-factor workload calculation | $A_{conf}=4, Q_{wait}=2, C_{act}=1, T_{rem}=180$ | $W_i$ computed accurately according to formula | Weights applied ($w_a=1.0, w_q=1.25, w_c=1.5$) |
| **TC-ALLOC-03**| Integration | Specialty matching strictness | Request specialty "Pediatrics" | Only active verified pediatricians evaluated | Disqualifies doctors from other departments |
| **TC-ALLOC-04**| Integration | Doctor on leave excluded from allocation | Dr. A marked leave on target date | Dr. A disqualified, Dr. B selected | Validates leave calendar before workload scoring |
| **TC-ALLOC-05**| Integration | Daily capacity ceiling saturation | Dr. A has reached `maxDailyPatients` (25) | Dr. A disqualified, next best candidate assigned | Prevents physician burnout and overbooking |
| **TC-ALLOC-06**| Integration | Visiting consultant opted-out of auto-alloc | Dr. Senior has `isAutoAllocatable = false` | Excluded from auto-allocation, available for manual | Reserved for private elective specialists |
| **TC-ALLOC-07**| API | Atomic auto-allocation booking | POST `/appointments/auto-allocate` | 201 Created with assigned doctor details | Single transaction: scores, selects, and locks slot |
| **TC-ALLOC-08**| API | Receptionist manual override with reason | Receptionist selects alternate Dr. B | 201 Created, `method: RECEPTIONIST_OVERRIDE` | Mandatory `overrideReasonCode` validated |
| **TC-ALLOC-09**| API | Receptionist override without reason rejected | Override submitted without reason code | 400 Bad Request (`OVERRIDE_REASON_REQUIRED`) | Enforces audit compliance |
| **TC-ALLOC-10**| Integration | Dynamic recalculation on patient check-in | Patient checks in for Dr. A | Dr. A's $W_i$ increases; next allocation favors Dr. B | Dynamic load balancing in real time |

---

### 2.6 Suite 06: OPD Check-In & Sequential Token Generation

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-QUE-01** | Integration | Physical check-in generates sequential token | Confirmed appointment for today | Visit created, QueueEntry created with Token #1 | Token allocated only upon physical arrival |
| **TC-QUE-02** | Unit | Daily token counter resets at midnight | First check-in on a new day | Token number = 1 | Daily reset partitioned by `doctorId + queueDate` |
| **TC-QUE-03** | Integration | Sequential token incrementing | 3 patients check in on same day | Assigned Tokens #1, #2, #3 sequentially | Atomic sequence counter prevents duplicate tokens |
| **TC-QUE-04** | Integration | Walk-in patient token generation | Unscheduled walk-in patient | Visit created, next FIFO token assigned | Integrated with auto-allocation engine |
| **TC-QUE-05** | Socket | Doctor calls next patient | Doctor clicks "Call Next" | Status = CALLED, Socket.IO emits `queue:called` | Broadcasts room number & patient name to TV |
| **TC-QUE-06** | Socket | Emergency priority queue bump | Clinician triggers Emergency | Token = "EMERGENCY-01", priorityOrder = 1 | Moves to head of queue without altering numbers |
| **TC-QUE-07** | Integration | Skip absent patient | Patient absent on 3rd call | Status = SKIPPED, removed from immediate queue | Can be recalled by receptionist later |
| **TC-QUE-08** | Socket | Complete consultation updates queue | Doctor finalizes prescription | Status = COMPLETED, waiting count decrements on TV | Triggers real-time waiting room counter update |
| **TC-QUE-09** | Privacy | TV display payload masks patient identity | Doctor calls next token | WebSocket event payload contains `maskedPatientName: "RAHUL M."` | Enforces DPDP Act Section 6 (zero full name or medical condition) |

---

### 2.7 Suite 07: Clinical Consultation & Vector PDFKit Streaming

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-RX-01** | API | Save consultation with vitals & diagnosis | BP 120/80, Pulse 74, Temp 98.6°F | 201 Created, Prescription saved to database | Validates systolic > diastolic |
| **TC-RX-02** | Unit | Prescription requires at least 1 medicine | Empty medications array | 400 Validation Error (`AT_LEAST_ONE_MEDICATION`) | Rejects empty prescription records |
| **TC-RX-03** | Unit | PDFKit vector prescription generation | Valid prescription payload | Streams binary buffer with `%PDF-1.4` magic bytes | Generates vector typography under 100ms |
| **TC-RX-04** | Security | Cryptographic verification QR code in PDF | Inspect generated prescription PDF | Contains QR code resolving to signed JWT verify URL | Pharmacist scanning verifies authenticity |
| **TC-RX-05** | Security | Clinical consultation immutability | Attempt `PUT /prescriptions/:id` | 405 Method Not Allowed / Immutable Error | Past clinical records cannot be overwritten |
| **TC-RX-06** | Frontend | High-visibility allergy alert badge | Patient has documented allergy | Bright red badge rendered in doctor header | Renders before doctor writes medications |

---

### 2.8 Suite 08: Billing, POS Cashier & Payment Settlements

| Test ID | Subsystem | Test Description | Preconditions & Inputs | Expected Result | Edge Case / Risk Handled |
|---|---|---|---|---|---|
| **TC-BILL-01**| Integration | Invoice auto-populates consultation fee | Visit with Dr. Sharma (fee ₹500) | Line item created with ₹500 | Dynamically fetched from doctor master profile |
| **TC-BILL-02**| Unit | Itemized invoice calculation | Consult ₹500 + ECG ₹300 + Dressing ₹100 | Subtotal = ₹900, Net Total = ₹900 | Decimal rounding precision to 2 decimal places |
| **TC-BILL-03**| Unit | Authorized percentage discount calculation | ₹900 total with 10% discount | Discount = ₹90, Net Payable = ₹810 | Requires administrative authorization flag |
| **TC-BILL-04**| Integration | Full Cash payment settlement | Cash payment of ₹810 | Invoice status = PAID, balanceDue = 0 | Creates Payment record linked to invoice |
| **TC-BILL-05**| Integration | Split payment settlement | Partial payment of ₹500 on ₹810 bill | Status = PARTIALLY_PAID, balanceDue = ₹310 | Balance carries forward accurately |
| **TC-BILL-06**| API | Itemized money receipt PDF stream | Paid invoice | Streams printable A5/A4 PDF receipt | Includes clinic GSTIN and invoice number |
| **TC-BILL-07**| Security | Discount rejected without Admin authorization | Receptionist submits discount without Admin PIN | 403 Forbidden (`ADMIN_AUTHORIZATION_REQUIRED`) | Enforces financial controls and audit compliance |

---

## 3. End-to-End (E2E) Automation Test Journeys (Playwright)

### Journey 01: Complete Outpatient Lifecycle Journey
*Tests the complete patient journey from online booking through check-in, doctor consultation, digital prescription, and final cashier billing.*

```typescript
import { test, expect } from '@playwright/test';

test.describe('End-to-End Outpatient Lifecycle Journey', () => {
  test('Complete journey from booking to prescription and checkout', async ({ browser }) => {
    // 1. Patient Books Online via Auto-Allocation
    const patientContext = await browser.newContext();
    const patientPage = await patientContext.newPage();
    await patientPage.goto('http://localhost:5173/portal/book');
    await patientPage.click('text=General Medicine');
    await patientPage.click('input[value="AUTOMATIC"]'); // Smart Auto-Allocation
    await patientPage.click('[data-testid="date-2026-11-12"]');
    await patientPage.click('[data-testid="slot-10-15"]');
    await patientPage.click('button:has-text("Confirm Booking")');
    await expect(patientPage.locator('.alert-success')).toContainText('Appointment Confirmed');
    await expect(patientPage.locator('[data-testid="assigned-doctor"]')).toContainText('Dr. Rajesh Sharma');

    // 2. Receptionist Checks In Patient & Issues Token
    const receptionContext = await browser.newContext();
    const receptionPage = await receptionContext.newPage();
    await receptionPage.goto('http://localhost:5173/reception');
    await receptionPage.fill('input[placeholder*="Search"]', '9876543210');
    await receptionPage.click('button:has-text("Check-In & Issue Token")');
    await expect(receptionPage.locator('[data-testid="assigned-token"]')).toContainText('Token #');

    // 3. Doctor Calls Patient & Generates Vector PDF Rx
    const doctorContext = await browser.newContext();
    const doctorPage = await doctorContext.newPage();
    await doctorPage.goto('http://localhost:5173/doctor');
    await doctorPage.click('button:has-text("CALL NEXT ▶")');
    await expect(doctorPage.locator('[data-testid="active-patient-header"]')).toContainText('Rahul Mehta');
    await doctorPage.fill('textarea[name="chiefComplaints"]', 'Fever for 3 days, cough');
    await doctorPage.fill('input[name="diagnosis"]', 'Acute Viral Pharyngitis (J06.9)');
    await doctorPage.click('button:has-text("+ Add Medication")');
    await doctorPage.fill('input[placeholder="Drug Name"]', 'Tab. Paracetamol 650mg');
    await doctorPage.click('button:has-text("Preview & Sign Rx")');
    await expect(doctorPage.locator('iframe[title="PDF Preview"]')).toBeVisible();
    await doctorPage.click('button:has-text("Finalize Encounter")');

    // 4. Receptionist Cashier Settles Invoice via UPI QR
    await receptionPage.goto('http://localhost:5173/reception/billing');
    await receptionPage.click('tr:has-text("Rahul Mehta") >> button:has-text("Collect Payment")');
    await receptionPage.click('button:has-text("UPI QR")');
    await receptionPage.click('button:has-text("Confirm Settlement")');
    await expect(receptionPage.locator('.badge-paid')).toBeVisible();
  });
});
```

---

## 4. Performance & Concurrency Load Test (k6 Script)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete under 300ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

export default function () {
  // Test slot query performance
  const res = http.get('http://localhost:5000/api/v1/doctors/6731ecb01234567890doc001/available-slots?date=2026-11-12');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'slots returned': (r) => JSON.parse(r.body).data.slots.length > 0,
  });
  sleep(1);
}
```
