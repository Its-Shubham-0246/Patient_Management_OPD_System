# Smart OPD — Testing Strategy & Test Plan

**Document version:** 1.0  
**Status:** Approved for Implementation  
**Tech stack:** Node.js · Express · TypeScript · MongoDB · React · Socket.IO  
**Test tools:** Jest · ts-jest · Supertest · mongodb-memory-server · Vitest · React Testing Library · Playwright · k6

---

## Table of Contents

1. [Testing Philosophy & Goals](#1-testing-philosophy--goals)
2. [Test Types & Tools](#2-test-types--tools)
   - [Unit Tests — Backend](#21-unit-tests--backend)
   - [Integration Tests — Backend API](#22-integration-tests--backend-api)
   - [Frontend Unit Tests](#23-frontend-unit-tests)
   - [End-to-End Tests](#24-end-to-end-tests)
   - [Socket.IO Tests](#25-socketio-tests)
3. [Security Testing](#3-security-testing)
4. [Performance Testing](#4-performance-testing)
5. [Test Data Management](#5-test-data-management)
6. [CI/CD Integration](#6-cicd-integration)
7. [Bug Tracking & Regression](#7-bug-tracking--regression)
8. [QA Checklist per Phase](#8-qa-checklist-per-phase)

---

## 1. Testing Philosophy & Goals

### 1.1 Quality Goals

| Dimension | Target | Measurement |
|-----------|--------|-------------|
| **Reliability** | 99.5% uptime in staging; zero data-corruption defects in production | Error-rate dashboards, Sentry alerts |
| **Correctness** | Zero P1 bugs at release; <5 P2 bugs per sprint | Bug tracker severity distribution |
| **Security** | OWASP Top 10 mitigated; zero auth-bypass paths | Penetration test report + automated RBAC tests |
| **Performance** | p95 read < 300 ms, p95 write < 500 ms (50 concurrent users) | k6 load test reports |
| **Code Coverage** | ≥ 80% line/branch coverage for services & utilities | Jest `--coverage` report |
| **Accessibility** | WCAG 2.1 AA for all patient-facing pages | Playwright + axe-core scans |

### 1.2 Test-Driven Development Approach

The project follows a **TDD-first** approach for all business-critical service functions:

1. **Red** – Write a failing test that captures the requirement.
2. **Green** – Write the minimum implementation to make it pass.
3. **Refactor** – Improve implementation without breaking tests.

TDD is *mandatory* for:
- All service-layer functions (appointment logic, billing calculations, queue algorithms)
- Zod validators / DTOs
- JWT / auth helpers

TDD is *recommended but not required* for:
- Express route handlers (covered by integration tests)
- React components (use component-first + RTL verification)

### 1.3 Testing Pyramid

```
         /‾‾‾‾‾‾‾‾‾‾‾\
        /   E2E (10%)  \          Playwright – 5 core user journeys
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      / Integration (25%)\        Jest + Supertest + mongodb-memory-server
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /   Unit Tests (65%)   \      Jest (backend) · Vitest (frontend)
   /_______________________\
```

| Layer | Ratio | Approx. Count | Run Time Target |
|-------|-------|---------------|-----------------|
| Unit | 65% | ~300 tests | < 60 s |
| Integration | 25% | ~120 tests | < 3 min |
| E2E | 10% | ~30 scenarios | < 15 min |

---

## 2. Test Types & Tools

### 2.1 Unit Tests — Backend

#### Tools & Configuration

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner & assertion library |
| **ts-jest** | TypeScript compilation without separate build step |
| **jest-mock-extended** | Type-safe mocking of Mongoose models & external services |

**`jest.config.ts` (backend)**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
    'src/validators/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThresholds: {
    global: { lines: 80, functions: 80, branches: 75, statements: 80 },
  },
};

export default config;
```

#### What to Test

- Service functions (pure business logic, no HTTP layer)
- Utility/helper functions
- Zod validators / DTO schemas
- JWT helpers
- Algorithm implementations (slot generation, queue ordering)

#### Full Unit Test Case Catalogue (35 cases)

**AUTH SERVICE**

| # | Test Case | Expected Outcome |
|---|-----------|-----------------|
| U-01 | `hashPassword` produces bcrypt hash of correct length | Returns 60-char hash, not equal to plaintext |
| U-02 | `hashPassword` is non-deterministic (same input → different hashes) | Two hashes for same password differ |
| U-03 | `comparePassword` returns `true` for correct password | `true` |
| U-04 | `comparePassword` returns `false` for wrong password | `false` |
| U-05 | `generateAccessToken` returns a signed JWT with correct payload | Decoded payload contains `userId`, `role`, `clinicId` |
| U-06 | `generateAccessToken` sets expiry to 15 minutes | `exp - iat === 900` |
| U-07 | `generateRefreshToken` sets expiry to 7 days | `exp - iat === 604800` |
| U-08 | `verifyAccessToken` throws `JsonWebTokenError` on tampered token | Error thrown |
| U-09 | `verifyAccessToken` throws `TokenExpiredError` on expired token | Error thrown |
| U-10 | `refreshTokens` issues new access + refresh tokens when refresh is valid | Returns `{ accessToken, refreshToken }` |

**APPOINTMENT SERVICE**

| # | Test Case | Expected Outcome |
|---|-----------|-----------------|
| U-11 | `generateTimeSlots` produces correct slot count for 2-hour window, 15-min slots | 8 slots |
| U-12 | `generateTimeSlots` excludes break time from slots | Break slots absent in result |
| U-13 | `generateTimeSlots` returns empty array when window < slot duration | `[]` |
| U-14 | `isSlotAvailable` returns `false` when slot already booked | `false` |
| U-15 | `isSlotAvailable` returns `true` when slot is free | `true` |
| U-16 | `checkDoubleBooking` detects exact same doctor/date/time conflict | Throws `SlotConflictError` |
| U-17 | `checkDoubleBooking` allows same slot for different doctors | Resolves without error |
| U-18 | `applyCancellationPolicy` returns `FULL_REFUND` when >24 h before appointment | Correct policy applied |
| U-19 | `applyCancellationPolicy` returns `NO_REFUND` when <1 h before appointment | Correct policy applied |
| U-20 | `isDoctorOnLeave` returns `true` when leave record overlaps requested date | `true` |

**QUEUE SERVICE**

| # | Test Case | Expected Outcome |
|---|-----------|-----------------|
| U-21 | `generateTokenNumber` returns next sequential number for the day | Current max + 1 |
| U-22 | `generateTokenNumber` resets to 1 at start of new day | `1` |
| U-23 | `insertPriorityPatient` inserts emergency patient before all standard entries | Emergency entry is `queue[0]` |
| U-24 | `getNextPatient` returns first WAITING entry in queue | Correct patient returned |
| U-25 | `getNextPatient` skips SKIPPED entries and returns next WAITING | Correct patient returned |
| U-26 | `reorderQueue` maintains priority ordering after multiple insertions | Sorted array: emergency → senior → standard |

**BILLING SERVICE**

| # | Test Case | Expected Outcome |
|---|-----------|-----------------|
| U-27 | `calculateInvoiceTotal` sums all line items correctly | Correct total |
| U-28 | `calculateInvoiceTotal` applies percentage discount correctly | Total with discount |
| U-29 | `calculateInvoiceTotal` handles zero-fee consultation | Returns 0 |
| U-30 | `recordPayment` marks invoice as PAID when payment equals total | Status `PAID` |
| U-31 | `recordPayment` marks invoice as PARTIAL when payment < total | Status `PARTIAL` |
| U-32 | `generateInvoiceNumber` produces clinic-prefixed sequential number | e.g. `INV-CLINIC-00042` |

**ZOD VALIDATORS**

| # | Test Case | Expected Outcome |
|---|-----------|-----------------|
| U-33 | `loginSchema` rejects missing email | `ZodError` with `email` path |
| U-34 | `appointmentCreateSchema` rejects past date | `ZodError` with `appointmentDate` path |
| U-35 | `prescriptionSchema` rejects empty medicines array | `ZodError` with `medicines` path |

#### Example — Auth Unit Tests

```typescript
// src/__tests__/unit/authService.test.ts
import { hashPassword, comparePassword, generateAccessToken, verifyAccessToken } from '../../services/authService';

describe('AuthService – password hashing', () => {
  const plaintext = 'SuperSecret@123';

  it('should produce a bcrypt hash different from plaintext', async () => {
    const hash = await hashPassword(plaintext);
    expect(hash).not.toBe(plaintext);
    expect(hash.length).toBe(60);
  });

  it('should return true for correct password comparison', async () => {
    const hash = await hashPassword(plaintext);
    expect(await comparePassword(plaintext, hash)).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const hash = await hashPassword(plaintext);
    expect(await comparePassword('WrongPassword', hash)).toBe(false);
  });
});

describe('AuthService – JWT', () => {
  const payload = { userId: 'user123', role: 'doctor', clinicId: 'clinic1' };

  it('should embed correct payload in access token', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should throw on tampered token', () => {
    const token = generateAccessToken(payload) + 'tampered';
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
```

#### Example — Slot Generation Unit Test

```typescript
// src/__tests__/unit/appointmentService.test.ts
import { generateTimeSlots } from '../../services/appointmentService';

describe('generateTimeSlots', () => {
  it('should generate 8 slots for a 2-hour window with 15-min duration', () => {
    const slots = generateTimeSlots({ start: '09:00', end: '11:00', durationMinutes: 15 });
    expect(slots).toHaveLength(8);
    expect(slots[0]).toBe('09:00');
    expect(slots[7]).toBe('10:45');
  });

  it('should return empty array when window is smaller than slot duration', () => {
    const slots = generateTimeSlots({ start: '09:00', end: '09:10', durationMinutes: 15 });
    expect(slots).toHaveLength(0);
  });

  it('should exclude break period from slots', () => {
    const slots = generateTimeSlots({
      start: '09:00', end: '12:00',
      durationMinutes: 30,
      breaks: [{ start: '10:00', end: '10:30' }],
    });
    expect(slots).not.toContain('10:00');
    expect(slots).not.toContain('10:30');
  });
});
```

---

### 2.2 Integration Tests — Backend API

#### Tools & Configuration

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner |
| **Supertest** | HTTP request simulation against Express app |
| **mongodb-memory-server** | In-process MongoDB instance per test suite |
| **faker** | Realistic seed data generation |

**Global test setup:**

```typescript
// src/__tests__/integration/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export const connectTestDb = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
};

export const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
};
```

#### Test Seed Helpers

```typescript
// src/__tests__/integration/seeds.ts
import { UserModel } from '../../models/user';
import { hashPassword } from '../../services/authService';

export const seedTestUsers = async () => {
  const password = await hashPassword('Test@1234');
  const clinic = { clinicId: 'clinic-test-001' };
  return {
    admin: await UserModel.create({ ...clinic, role: 'admin', email: 'admin@test.com', password }),
    doctor: await UserModel.create({ ...clinic, role: 'doctor', email: 'doctor@test.com', password }),
    receptionist: await UserModel.create({ ...clinic, role: 'receptionist', email: 'recep@test.com', password }),
    patient: await UserModel.create({ ...clinic, role: 'patient', email: 'patient@test.com', password }),
  };
};
```

#### Full Integration Test Suite Catalogue (25 suites)

| # | Suite | Key Test Cases |
|---|-------|---------------|
| I-01 | `POST /auth/login` | Valid credentials → 200 + tokens; wrong password → 401; non-existent user → 401; locked account → 403; missing fields → 400 |
| I-02 | `POST /auth/logout` | Valid refresh token → 200; invalid/expired token → 401 |
| I-03 | `POST /auth/refresh` | Valid refresh token → new access token; expired refresh → 401; reuse attack (token rotation) → 401 |
| I-04 | `GET /auth/me` | Authenticated → 200 with profile; no token → 401; expired token → 401 |
| I-05 | `POST /appointments` | Successful booking → 201; slot conflict → 409; doctor on leave → 422; past date → 400; patient role cannot book for another → 403 |
| I-06 | `GET /appointments` | Doctor sees own appointments; receptionist sees all; patient sees own; admin sees all; date/status filters apply |
| I-07 | `PUT /appointments/:id/cancel` | Within policy → 200; outside policy → 422; not owner → 403; already cancelled → 409 |
| I-08 | `PUT /appointments/:id/checkin` | Valid → creates visit + queue entry; already checked-in → 409; date mismatch → 422; receptionist only → 403 for patient role |
| I-09 | `GET /queue/:doctorId` | Returns sorted active queue; unauthorized role → 403; doctor can only view own queue |
| I-10 | `PUT /queue/:entryId/next` | Marks current as IN_CONSULTATION, next as CALLED; empty queue → 404; non-doctor → 403 |
| I-11 | `POST /prescriptions/:visitId` | Doctor creates prescription → 201; non-doctor → 403; consultation not started → 422; missing medicines → 400 |
| I-12 | `GET /prescriptions/:visitId` | Doctor/patient can view; receptionist cannot view prescription body |
| I-13 | `GET /patients` | Receptionist/admin → paginated list; patient → 403; search by name works |
| I-14 | `POST /patients` | Admin/receptionist create patient → 201; duplicate phone → 409; invalid DOB → 400 |
| I-15 | `GET /patients/:id/history` | Doctor → full history; patient → own history; receptionist → 403 |
| I-16 | `GET /doctors` | Any authenticated role → 200; unauthenticated → 401 |
| I-17 | `POST /doctors/:id/schedule` | Admin only sets schedule → 201; doctor/receptionist → 403; overlapping window → 422 |
| I-18 | `POST /doctors/:id/leaves` | Admin/doctor (own) → 201; past date → 400; patient → 403 |
| I-19 | `GET /invoices` | Admin → all; receptionist → all; patient → own; doctor → 403; pagination works |
| I-20 | `POST /invoices` | Receptionist creates → 201; duplicate visit invoice → 409; negative amount → 400 |
| I-21 | `POST /invoices/:id/payments` | Full payment → invoice PAID; partial → PARTIAL; overpayment → 422 |
| I-22 | `POST /reports/upload` | Valid PDF/image → 201 with Cloudinary URL mock; virus-flagged file → 422; oversized file → 413 |
| I-23 | `GET /analytics/appointments` | Admin only → 200 with stats; date range filter works; non-admin → 403 |
| I-24 | `GET /audit-logs` | Admin only; pagination; filters by action/user |
| I-25 | `GET /clinic/settings` | Any authenticated → 200; update → admin only → 200; non-admin update → 403 |

#### Example — Auth Integration Test

```typescript
// src/__tests__/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../app';
import { connectTestDb, disconnectTestDb, clearCollections } from './setup';
import { seedTestUsers } from './seeds';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe('POST /auth/login', () => {
  beforeEach(seedTestUsers);

  it('should return 200 with tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@test.com', password: 'Test@1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should return 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'Test@1234' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for missing email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Test@1234' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ path: 'email' }));
  });
});
```

#### Example — RBAC Appointment Test

```typescript
// src/__tests__/integration/appointments.test.ts
describe('POST /appointments — RBAC enforcement', () => {
  let patientToken: string;

  beforeEach(async () => {
    const users = await seedTestUsers();
    const loginRes = await request(app).post('/api/auth/login')
      .send({ email: 'patient@test.com', password: 'Test@1234' });
    patientToken = loginRes.body.accessToken;
  });

  it('should allow patient to book own appointment', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: 'doctor-id-123',
        appointmentDate: '2027-01-15',
        startTime: '09:00',
        type: 'ONLINE',
      });

    expect([201, 409]).toContain(res.status); // 409 if slot conflict
  });

  it('should forbid patient from booking for another patient', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ patientId: 'other-patient-id', doctorId: 'doctor-id-123', appointmentDate: '2027-01-15', startTime: '09:00' });

    expect(res.status).toBe(403);
  });
});
```

---

### 2.3 Frontend Unit Tests

#### Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Fast Vite-native test runner |
| **React Testing Library** | DOM-first component testing |
| **@testing-library/user-event** | Realistic user interaction simulation |
| **msw** (Mock Service Worker) | API mocking at network level |
| **axe-core** | Accessibility assertions |

#### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'lcov'], include: ['src/**/*.{ts,tsx}'] },
  },
});
```

#### Frontend Test Cases

| # | Category | Test Case |
|---|----------|-----------|
| F-01 | Utility | `formatDate` formats ISO string to DD/MM/YYYY |
| F-02 | Utility | `formatCurrency` formats number to ₹ string |
| F-03 | Utility | `calculateAge` returns correct age from DOB |
| F-04 | Validation | Login form shows "Invalid email" on blur with bad email |
| F-05 | Validation | Appointment form shows error when date is in the past |
| F-06 | Validation | Prescription form disables submit when medicines array is empty |
| F-07 | Component | `<RoleGuard role="doctor">` renders children only for doctor role |
| F-08 | Component | `<RoleGuard role="admin">` renders nothing for patient role |
| F-09 | Component | `<QueueBoard>` renders patient names from mocked queue data |
| F-10 | Component | `<AppointmentCard>` shows "Cancel" button only when status is SCHEDULED |
| F-11 | Component | `<InvoiceTable>` shows "PAID" badge when invoice status is PAID |
| F-12 | Hook | `useAuth` returns `isAuthenticated: false` before login |
| F-13 | Hook | `useAppointments` refetches on window focus |
| F-14 | Form | Submitting login form with valid data calls `loginMutation` |
| F-15 | Accessibility | `<LoginPage>` has no axe violations |

#### Example — RoleGuard Component Test

```typescript
// src/__tests__/components/RoleGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { AuthProvider } from '../../context/AuthContext';

const renderWithAuth = (role: string, ui: React.ReactNode) =>
  render(
    <AuthProvider value={{ user: { role }, isAuthenticated: true }}>
      {ui}
    </AuthProvider>
  );

describe('RoleGuard', () => {
  it('renders children when user has the required role', () => {
    renderWithAuth('doctor', <RoleGuard role="doctor"><p>Doctor panel</p></RoleGuard>);
    expect(screen.getByText('Doctor panel')).toBeInTheDocument();
  });

  it('renders nothing when user lacks the required role', () => {
    renderWithAuth('patient', <RoleGuard role="admin"><p>Admin panel</p></RoleGuard>);
    expect(screen.queryByText('Admin panel')).not.toBeInTheDocument();
  });
});
```

---

### 2.4 End-to-End Tests

#### Tools & Configuration

| Tool | Purpose |
|------|---------|
| **Playwright** | Cross-browser E2E automation |
| **@playwright/test** | Built-in assertions + fixtures |
| **dotenv** | Environment config for E2E DB |

**`playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,         // sequential to avoid queue interference
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { channel: 'chrome' } },
    { name: 'firefox' },
  ],
});
```

#### E2E User Journey Catalogue

**Journey 1 — Patient: Register → Login → Book → Confirm**
```
1. Navigate to /register
2. Fill patient registration form with valid data
3. Submit → redirected to /login
4. Login with new credentials
5. Navigate to /appointments/book
6. Select doctor, date, and available time slot
7. Submit booking
8. Assert confirmation page shows appointment ID and status SCHEDULED
9. Assert email confirmation notification appears (mocked)
```

**Journey 2 — Receptionist: Search → Check-in → Token → Queue**
```
1. Login as receptionist
2. Navigate to /patients, search by phone number
3. Open patient record → click "Check In"
4. Select associated appointment
5. Assert visit created and OPD token generated (e.g., Token #7)
6. Navigate to /queue → assert patient appears with correct token
7. Assert Socket.IO real-time event updates queue board
```

**Journey 3 — Doctor: Queue → Consultation → Prescription → Follow-up**
```
1. Login as doctor
2. Navigate to /queue/today → assert patient list
3. Click "Call Next" → patient status changes to IN_CONSULTATION
4. Open consultation workspace for visit
5. Enter diagnosis and treatment notes
6. Add medicines to prescription, click "Save & Generate PDF"
7. Assert PDF generation triggers (mocked download)
8. Schedule follow-up → assert follow-up record created
```

**Journey 4 — Admin: Add Doctor → Configure Schedule → Analytics**
```
1. Login as admin
2. Navigate to /doctors/add → fill form → submit
3. Navigate to doctor profile → set weekly schedule
4. Navigate to /analytics → assert appointment trend chart visible
5. Filter analytics by date range → assert numbers change
```

**Journey 5 — Receptionist: Invoice → Payment**
```
1. Login as receptionist
2. Navigate to completed visit → click "Generate Invoice"
3. Assert invoice line items are pre-populated from consultation
4. Add additional items, apply discount
5. Click "Record Payment" → enter amount → select method (CASH)
6. Assert invoice status changes to PAID
7. Assert receipt PDF download triggers
```

---

### 2.5 Socket.IO Tests

```typescript
// src/__tests__/integration/socket.test.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket } from 'socket.io-client';
import { queueUpdateHandler } from '../../socket/queueHandlers';

describe('Socket.IO – Queue Updates', () => {
  let serverSocket: Server;
  let clientSocket: Socket;
  const PORT = 3099;

  beforeAll((done) => {
    const httpServer = createServer();
    serverSocket = new Server(httpServer);
    serverSocket.on('connection', (socket) => queueUpdateHandler(socket, serverSocket));
    httpServer.listen(PORT, () => {
      clientSocket = ioc(`http://localhost:${PORT}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    serverSocket.close();
    clientSocket.disconnect();
  });

  it('should broadcast QUEUE_UPDATED when next patient is called', (done) => {
    clientSocket.on('QUEUE_UPDATED', (payload) => {
      expect(payload).toHaveProperty('doctorId');
      expect(payload).toHaveProperty('queue');
      done();
    });

    // Simulate server-side emission
    serverSocket.emit('QUEUE_UPDATED', { doctorId: 'doc1', queue: [] });
  });

  it('should send NEW_TOKEN_ISSUED event on check-in', (done) => {
    clientSocket.on('NEW_TOKEN_ISSUED', (payload) => {
      expect(payload).toHaveProperty('tokenNumber');
      done();
    });
    serverSocket.emit('NEW_TOKEN_ISSUED', { tokenNumber: 5, patientName: 'Test Patient' });
  });
});
```

---

## 3. Security Testing

### 3.1 Test Matrix

| Test Category | Method | Automated? | Frequency |
|--------------|--------|-----------|-----------|
| Auth bypass attempts | Supertest integration tests | ✅ | Every PR |
| RBAC enforcement (all roles × all endpoints) | Parameterized integration tests | ✅ | Every PR |
| MongoDB injection | Supertest with `$gt`, `$where` payloads | ✅ | Every PR |
| XSS in text fields | Playwright with `<script>alert(1)</script>` payloads | ✅ | Weekly |
| CSRF protection | Supertest without origin header | ✅ | Every PR |
| Rate limiting | k6 burst test → verify 429 responses | ✅ | Nightly |
| File upload abuse | Supertest with wrong MIME types, >10 MB, executable files | ✅ | Every PR |
| JWT secret brute-force | Out-of-scope (server config) | ❌ | Manual audit |
| Broken object-level auth (BOLA) | Access another patient's records as a different patient | ✅ | Every PR |

### 3.2 Key Security Test Examples

```typescript
describe('Security – MongoDB Injection', () => {
  it('should reject $gt operator in email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'any' });

    expect(res.status).toBe(400); // Zod rejects non-string
  });
});

