# Smart OPD – Data Dictionary

> **Document version:** 1.0  
> **Platform:** Smart OPD (MERN Stack – MongoDB / Mongoose)  
> **Purpose:** Authoritative reference for every field in every MongoDB collection. Use this document when writing migrations, validating API payloads, building seed scripts, or onboarding new engineers.

---

## Table of Contents

1. [users](#1-users)
2. [clinicSettings](#2-clinicsettings)
3. [doctors](#3-doctors)
4. [patients](#4-patients)
5. [appointments](#5-appointments)
6. [doctorSchedules](#6-doctorschedules)
7. [doctorLeaves](#7-doctorleaves)
8. [visits](#8-visits)
9. [queueEntries](#9-queueentries)
10. [prescriptions](#10-prescriptions)
11. [medicalReports](#11-medicalreports)
12. [invoices](#12-invoices)
13. [payments](#13-payments)
14. [followUps](#14-followups)
15. [notifications](#15-notifications)
16. [auditLogs](#16-auditlogs)
17. [Enum Reference](#17-enum-reference)

---

## 1. `users`

Shared authentication record for every person who logs into Smart OPD. Role determines which UI surfaces and API endpoints are accessible. One user document is created per person; role-specific details live in `doctors` or `patients`.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | MongoDB primary key | `64af1b2c3e4f5a6b7c8d9e0f` |
| `clinicId` | ObjectId (ref: clinicSettings) | Y | — | Must exist | Tenant boundary; ties user to a clinic | `64af0000111122223333aaaa` |
| `name` | String | Y | — | 2–100 chars | Full display name | `"Dr. Priya Sharma"` |
| `email` | String | Y | — | RFC 5322 regex; unique within clinic | Login email address | `"priya@smartopd.in"` |
| `phone` | String | N | — | E.164 format, 10–15 digits | Contact / OTP delivery number | `"+919876543210"` |
| `passwordHash` | String | Y | — | bcrypt hash, min 60 chars | Hashed password; never returned to client | `"$2b$12$..."` |
| `role` | String (enum) | Y | — | See §17 `UserRole` | Access-control role | `"doctor"` |
| `isActive` | Boolean | Y | `true` | — | Soft-disable without deleting | `true` |
| `isEmailVerified` | Boolean | Y | `false` | — | True after clicking email link | `false` |
| `emailVerificationToken` | String | N | — | UUID v4 | One-time token for email verification | `"a1b2c3d4-..."` |
| `emailVerificationExpiry` | Date | N | — | Must be future when set | Token TTL | `2024-06-01T18:00:00Z` |
| `passwordResetToken` | String | N | — | UUID v4, single-use | One-time reset token | `"f9e8d7c6-..."` |
| `passwordResetExpiry` | Date | N | — | Must be future when set | Reset token TTL (1 h) | `2024-06-01T13:00:00Z` |
| `lastLogin` | Date | N | — | — | Timestamp of last successful login | `2024-05-30T09:15:00Z` |
| `notificationPreferences` | Object | N | see sub-fields | — | Per-channel opt-in flags | `{ email: true, sms: false, inApp: true }` |
| `notificationPreferences.email` | Boolean | — | `true` | — | Receive email notifications | `true` |
| `notificationPreferences.sms` | Boolean | — | `true` | — | Receive SMS notifications | `false` |
| `notificationPreferences.inApp` | Boolean | — | `true` | — | Receive in-app notifications | `true` |
| `profileImage` | String | N | — | HTTPS URL | Cloudinary avatar URL | `"https://res.cloudinary.com/..."` |
| `createdAt` | Date | auto | `Date.now` | — | Record creation timestamp | `2024-01-10T08:00:00Z` |
| `updatedAt` | Date | auto | `Date.now` | — | Last modification timestamp | `2024-05-28T14:22:00Z` |

**Indexes:** `email + clinicId` (unique compound), `role`, `isActive`

---

## 2. `clinicSettings`

One document per clinic. Stores identity, branding, operational rules, and feature flags. The `clinicId` on all other collections references this document's `_id`.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Clinic primary key | `64af0000111122223333aaaa` |
| `name` | String | Y | — | 2–200 chars | Clinic display name | `"{{CLINIC_NAME}}"` |
| `tagline` | String | N | — | max 300 chars | Short tagline below clinic name on PDFs | `"Caring for you, always"` |
| `logoUrl` | String | N | — | HTTPS URL | Cloudinary logo for PDFs/portal | `"https://res.cloudinary.com/..."` |
| `address.street` | String | Y | — | max 200 chars | Street line | `"12 MG Road"` |
| `address.city` | String | Y | — | max 100 chars | City | `"Pune"` |
| `address.state` | String | Y | — | max 100 chars | State | `"Maharashtra"` |
| `address.pincode` | String | Y | — | 6-digit India pincode | Postal code | `"411001"` |
| `address.country` | String | Y | `"India"` | max 100 chars | Country | `"India"` |
| `phone` | String | Y | — | E.164 format | Primary contact number | `"+912012345678"` |
| `email` | String | Y | — | RFC 5322 | Clinic contact email | `"contact@clinic.in"` |
| `website` | String | N | — | HTTPS URL | Clinic website | `"https://clinic.in"` |
| `gstNumber` | String | N | — | regex: `^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` | GST registration number for invoices | `"27AABCU9603R1ZX"` |
| `registrationNumber` | String | N | — | max 50 chars | Govt / medical council reg no. | `"MH/CLINIC/2020/1234"` |
| `consultationFee` | Number | Y | `0` | ≥ 0 | Default consultation fee (INR) | `500` |
| `currency` | String | Y | `"INR"` | 3-char ISO 4217 | Billing currency | `"INR"` |
| `taxRate` | Number | N | `0` | 0–100 | GST percentage applied to invoices | `18` |
| `slotDurationMinutes` | Number | Y | `15` | 5, 10, 15, 20, 30, 60 | Appointment slot length in minutes | `15` |
| `maxAppointmentsPerSlot` | Number | Y | `1` | 1–10 | Overbooking limit per time slot | `1` |
| `appointmentBookingWindowDays` | Number | Y | `30` | 1–365 | How far in advance patients can book | `30` |
| `cancellationWindowHours` | Number | Y | `2` | 0–72 | Min notice required to cancel | `2` |
| `workingHours.start` | String | Y | `"09:00"` | HH:mm 24h | Clinic opening time | `"09:00"` |
| `workingHours.end` | String | Y | `"18:00"` | HH:mm 24h | Clinic closing time | `"18:00"` |
| `workingDays` | [String] | Y | Mon–Sat | subset of `DayOfWeek` enum | Days clinic is open | `["monday","tuesday","wednesday","thursday","friday","saturday"]` |
| `isActive` | Boolean | Y | `true` | — | Deactivate entire clinic tenant | `true` |
| `features.smsEnabled` | Boolean | Y | `false` | — | SMS notifications feature toggle | `false` |
| `features.emailEnabled` | Boolean | Y | `true` | — | Email notifications feature toggle | `true` |
| `features.onlineBookingEnabled` | Boolean | Y | `true` | — | Allow patients to self-book | `true` |
| `features.patientPortalEnabled` | Boolean | Y | `true` | — | Show patient-facing portal | `true` |
| `createdAt` | Date | auto | `Date.now` | — | Creation timestamp | `2024-01-01T00:00:00Z` |
| `updatedAt` | Date | auto | `Date.now` | — | Last update timestamp | `2024-05-01T12:00:00Z` |

---

## 3. `doctors`

Extended profile for users with `role: "doctor"`. Created automatically when Admin adds a doctor.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Doctor profile primary key | `64af1111aaaa2222bbbb3333` |
| `clinicId` | ObjectId (ref: clinicSettings) | Y | — | Must exist | Tenant link | — |
| `userId` | ObjectId (ref: users) | Y | — | Unique; must exist | Linked user account | — |
| `employeeId` | String | N | — | max 20 chars; unique within clinic | Internal staff ID | `"DOC-001"` |
| `specialization` | String | Y | — | max 150 chars | Medical specialization | `"General Physician"` |
| `qualifications` | [String] | Y | — | Each max 100 chars; min 1 entry | Degree list | `["MBBS","MD"]` |
| `registrationNumber` | String | Y | — | max 50 chars | Medical council registration no. | `"MH-12345"` |
| `experienceYears` | Number | N | — | 0–60 | Years of practice | `10` |
| `bio` | String | N | — | max 1000 chars | Short professional biography | `"Dr. Sharma has 10 years..."` |
| `consultationFee` | Number | N | — | ≥ 0; overrides clinic default | Doctor-specific fee | `700` |
| `languages` | [String] | N | — | Each max 50 chars | Languages spoken in consultation | `["English","Hindi","Marathi"]` |
| `signatureImageUrl` | String | N | — | HTTPS URL | Scanned signature for PDFs | `"https://res.cloudinary.com/..."` |
| `isAvailable` | Boolean | Y | `true` | — | Active / on-leave flag (admin-settable) | `true` |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId`, `userId` (unique), `isAvailable`

---

## 4. `patients`

Demographic and contact record for every patient registered at the clinic.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Patient record ID | — |
| `clinicId` | ObjectId (ref: clinicSettings) | Y | — | Must exist | Tenant link | — |
| `userId` | ObjectId (ref: users) | N | — | Unique if set | Linked portal login (optional) | — |
| `patientId` | String | Y | — | Unique within clinic; auto-generated e.g. `PT-00001` | Human-readable patient ID | `"PT-00001"` |
| `name` | String | Y | — | 2–100 chars | Full name | `"Ramesh Kumar"` |
| `dob` | Date | Y | — | Must be past date | Date of birth | `1985-03-15` |
| `gender` | String (enum) | Y | — | See §17 `Gender` | Biological gender | `"male"` |
| `bloodGroup` | String (enum) | N | — | See §17 `BloodGroup` | Blood group | `"O+"` |
| `phone` | String | Y | — | E.164 format | Primary contact | `"+919876543210"` |
| `altPhone` | String | N | — | E.164 format | Alternate contact | — |
| `email` | String | N | — | RFC 5322 | Email for notifications | `"ramesh@gmail.com"` |
| `address.street` | String | N | — | max 200 chars | Street address | `"45 Gandhi Nagar"` |
| `address.city` | String | N | — | max 100 chars | City | `"Mumbai"` |
| `address.state` | String | N | — | max 100 chars | State | `"Maharashtra"` |
| `address.pincode` | String | N | — | 6-digit | Pincode | `"400001"` |
| `emergencyContact.name` | String | N | — | max 100 chars | Emergency contact person | `"Sunita Kumar"` |
| `emergencyContact.phone` | String | N | — | E.164 format | Emergency contact number | `"+919123456789"` |
| `emergencyContact.relation` | String | N | — | max 50 chars | Relationship to patient | `"Wife"` |
| `knownAllergies` | [String] | N | `[]` | Each max 200 chars | Documented allergy list | `["Penicillin","Sulfa drugs"]` |
| `chronicConditions` | [String] | N | `[]` | Each max 200 chars | Chronic disease list | `["Type 2 Diabetes","Hypertension"]` |
| `occupation` | String | N | — | max 100 chars | Patient's occupation | `"Teacher"` |
| `maritalStatus` | String (enum) | N | — | See §17 `MaritalStatus` | Marital status | `"married"` |
| `registeredBy` | ObjectId (ref: users) | Y | — | Must exist | Receptionist/admin who registered | — |
| `isActive` | Boolean | Y | `true` | — | Soft-delete flag | `true` |
| `createdAt` | Date | auto | `Date.now` | — | Registration timestamp | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId`, `patientId` (unique), `phone`, `name` (text index)

---

## 5. `appointments`

Represents a booked or requested appointment slot. An appointment does **not** create a queue token; that happens at check-in (`visits`).

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Appointment ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `appointmentNumber` | String | Y | — | Unique within clinic; e.g. `APT-20240601-001` | Human-readable booking reference | `"APT-20240601-001"` |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Patient being seen | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Assigned doctor | — |
| `appointmentDate` | Date | Y | — | Must be future (on creation) | Scheduled date (date-only stored as midnight UTC) | `2024-06-10T00:00:00Z` |
| `slotStart` | String | Y | — | HH:mm format | Slot start time | `"10:00"` |
| `slotEnd` | String | Y | — | HH:mm format; > slotStart | Slot end time | `"10:15"` |
| `type` | String (enum) | Y | `"regular"` | See §17 `AppointmentType` | Booking type | `"follow_up"` |
| `status` | String (enum) | Y | `"pending"` | See §17 `AppointmentStatus` | Lifecycle state | `"confirmed"` |
| `chiefComplaint` | String | N | — | max 500 chars | Reason for visit (from patient at booking) | `"Persistent cough for 5 days"` |
| `notes` | String | N | — | max 1000 chars | Receptionist/admin notes | — |
| `bookedBy` | ObjectId (ref: users) | Y | — | Must exist | Who created this booking | — |
| `bookedByRole` | String (enum) | Y | — | See §17 `UserRole` | Role of booking actor | `"receptionist"` |
| `visitId` | ObjectId (ref: visits) | N | — | Set on check-in | Link to created visit record | — |
| `cancelledBy` | ObjectId (ref: users) | N | — | Set on cancellation | Who cancelled | — |
| `cancellationReason` | String | N | — | max 500 chars | Reason for cancellation | — |
| `reminderSent` | Boolean | Y | `false` | — | 24h reminder dispatched flag | `true` |
| `followUpId` | ObjectId (ref: followUps) | N | — | Set if originated from follow-up | Source follow-up link | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + appointmentDate + doctorId` (compound), `patientId`, `status`, `appointmentNumber` (unique)

---

## 6. `doctorSchedules`

Weekly recurring availability template for each doctor. The scheduler uses these to generate bookable slots.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | — | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Doctor this schedule belongs to | — |
| `dayOfWeek` | String (enum) | Y | — | See §17 `DayOfWeek` | Day of week this rule applies | `"monday"` |
| `isAvailable` | Boolean | Y | `true` | — | Whether doctor works this day | `true` |
| `shifts` | [Object] | N | `[]` | Min 0, max 3 shifts/day | Time blocks within the day | — |
| `shifts[].start` | String | Y (if shift) | — | HH:mm | Shift start time | `"09:00"` |
| `shifts[].end` | String | Y (if shift) | — | HH:mm; > start | Shift end time | `"13:00"` |
| `maxAppointments` | Number | N | — | 1–200 | Daily cap (overrides clinic default) | `20` |
| `effectiveFrom` | Date | N | — | Date from which this schedule applies | Useful for future schedule changes | `2024-07-01` |
| `effectiveTo` | Date | N | — | Must be > effectiveFrom if set | End of this schedule version | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + doctorId + dayOfWeek` (compound)

---

## 7. `doctorLeaves`

Records of planned and emergency absences for doctors. The scheduling engine treats these dates as blocked.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | — | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Doctor on leave | — |
| `leaveType` | String (enum) | Y | — | See §17 `LeaveType` | Nature of leave | `"planned"` |
| `startDate` | Date | Y | — | Must not be past (on creation) | Leave start (inclusive) | `2024-07-04` |
| `endDate` | Date | Y | — | ≥ startDate | Leave end (inclusive) | `2024-07-06` |
| `reason` | String | N | — | max 500 chars | Reason (for admin records) | `"Conference"` |
| `isFullDay` | Boolean | Y | `true` | — | Full day or partial | `true` |
| `partialStart` | String | N | — | HH:mm; required if isFullDay=false | Partial leave start | — |
| `partialEnd` | String | N | — | HH:mm; required if isFullDay=false | Partial leave end | — |
| `approvedBy` | ObjectId (ref: users) | N | — | Admin user | Approval record | — |
| `status` | String (enum) | Y | `"approved"` | See §17 `LeaveStatus` | Approval state | `"approved"` |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + doctorId + startDate` (compound)

---

## 8. `visits`

Created when a patient physically checks in at the clinic. This is the central operational record for a single OPD encounter. One visit links the appointment, the queue token, the consultation, the prescription, and the invoice.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Visit ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `visitNumber` | String | Y | — | Unique within clinic; e.g. `VIS-20240601-042` | Human-readable visit ref | `"VIS-20240601-042"` |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Patient visiting | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Doctor assigned at check-in | — |
| `appointmentId` | ObjectId (ref: appointments) | N | — | Set if walk-in appointment pre-existed | Source appointment | — |
| `visitDate` | Date | Y | — | Date of check-in | Calendar date of visit | `2024-06-01` |
| `checkInTime` | Date | Y | `Date.now` | — | Actual check-in timestamp | `2024-06-01T09:12:00Z` |
| `checkOutTime` | Date | N | — | Must be > checkInTime | Consultation-end timestamp | `2024-06-01T09:45:00Z` |
| `visitType` | String (enum) | Y | `"regular"` | See §17 `AppointmentType` | Type of this visit | `"regular"` |
| `status` | String (enum) | Y | `"checked_in"` | See §17 `VisitStatus` | Current visit state | `"consultation_in_progress"` |
| `chiefComplaint` | String | N | — | max 500 chars | Presenting complaint at check-in | `"Fever since 3 days"` |
| `vitalSigns.temperature` | Number | N | — | 90–115 (°F) | Body temperature | `98.6` |
| `vitalSigns.bloodPressureSystolic` | Number | N | — | 50–300 (mmHg) | Systolic BP | `120` |
| `vitalSigns.bloodPressureDiastolic` | Number | N | — | 30–200 (mmHg) | Diastolic BP | `80` |
| `vitalSigns.pulseRate` | Number | N | — | 20–300 (bpm) | Pulse rate | `72` |
| `vitalSigns.oxygenSaturation` | Number | N | — | 50–100 (%) | SpO2 | `98` |
| `vitalSigns.weight` | Number | N | — | 1–500 (kg) | Body weight | `70.5` |
| `vitalSigns.height` | Number | N | — | 30–300 (cm) | Height | `172` |
| `consultationNotes` | String | N | — | max 5000 chars | Doctor's subjective and objective notes | `"Patient presents with..."` |
| `diagnosis` | String | N | — | max 1000 chars | Primary and secondary diagnosis | `"Viral fever, Pharyngitis"` |
| `icd10Codes` | [String] | N | `[]` | Each max 10 chars | ICD-10 coding for diagnosis | `["J06.9","B34.9"]` |
| `treatmentPlan` | String | N | — | max 2000 chars | Treatment and advice | — |
| `prescriptionId` | ObjectId (ref: prescriptions) | N | — | Set after prescription creation | Link to prescription | — |
| `invoiceId` | ObjectId (ref: invoices) | N | — | Set after invoice generation | Link to invoice | — |
| `checkedInBy` | ObjectId (ref: users) | Y | — | Must exist | Receptionist who checked in patient | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + visitDate + doctorId` (compound), `patientId`, `visitNumber` (unique), `status`

---

## 9. `queueEntries`

Live queue record created at check-in. Used by the real-time Socket.IO queue management board.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Queue entry ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `visitId` | ObjectId (ref: visits) | Y | — | Unique; must exist | Linked visit | — |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Patient in queue | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Doctor's queue | — |
| `queueDate` | Date | Y | — | Date of queue | Calendar date | `2024-06-01` |
| `tokenNumber` | Number | Y | — | 1–9999; unique per doctor+date | Display token number | `7` |
| `priority` | String (enum) | Y | `"normal"` | See §17 `QueuePriority` | Priority level | `"emergency"` |
| `status` | String (enum) | Y | `"waiting"` | See §17 `QueueStatus` | Current queue state | `"called"` |
| `estimatedWaitMinutes` | Number | N | — | ≥ 0 | Estimated wait at check-in | `25` |
| `calledAt` | Date | N | — | Set when status → called | When doctor called this patient | `2024-06-01T10:35:00Z` |
| `consultationStartedAt` | Date | N | — | Set on consultation start | When consultation began | `2024-06-01T10:38:00Z` |
| `consultationEndedAt` | Date | N | — | Set on consultation end | When consultation ended | `2024-06-01T10:52:00Z` |
| `skippedCount` | Number | Y | `0` | 0–5 | How many times this entry was skipped | `0` |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + queueDate + doctorId` (compound), `visitId` (unique), `status`, `tokenNumber + doctorId + queueDate` (unique compound)

---

## 10. `prescriptions`

Digital prescription generated by the doctor at the end of a consultation. Each prescription contains one or more medication line items.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Prescription ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `visitId` | ObjectId (ref: visits) | Y | — | Unique; must exist | Visit this prescription belongs to | — |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Patient | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Prescribing doctor | — |
| `prescriptionDate` | Date | Y | `Date.now` | — | Date of prescription | `2024-06-01` |
| `chiefComplaint` | String | N | — | max 500 chars | Copied from visit at generation | — |
| `diagnosis` | String | N | — | max 1000 chars | Copied from visit | — |
| `medications` | [Object] | Y | `[]` | Min 0 items | List of medications | — |
| `medications[].drugName` | String | Y | — | max 200 chars | Generic or brand drug name | `"Paracetamol"` |
| `medications[].dosage` | String | Y | — | max 100 chars | Strength (e.g. 500mg) | `"500 mg"` |
| `medications[].frequency` | String | Y | — | max 100 chars | Dosage frequency | `"TID (thrice daily)"` |
| `medications[].duration` | String | Y | — | max 100 chars | Course duration | `"5 days"` |
| `medications[].route` | String (enum) | N | `"oral"` | See §17 `MedicationRoute` | Administration route | `"oral"` |
| `medications[].instructions` | String | N | — | max 300 chars | Special instructions | `"Take after meals"` |
| `advice` | String | N | — | max 2000 chars | General lifestyle / follow-up advice | `"Rest, fluids, avoid cold drinks"` |
| `nextVisitDate` | Date | N | — | Must be future | Recommended follow-up date | `2024-06-08` |
| `pdfUrl` | String | N | — | HTTPS URL | Cloudinary PDF URL after generation | `"https://res.cloudinary.com/..."` |
| `pdfGeneratedAt` | Date | N | — | Set on PDF generation | PDF creation timestamp | — |
| `issuedBy` | ObjectId (ref: users) | Y | — | Must exist | Doctor user who issued | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + patientId`, `visitId` (unique), `doctorId`

---

## 11. `medicalReports`

Uploaded lab / radiology / specialist reports stored on Cloudinary. Access is role-restricted.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Report ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Patient this report belongs to | — |
| `visitId` | ObjectId (ref: visits) | N | — | Link if report is associated to a visit | Optional visit context | — |
| `reportType` | String (enum) | Y | — | See §17 `ReportType` | Category of report | `"lab"` |
| `reportName` | String | Y | — | 2–200 chars | Descriptive name | `"Complete Blood Count"` |
| `reportDate` | Date | Y | — | Must not be future | Date on the report (not upload date) | `2024-05-30` |
| `fileUrl` | String | Y | — | HTTPS Cloudinary URL | Primary report file | — |
| `cloudinaryPublicId` | String | Y | — | — | For deletion / signed URL generation | `"reports/64af.../cbc_report"` |
| `mimeType` | String | Y | — | `application/pdf`, `image/jpeg`, `image/png` | File MIME type | `"application/pdf"` |
| `fileSizeBytes` | Number | Y | — | 1–52428800 (50 MB) | File size for quota tracking | `204800` |
| `notes` | String | N | — | max 1000 chars | Doctor's interpretation or notes | — |
| `isSharedWithPatient` | Boolean | Y | `true` | — | Whether visible in patient portal | `true` |
| `uploadedBy` | ObjectId (ref: users) | Y | — | Must exist | Uploader (doctor/receptionist) | — |
| `createdAt` | Date | auto | `Date.now` | — | Upload timestamp | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + patientId`, `visitId`, `reportDate`

---

## 12. `invoices`

Billing record for a clinic visit. Generated by receptionist or automatically on visit close.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Invoice ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `invoiceNumber` | String | Y | — | Unique within clinic; e.g. `INV-2024-00042` | Human-readable invoice ref | `"INV-2024-00042"` |
| `visitId` | ObjectId (ref: visits) | Y | — | Unique; must exist | Linked OPD visit | — |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Billed patient | — |
| `invoiceDate` | Date | Y | `Date.now` | — | Date of invoice | `2024-06-01` |
| `dueDate` | Date | N | — | ≥ invoiceDate | Payment due date | `2024-06-08` |
| `lineItems` | [Object] | Y | — | Min 1 item | Charge line items | — |
| `lineItems[].description` | String | Y | — | max 200 chars | Service/item description | `"Consultation Fee"` |
| `lineItems[].quantity` | Number | Y | `1` | 1–1000 | Units | `1` |
| `lineItems[].unitPrice` | Number | Y | — | ≥ 0 | Price per unit (INR) | `500` |
| `lineItems[].amount` | Number | Y | — | = quantity × unitPrice | Line total | `500` |
| `lineItems[].isTaxable` | Boolean | Y | `true` | — | Whether GST applies to this line | `true` |
| `subtotal` | Number | Y | — | = sum of lineItems.amount | Pre-tax total | `650` |
| `discountAmount` | Number | Y | `0` | 0 – subtotal | Flat discount | `50` |
| `taxRate` | Number | Y | `0` | 0–100 | GST % (from clinicSettings at invoice time) | `0` |
| `taxAmount` | Number | Y | `0` | ≥ 0; computed | Tax amount | `0` |
| `totalAmount` | Number | Y | — | subtotal − discount + taxAmount | Final payable | `600` |
| `status` | String (enum) | Y | `"unpaid"` | See §17 `InvoiceStatus` | Payment status | `"paid"` |
| `pdfUrl` | String | N | — | HTTPS URL | Cloudinary invoice PDF | — |
| `generatedBy` | ObjectId (ref: users) | Y | — | Must exist | Staff who generated invoice | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + invoiceDate`, `visitId` (unique), `patientId`, `invoiceNumber` (unique), `status`

---

## 13. `payments`

Individual payment transactions against an invoice. An invoice may have multiple partial payments.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Payment ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `invoiceId` | ObjectId (ref: invoices) | Y | — | Must exist | Invoice being paid | — |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Payer | — |
| `amount` | Number | Y | — | > 0; ≤ invoice outstanding | Amount paid in this transaction | `600` |
| `paymentMethod` | String (enum) | Y | — | See §17 `PaymentMethod` | Mode of payment | `"cash"` |
| `transactionId` | String | N | — | max 200 chars | POS / UPI / gateway transaction ref | `"UPI20240601123456"` |
| `paymentDate` | Date | Y | `Date.now` | — | Date of payment | `2024-06-01T10:55:00Z` |
| `notes` | String | N | — | max 500 chars | Receptionist remarks | — |
| `receivedBy` | ObjectId (ref: users) | Y | — | Must exist | Staff who recorded payment | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + paymentDate`, `invoiceId`, `patientId`

---

## 14. `followUps`

Follow-up reminders linked to a prescription or visit. The notification scheduler reads this collection to send 48h reminders.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Follow-up ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `patientId` | ObjectId (ref: patients) | Y | — | Must exist | Patient to follow up | — |
| `doctorId` | ObjectId (ref: doctors) | Y | — | Must exist | Doctor recommending follow-up | — |
| `visitId` | ObjectId (ref: visits) | N | — | Source visit context | — | — |
| `prescriptionId` | ObjectId (ref: prescriptions) | N | — | Source prescription | — | — |
| `followUpDate` | Date | Y | — | Must be future | Recommended follow-up date | `2024-06-08` |
| `reason` | String | N | — | max 500 chars | Why follow-up is needed | `"Review BP after medication"` |
| `status` | String (enum) | Y | `"pending"` | See §17 `FollowUpStatus` | Lifecycle state | `"completed"` |
| `reminderSent` | Boolean | Y | `false` | — | 48h reminder dispatched | `true` |
| `reminderSentAt` | Date | N | — | Set when reminder sent | Reminder dispatch timestamp | — |
| `linkedAppointmentId` | ObjectId (ref: appointments) | N | — | Set when patient books follow-up appt | Link to resulting appointment | — |
| `notes` | String | N | — | max 500 chars | Additional instructions | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + followUpDate`, `patientId`, `status`

---

## 15. `notifications`

Log of every notification dispatched or attempted by the system. Used for audit trails, retry logic, and analytics.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Notification log ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `recipientUserId` | ObjectId (ref: users) | N | — | Set for in-app notifications | Target user | — |
| `recipientPhone` | String | N | — | E.164 | SMS recipient | `"+919876543210"` |
| `recipientEmail` | String | N | — | RFC 5322 | Email recipient | `"ramesh@gmail.com"` |
| `type` | String (enum) | Y | — | See §17 `NotificationType` | Notification event type | `"appointment_confirmed"` |
| `channel` | String (enum) | Y | — | See §17 `NotificationChannel` | Delivery channel | `"email"` |
| `subject` | String | N | — | max 300 chars | Email subject or push title | `"Your appointment is confirmed"` |
| `body` | String | Y | — | max 5000 chars | Full rendered message body | `"Dear Ramesh, your appointment..."` |
| `status` | String (enum) | Y | `"pending"` | See §17 `NotificationStatus` | Delivery status | `"delivered"` |
| `providerResponse` | String | N | — | max 2000 chars | Raw provider response / message ID | `"MSG_ID:SM123abc"` |
| `retryCount` | Number | Y | `0` | 0–5 | Number of delivery attempts | `0` |
| `nextRetryAt` | Date | N | — | Set on failure | Next scheduled retry | — |
| `referenceId` | ObjectId | N | — | Polymorphic | ID of the entity that triggered this notification | — |
| `referenceType` | String (enum) | N | — | See §17 `NotificationRefType` | Collection of referenceId | `"appointments"` |
| `isRead` | Boolean | Y | `false` | — | For in-app: read status | `false` |
| `readAt` | Date | N | — | Set when isRead→true | In-app read timestamp | — |
| `createdAt` | Date | auto | `Date.now` | — | — | — |
| `updatedAt` | Date | auto | `Date.now` | — | — | — |

**Indexes:** `clinicId + recipientUserId + isRead` (in-app feed), `status + nextRetryAt` (retry scheduler), `type + createdAt`

---

## 16. `auditLogs`

Immutable write-only records of every sensitive action. These records must never be updated or deleted within the retention period.

| Field | Type | Required | Default | Validation | Description | Example |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | auto | — | — | Log entry ID | — |
| `clinicId` | ObjectId | Y | — | Must exist | Tenant | — |
| `actorId` | ObjectId (ref: users) | Y | — | Must exist | User who performed the action | — |
| `actorRole` | String (enum) | Y | — | See §17 `UserRole` | Role of actor at time of action | `"receptionist"` |
| `action` | String (enum) | Y | — | See §17 `AuditAction` | The action performed | `"patient.create"` |
| `targetCollection` | String | Y | — | max 50 chars | MongoDB collection affected | `"patients"` |
| `targetId` | ObjectId | N | — | Polymorphic | Document affected | — |
| `previousState` | Mixed | N | — | — | Snapshot before change (for updates) | `{ isActive: true }` |
| `newState` | Mixed | N | — | — | Snapshot after change | `{ isActive: false }` |
| `ipAddress` | String | N | — | IPv4/IPv6 | Client IP address | `"203.0.113.42"` |
| `userAgent` | String | N | — | max 500 chars | Browser/client user-agent | `"Mozilla/5.0..."` |
| `sessionId` | String | N | — | max 100 chars | JWT `jti` or session identifier | — |
| `metadata` | Object | N | `{}` | — | Additional context (e.g. reason, notes) | `{ reason: "Duplicate record" }` |
| `createdAt` | Date | auto | `Date.now` | — | Action timestamp | `2024-06-01T09:14:22Z` |

**Indexes:** `clinicId + actorId`, `clinicId + action`, `clinicId + createdAt` (TTL: 7 years)

---

## 17. Enum Reference

This section lists every string-enum value used across all collections.

### `UserRole`
| Value | Description |
|---|---|
| `admin` | Clinic owner / administrator |
| `doctor` | Medical practitioner |
| `receptionist` | Front-desk staff |
| `patient` | Registered patient |

### `Gender`
| Value |
|---|
| `male` |
| `female` |
| `other` |
| `prefer_not_to_say` |

### `BloodGroup`
| Value |
|---|
| `A+`, `A-` |
| `B+`, `B-` |
| `AB+`, `AB-` |
| `O+`, `O-` |
| `unknown` |

### `MaritalStatus`
| Value |
|---|
| `single` |
| `married` |
| `divorced` |
| `widowed` |
| `other` |

### `AppointmentType`
| Value | Description |
|---|---|
| `regular` | Standard new appointment |
| `follow_up` | Scheduled follow-up visit |
| `walk_in` | No prior appointment; registered at desk |
| `emergency` | Emergency / priority visit |

### `AppointmentStatus`
| Value | Description |
|---|---|
| `pending` | Booked, awaiting confirmation |
| `confirmed` | Confirmed by clinic staff |
| `checked_in` | Patient has arrived (visit created) |
| `in_consultation` | Currently with doctor |
| `completed` | Consultation finished |
| `cancelled` | Cancelled by patient or staff |
| `no_show` | Did not arrive |
| `rescheduled` | Rebooked to another slot |

### `VisitStatus`
| Value | Description |
|---|---|
| `checked_in` | Patient at reception |
| `waiting` | In queue, waiting to be called |
| `consultation_in_progress` | Currently with doctor |
| `completed` | Consultation done |
| `billed` | Invoice generated |
| `paid` | Payment received |

### `QueuePriority`
| Value | Description |
|---|---|
| `normal` | Regular turn-based |
| `priority` | Elderly / differently-abled |
| `emergency` | Medical emergency, go to front |

### `QueueStatus`
| Value | Description |
|---|---|
| `waiting` | In queue |
| `called` | Doctor called this patient |
| `in_consultation` | Consultation ongoing |
| `completed` | Done |
| `skipped` | Temporarily skipped |
| `cancelled` | Removed from queue |

### `LeaveType`
| Value |
|---|
| `planned` |
| `emergency` |
| `holiday` |
| `conference` |
| `other` |

### `LeaveStatus`
| Value |
|---|
| `pending` |
| `approved` |
| `rejected` |
| `cancelled` |

### `InvoiceStatus`
| Value |
|---|
| `unpaid` |
| `partially_paid` |
| `paid` |
| `waived` |
| `refunded` |

### `PaymentMethod`
| Value |
|---|
| `cash` |
| `card` |
| `upi` |
| `net_banking` |
| `insurance` |
| `other` |

### `FollowUpStatus`
| Value |
|---|
| `pending` |
| `reminded` |
| `completed` |
| `missed` |
| `cancelled` |

### `MedicationRoute`
| Value |
|---|
| `oral` |
| `topical` |
| `intravenous` |
| `intramuscular` |
| `subcutaneous` |
| `inhalation` |
| `sublingual` |
| `other` |

### `ReportType`
| Value | Example |
|---|---|
| `lab` | Blood test, urine analysis |
| `radiology` | X-Ray, CT, MRI |
| `cardiology` | ECG, Echo |
| `pathology` | Biopsy, histology |
| `other` | Any other report |

### `NotificationType`
| Value |
|---|
| `appointment_confirmed` |
| `appointment_reminder` |
| `appointment_cancelled` |
| `appointment_rescheduled` |
| `checkin_confirmed` |
| `queue_called` |
| `prescription_ready` |
| `followup_reminder` |
| `invoice_generated` |
| `report_uploaded` |

### `NotificationChannel`
| Value |
|---|
| `email` |
| `sms` |
| `in_app` |

### `NotificationStatus`
| Value |
|---|
| `pending` |
| `sent` |
| `delivered` |
| `failed` |
| `retrying` |

### `NotificationRefType`
| Value |
|---|
| `appointments` |
| `visits` |
| `prescriptions` |
| `invoices` |
| `followUps` |
| `medicalReports` |

### `AuditAction`
| Value | Description |
|---|---|
| `user.login` | Successful login |
| `user.logout` | User logout |
| `user.create` | New user created |
| `user.update` | User record modified |
| `user.deactivate` | User soft-deleted |
| `patient.create` | Patient registered |
| `patient.update` | Patient profile edited |
| `appointment.create` | Appointment booked |
| `appointment.cancel` | Appointment cancelled |
| `appointment.reschedule` | Appointment rescheduled |
| `visit.checkin` | Patient checked in |
| `visit.complete` | Visit marked complete |
| `prescription.create` | Prescription issued |
| `prescription.pdf_download` | PDF downloaded |
| `report.upload` | Medical report uploaded |
| `report.download` | Report file downloaded |
| `invoice.create` | Invoice generated |
| `payment.record` | Payment recorded |
| `settings.update` | Clinic settings changed |
| `doctor.leave.create` | Doctor leave added |

### `DayOfWeek`
| Value |
|---|
| `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` |