describe('Security – BOLA', () => {
  it('should not allow patient to read another patient prescription', async () => {
    const { patient } = await seedTestUsers();
    const anotherPatientVisitId = 'visit-id-other';
    const token = await loginAs(patient);

    const res = await request(app)
      .get(`/api/prescriptions/${anotherPatientVisitId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
```

### 3.3 RBAC Endpoint Coverage Matrix

| Endpoint | admin | doctor | receptionist | patient |
|----------|-------|--------|-------------|---------|
| `GET /audit-logs` | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| `POST /doctors` | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| `POST /prescriptions/:visitId` | ❌ 403 | ✅ | ❌ 403 | ❌ 403 |
| `GET /queue/:doctorId` | ✅ | ✅ (own) | ✅ | ❌ 403 |
| `POST /invoices` | ✅ | ❌ 403 | ✅ | ❌ 403 |
| `GET /patients/:id/history` | ✅ | ✅ | ❌ 403 | ✅ (own) |
| `GET /analytics` | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

---

## 4. Performance Testing

### 4.1 Tools

**k6** is the primary performance testing tool. Install: `brew install k6` or `choco install k6`.

### 4.2 Test Scenarios

#### Scenario A — Concurrent Appointment Booking (Write-Heavy)

```javascript
// k6/appointment-booking.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    doctorId: 'load-test-doctor',
    appointmentDate: '2027-06-01',
    startTime: '09:00',
  });

  const res = http.post('http://localhost:4000/api/appointments', payload, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${__ENV.TOKEN}` },
  });

  check(res, {
    'status is 201 or 409 (conflict)': (r) => [201, 409].includes(r.status),
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

#### Scenario B — Concurrent Queue Reads (Read-Heavy)

```javascript
// k6/queue-reads.js
export const options = {
  vus: 100,
  duration: '30s',
  thresholds: { http_req_duration: ['p(95)<300'] },
};

export default function () {
  http.get('http://localhost:4000/api/queue/load-test-doctor', {
    headers: { Authorization: `Bearer ${__ENV.DOCTOR_TOKEN}` },
  });
  sleep(0.5);
}
```

### 4.3 Acceptance Criteria

| Scenario | Metric | Threshold |
|----------|--------|-----------|
| Read APIs (queue, patients list) | p95 response time | < 300 ms |
| Write APIs (appointments, check-in) | p95 response time | < 500 ms |
| Any API | Error rate | < 1% |
| Login endpoint | Throughput | ≥ 100 req/s |
| PDF generation | p95 response time | < 2 s |

---

## 5. Test Data Management

### 5.1 Factory Pattern for Seed Data

```typescript
// src/__tests__/factories/index.ts
import { faker } from '@faker-js/faker';

export const createPatient = (overrides = {}) => ({
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number('##########'),
  dateOfBirth: faker.date.birthdate({ min: 1, max: 90, mode: 'age' }).toISOString(),
  gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
  clinicId: 'clinic-test-001',
  ...overrides,
});

export const createAppointment = (doctorId: string, patientId: string, overrides = {}) => ({
  doctorId,
  patientId,
  clinicId: 'clinic-test-001',
  appointmentDate: faker.date.future().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '09:15',
  status: 'SCHEDULED',
  type: 'ONLINE',
  ...overrides,
});

export const createInvoice = (visitId: string, overrides = {}) => ({
  visitId,
  clinicId: 'clinic-test-001',
  lineItems: [{ description: 'Consultation Fee', amount: 500, quantity: 1 }],
  totalAmount: 500,
  status: 'UNPAID',
  ...overrides,
});
```

### 5.2 Test Isolation Strategy

| Strategy | Implementation |
|----------|---------------|
| **In-memory MongoDB** | Each integration test suite spins up its own `MongoMemoryServer` |
| **BeforeEach seeding** | Fresh seed data before every test, not shared between tests |
| **AfterEach cleanup** | `clearCollections()` drops all documents after each test |
| **No shared state** | Tests must not rely on order of execution; `--runInBand` only for Socket.IO tests |
| **Mocked external services** | Cloudinary, email (Nodemailer), SMS stubbed with Jest `jest.mock()` |

### 5.3 Environment Variables for Test Runs

```dotenv
# .env.test
NODE_ENV=test
JWT_SECRET=test-jwt-secret-not-for-production
JWT_REFRESH_SECRET=test-refresh-secret
CLOUDINARY_ENABLED=false
EMAIL_ENABLED=false
SMS_ENABLED=false
RATE_LIMIT_MAX=1000      # disable rate limiting in unit tests
```

---

## 6. CI/CD Integration

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: Smart OPD CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests (Backend + Frontend)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
        working-directory: backend
      - name: Backend unit tests
        run: npm run test:unit -- --coverage --ci
        working-directory: backend
        env:
          NODE_ENV: test
          JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
      - run: npm ci
        working-directory: frontend
      - name: Frontend unit tests
        run: npm run test -- --coverage --reporter=verbose
        working-directory: frontend
      - uses: codecov/codecov-action@v4
        with:
          files: backend/coverage/lcov.info,frontend/coverage/lcov.info

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
        working-directory: backend
      - name: Run integration tests
        run: npm run test:integration -- --forceExit --ci
        working-directory: backend
        env:
          NODE_ENV: test
          JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}

  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.event_name == 'pull_request' && github.base_ref == 'main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
        working-directory: frontend
      - run: npx playwright install --with-deps chromium
        working-directory: frontend
      - name: Start backend
        run: npm start &
        working-directory: backend
        env:
          NODE_ENV: e2e
          MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}
      - name: Wait for backend
        run: npx wait-on http://localhost:4000/health
      - name: Run Playwright tests
        run: npx playwright test
        working-directory: frontend
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### 6.2 Pipeline Behavior

| Stage | Trigger | Fail Behavior |
|-------|---------|---------------|
| Unit tests | Every push | ❌ **Fail fast** — blocks integration & E2E |
| Integration tests | After unit pass | ❌ Fail — blocks E2E |
| E2E tests | PR to `main` only | ⚠️ Required to merge PR to main |
| Coverage report | After unit tests | ⚠️ Warning if coverage drops below 80% |
| Performance tests | Manual trigger / nightly | ⚠️ Advisory only |

---

## 7. Bug Tracking & Regression

### 7.1 Bug Severity Classification

| Severity | Definition | SLA (fix time) | Examples |
|----------|-----------|----------------|---------|
| **P1 — Critical** | Data loss, auth bypass, system down | 4 hours | Patient data exposed, login broken |
| **P2 — High** | Core workflow broken, no workaround | 24 hours | Cannot create appointment, queue stalls |
| **P3 — Medium** | Feature degraded, workaround exists | 72 hours | PDF download fails, search slow |
| **P4 — Low** | Cosmetic, minor UX issue | Next sprint | Misaligned button, typo |

### 7.2 Regression Test Tagging

Tag each test with its coverage area so regression suites can be scoped:

```typescript
// Jest tag example
describe('[AUTH] [REGRESSION] Login flow', () => { /* ... */ });
describe('[APPOINTMENTS] [REGRESSION] Double-booking prevention', () => { /* ... */ });
```

**Playwright tag example:**

```typescript
test('[QUEUE] [REGRESSION] Token generation on check-in', async ({ page }) => { /* ... */ });
```

**npm scripts for scoped regression runs:**

```json
{
  "test:regression:auth": "jest --testNamePattern='\\[AUTH\\]'",
  "test:regression:appointments": "jest --testNamePattern='\\[APPOINTMENTS\\]'"
}
```

### 7.3 Test Documentation Standards

Every test must have:

| Field | Required | Example |
|-------|----------|---------|
| **Test ID** | ✅ | `U-01`, `I-05`, `E2E-03` |
| **Description** | ✅ | Clear `it('should ...')` statement |
| **Preconditions** | ✅ | Documented in `beforeEach` or test comment |
| **Linked requirement** | ✅ | Comment: `// FR-07: Slot conflict detection` |
| **Regression tag** | For bug-fix tests | `[REGRESSION] Bug #142` |

---

## 8. QA Checklist per Phase

### Phase 1 — Auth & User Management

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q1-01 | User registration with all roles | Integration | 201 response, correct role stored |
| Q1-02 | Login returns valid JWT pair | Integration | 200 + tokens |
| Q1-03 | Expired access token rejected | Integration | 401 |
| Q1-04 | Refresh token rotation (old token invalidated) | Integration | 401 on reuse |
| Q1-05 | Password hashing (not stored in plaintext) | Unit + DB inspection | Hash stored, not plaintext |
| Q1-06 | RBAC middleware blocks wrong roles | Integration | 403 on each violation |
| Q1-07 | Login page renders correctly | E2E | Page visible, form submittable |
| Q1-08 | Login failure shows error message | E2E | Error text displayed |

### Phase 2 — Clinic Configuration

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q2-01 | Admin can update clinic settings | Integration | 200, fields updated |
| Q2-02 | Non-admin cannot update clinic settings | Integration | 403 |
| Q2-03 | Clinic settings form pre-populates existing values | Frontend | Correct initial values |
| Q2-04 | Logo upload stored in Cloudinary | Integration (mocked) | URL stored in clinicSettings |

### Phase 3 — Doctors & Schedules

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q3-01 | Add doctor with all required fields | Integration | 201, doctor profile created |
| Q3-02 | Weekly schedule saves all 7 days | Integration | All day entries persisted |
| Q3-03 | Overlapping schedule windows rejected | Integration | 422 |
| Q3-04 | Doctor leave blocks slot generation | Unit + Integration | Leave days excluded from slots |
| Q3-05 | Doctor can view own schedule | Integration | 200, correct data |

### Phase 4 — Patient Registration

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q4-01 | Receptionist registers new patient | Integration | 201 with patient ID |
| Q4-02 | Duplicate phone number rejected | Integration | 409 |
| Q4-03 | Patient self-registers via portal | Integration | 201 |
| Q4-04 | Patient search by name/phone | Integration | Correct results, paginated |
| Q4-05 | Patient medical profile initialized | Integration | Empty history, correct defaults |

### Phase 5 — Appointment Scheduling

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q5-01 | Slot generation for a day's schedule | Unit | Correct slots returned |
| Q5-02 | Double-booking rejected | Unit + Integration | `SlotConflictError` / 409 |
| Q5-03 | Booking on doctor leave date rejected | Integration | 422 |
| Q5-04 | Cancellation within 24 h triggers policy | Unit | Correct refund policy |
| Q5-05 | Waiting list added when slots exhausted | Integration | 201 with WAITLISTED status |
| Q5-06 | Patient views own appointments | Integration | 200, only own records |
| Q5-07 | Appointment reminder notification scheduled | Integration (mock) | Notification record created |

### Phase 6 — Queue & OPD Token

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q6-01 | Check-in creates visit + OPD token | Integration | Visit + token created |
| Q6-02 | Token number sequential within day | Unit + Integration | Numbers increment correctly |
| Q6-03 | Emergency patient inserted at front | Unit + Socket test | Priority ordering correct |
| Q6-04 | Queue board receives real-time update | Socket test | `QUEUE_UPDATED` event emitted |
| Q6-05 | Doctor calls next patient | Integration | Status transitions correct |
| Q6-06 | Completed visits removed from active queue | Integration | Queue filtered correctly |

### Phase 7 — Consultation & Prescriptions

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q7-01 | Doctor opens consultation workspace | E2E | Workspace loads with patient info |
| Q7-02 | Prescription created with medicines | Integration | 201, medicines array stored |
| Q7-03 | Non-doctor cannot create prescription | Integration | 403 |
| Q7-04 | PDF prescription generated | Integration (mock) | PDF URL stored in prescription |
| Q7-05 | Follow-up scheduled from consultation | Integration | Follow-up record created |
| Q7-06 | Medical history timeline ordered correctly | Integration | Visits ordered by date DESC |
| Q7-07 | Report uploaded via Cloudinary | Integration (mock) | Report URL stored |

### Phase 8 — Billing & Analytics

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| Q8-01 | Invoice auto-generated from visit | Integration | Correct line items |
| Q8-02 | Discount applied correctly to total | Unit + Integration | Correct total |
| Q8-03 | Full payment marks invoice PAID | Integration | Status = PAID |
| Q8-04 | Partial payment marks invoice PARTIAL | Integration | Status = PARTIAL |
| Q8-05 | PDF invoice generated | Integration (mock) | PDF URL stored |
| Q8-06 | Analytics appointment trend data correct | Integration | Counts match DB records |
| Q8-07 | Analytics date range filter works | Integration | Filtered counts correct |
| Q8-08 | Admin views revenue summary | Integration | Correct aggregated total |
| Q8-09 | Non-admin cannot view analytics | Integration | 403 |

---

## Appendix A — Test Toolchain Summary

| Layer | Runner | Libraries | Config File |
|-------|--------|-----------|-------------|
| Backend unit | Jest | ts-jest, jest-mock-extended | `jest.config.ts` |
| Backend integration | Jest + Supertest | mongodb-memory-server, faker | `jest.integration.config.ts` |
| Frontend unit | Vitest | RTL, MSW, axe-core | `vitest.config.ts` |
| E2E | Playwright | @playwright/test | `playwright.config.ts` |
| Socket.IO | Jest | socket.io-client | (same as backend unit) |
| Performance | k6 | — | `k6/*.js` |
| Security (DAST) | Manual + OWASP ZAP | — | — |

## Appendix B — Recommended npm Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='unit'",
    "test:integration": "jest --testPathPattern='integration' --runInBand --forceExit",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:perf": "k6 run k6/appointment-booking.js",
    "test:security": "jest --testPathPattern='security'"
  }
}
```

---

*Document maintained by the QA team. Update when new endpoints are added or existing behavior changes. All test IDs in this document correspond directly to test suite names in the codebase.*
