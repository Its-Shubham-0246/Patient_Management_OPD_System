# Smart OPD – Clinical Workflows & Activity Diagrams
## Single-Clinic Outpatient Department Management System

> **Document ID:** 05-Workflow-Activity-Diagrams.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Modeling Standards:** UML 2.5 via Mermaid (Sequence Diagrams, Activity Flowcharts, State Machines)  

---

## 1. Master Outpatient Lifecycle Architecture

The outpatient care pathway in Smart OPD transitions through five distinct phases:

```mermaid
flowchart LR
    A[1. Ingress & Booking] -->|Scheduled Slot / Walk-in| B[2. Check-In & Token]
    B -->|Waiting Lounge| C[3. Live Queue Call]
    C -->|Consultation Room| D[4. Doctor Workspace & Rx]
    D -->|Cashier Desk| E[5. Billing & Checkout]
    E -->|Automated T-48h| F[6. Follow-up Reminder]
```

---

## 2. Core Clinical & Administrative Sequence Diagrams

### Workflow 01: Patient Self-Registration & Portal Access
*A new patient creates an account on the patient portal, submits demographics, provides DPDP consent, and receives a unique UHID.*

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant UI as Patient Portal (React)
    participant API as Express API (/auth/register)
    participant PatientService as Patient Service
    participant DB as MongoDB (Users & Patients)
    participant NS as Notification Service

    P->>UI: Enters Full Name, Mobile, Email, Password, Demographics
    P->>UI: Checks DPDP Digital Consent Checkbox
    UI->>UI: Client Zod Validation (Phone format, Password complexity)
    UI->>API: POST /api/v1/auth/register { fullName, phone, email, password, consentGiven }
    API->>API: Rate Limiter Check (Max 10 / 15m)
    API->>DB: Check if phone already registered
    alt Phone already exists
        API-->>UI: 409 Conflict (PHONE_ALREADY_REGISTERED)
        UI-->>P: Displays error: "An account with this phone already exists."
    else Phone is unique
        API->>PatientService: Generate Sequential UHID (OPD-YYMM-XXXXX)
        API->>DB: Hash password with bcrypt (cost factor 12)
        API->>DB: Insert User (role: PATIENT) + Insert Patient Profile
        API->>NS: Trigger Welcome SMS / Email with UHID
        NS-->>P: Dispatches SMS: "Welcome to {{CLINIC_NAME}}. Your UHID is OPD-2611-00042."
        API-->>UI: 201 Created (Access JWT + httpOnly Refresh Cookie)
        UI-->>P: Redirect to Portal Dashboard with UHID Badge
    end
```

---

### Workflow 02: Online Appointment Booking & Slot Locking
*A patient books a slot via the online portal. The engine verifies doctor availability and commits the slot atomically.*

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant UI as Patient Portal (React)
    participant API as Express API (/appointments)
    participant Engine as Slot Engine
    participant DB as MongoDB (Appointments)
    participant NS as Notification Service

    P->>UI: Selects Doctor, Date & View Slots
    UI->>API: GET /api/v1/doctors/:id/available-slots?date=YYYY-MM-DD
    API->>Engine: Calculate free slots (Schedule - Booked - Leaves)
    Engine-->>API: Return discrete slot array
    API-->>UI: Render available slot chips
    P->>UI: Selects "10:15 AM" & Clicks "Confirm Booking"
    UI->>API: POST /api/v1/appointments (Atomic reservation payload)
    API->>DB: startTransaction()
    API->>DB: Check for existing active slot
    alt Slot is free
        API->>DB: Insert Appointment (Status: CONFIRMED)
        API->>DB: commitTransaction()
        API->>NS: Trigger APPT_CONFIRMED (SMS + Email)
        NS-->>P: Dispatches Confirmation SMS & Email
        API-->>UI: 201 Created (Appointment Details)
        UI-->>P: Display Confirmation Screen & Arrival Instructions
    else Slot just taken by concurrent user
        API->>DB: abortTransaction()
        API-->>UI: 409 Conflict (Slot already reserved)
        UI-->>P: Show toast alert & refresh available slot grid
    end
```

---

### Workflow 03: Smart Specialist Doctor Auto-Allocation & Receptionist Override
*Patient requests a specialty or receptionist books walk-in; the engine scores and assigns the lowest-workload doctor, with authorized override support.*

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient / Receptionist
    participant UI as Booking Interface (React)
    participant API as Express API (/appointments/auto-allocate)
    participant Engine as DoctorAllocationService
    participant DB as MongoDB (Appointments & Doctors)
    participant Audit as AuditLog Service

    User->>UI: Selects Specialty "General Medicine" & Target Date
    UI->>API: GET /api/v1/doctors/allocate/specialty?dept=General+Medicine&date=YYYY-MM-DD
    API->>Engine: computeOptimalSpecialist(department, date, timeSlot)
    Engine->>DB: Query verified active doctors in department
    Engine->>DB: Filter out doctors on leave or outside working shifts
    Engine->>DB: Calculate Workload Index (W_i) for each candidate
    Note over Engine: W_i = (Committed Mins / Remaining Mins) * (1 + Capacity Saturation)
    Engine-->>API: Return Ranked Candidates & Recommended Doctor (lowest W_i)
    API-->>UI: Render Allocation Card: Recommended Dr. Sharma (W_i: 0.34)
    
    alt User Accepts Auto-Allocation
        User->>UI: Clicks "Confirm Auto-Allocated Appointment"
        UI->>API: POST /api/v1/appointments/auto-allocate
        API->>DB: Atomic session: Lock slot & commit appointment (method: AUTOMATIC)
        API-->>UI: 201 Created (Confirmed with Dr. Sharma)
    else Receptionist Overrides Recommendation
        User->>UI: Selects Dr. Sunil Mehta (W_i: 0.78) & Specifies Override Reason
        UI->>API: POST /api/v1/appointments/override-allocation
        API->>DB: Atomic session: Commit appointment (method: RECEPTIONIST_OVERRIDE)
        API->>Audit: Record DOCTOR_ALLOCATION_OVERRIDDEN { recommended, selected, reason }
        API-->>UI: 201 Created (Confirmed with Dr. Mehta, Audit Logged)
    end
```

---

### Workflow 04: Receptionist Walk-in & Phone Booking
*Receptionist books an appointment or walk-in patient from the front-desk dashboard.*

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Walk-in / Phone Patient
    actor Rec as Receptionist
    participant UI as Reception Console
    participant API as Express API (/patients & /appointments)
    participant DB as MongoDB

    Patient->>Rec: Requests consultation in "Orthopedics"
    Rec->>UI: Types phone number into Search Bar (Alt+C)
    UI->>API: GET /api/v1/patients/search?q=9876543210
    API-->>UI: Patient Record Found (or opens New Patient drawer Alt+N)
    Rec->>UI: Selects "Book Appointment" or "Immediate Walk-In"
    UI->>API: GET /api/v1/doctors/allocate/specialty?dept=Orthopedics&date=today
    API-->>UI: Recommends Dr. Verma (Room 2, Workload: Low)
    Rec->>UI: Confirms selection or picks slot
    UI->>API: POST /api/v1/appointments { channel: "RECEPTIONIST_WALKIN", doctorId: "..." }
    API->>DB: Commit reservation
    API-->>UI: 201 Created (Booking confirmed)
    Rec-->>Patient: "Your appointment is booked with Dr. Verma in Room 2."
```

---

### Workflow 05: Physical OPD Check-In & Sequential Token Generation (Path A & Path B)
*Arriving patients receive daily sequential tokens. Supports both pre-booked appointment check-in and direct walk-in tokens.*

```mermaid
sequenceDiagram
    autonumber
    actor P as Arriving Patient
    actor R as Front-Desk Receptionist
    participant UI as Reception Console
    participant API as Express API (/appointments/:id/checkin & /queue/walkin)
    participant DB as MongoDB (Visits & QueueEntries)
    participant WS as Socket.IO Server
    participant TV as Waiting Room Display

    P->>R: Reports to Front Desk (States Phone Number or UHID)
    R->>UI: Types mobile number in Quick Search (Alt+C)
    UI->>API: GET /api/v1/patients/search?q=9876543210
    API-->>UI: Returns Patient Profile & Appointment Status

    alt Path A: Patient Holds Pre-Booked Appointment for Today
        R->>UI: Clicks "CHECK-IN & ISSUE TOKEN"
        UI->>API: PUT /api/v1/appointments/:id/checkin
        API->>DB: startTransaction()
        API->>DB: Update Appointment -> CHECKED_IN
        API->>DB: Create Visit Record (visitType: FIRST_VISIT / FOLLOW_UP)
        API->>DB: Query MAX(tokenNumber) for Doctor today
        API->>DB: Insert QueueEntry (tokenNumber = MAX + 1, Status: WAITING)
        API->>DB: commitTransaction()
    else Path B: Direct Unscheduled Walk-In (No Prior Appointment)
        R->>UI: Clicks "QUICK WALK-IN TOKEN" & Selects Specialty
        UI->>API: POST /api/v1/queue/walkin { patientId, doctorId, visitType: 'FIRST_VISIT' }
        API->>DB: startTransaction()
        API->>DB: Create Visit Record directly
        API->>DB: Query MAX(tokenNumber) for Doctor today
        API->>DB: Insert QueueEntry (tokenNumber = MAX + 1, Status: WAITING)
        API->>DB: commitTransaction()
    end

    API->>WS: Emit 'queue:updated' { doctorId, waitingCount, latestToken }
    WS->>TV: Broadcast updated waiting list
    API-->>UI: 200 OK (Assigned Token #14, Room 1)
    UI-->>R: Display Token Card & Trigger Receipt/Token Print (Alt+P)
    R-->>P: Hands physical token slip: "Please be seated in Lounge. Token #14, Room 1."
```

---

### Workflow 06: Live Queue Advance & Waiting Room Call
*Doctor finishes consultation, clicks "Call Next", notifying waiting room screen and patient.*

```mermaid
sequenceDiagram
    autonumber
    actor D as Doctor
    participant DOC_UI as Doctor Workspace
    participant API as Express API (/queue/:id/call-next)
    participant DB as MongoDB (QueueEntries)
    participant WS as Socket.IO Server
    participant TV as Waiting Room Display
    actor P as Waiting Patient

    D->>DOC_UI: Clicks "CALL NEXT ▶"
    DOC_UI->>API: PUT /api/v1/queue/:entryId/call-next
    API->>DB: Update QueueEntry -> CALLED (calledAt = NOW)
    API->>WS: Emit 'queue:called' { token: 14, doctor: "Dr. Sharma", room: "Room 1", name: "Rahul M." }
    WS->>TV: Broadcast 'queue:called'
    TV->>TV: Play Audible Notification Chime 🔔
    TV->>TV: Flash Token #14 -> Room 1 on Fullscreen Display
    P->>TV: Sees token and hears room announcement
    P->>D: Enters Doctor Consultation Room 1
    D->>DOC_UI: Clicks "START CONSULTATION"
    DOC_UI->>API: PUT /api/v1/queue/:entryId/start
    API->>DB: Update QueueEntry & Visit -> IN_CONSULTATION
```

---

### Workflow 07: Clinical Consultation, Prescription & PDFKit Streaming
*Doctor evaluates patient, enters clinical findings, prescribes medications, and finalizes signed PDF.*

```mermaid
sequenceDiagram
    autonumber
    actor D as Doctor
    participant UI as Doctor Workspace
    participant API as Express API (/prescriptions)
    participant PDF as PDFKit Streaming Engine
    participant S3 as Cloudinary Storage
    participant DB as MongoDB (Prescriptions)

    D->>UI: Reviews Patient Allergy Alert (⚠️ PENICILLIN) in Header
    D->>UI: Inputs Chief Complaints, Vitals (BP 120/80) & Diagnosis
    D->>UI: Adds Medications (Drug, Dose, Frequency, Duration)
    D->>UI: Enters Advice & Selects Follow-Up: "Review after 5 days"
    D->>UI: Clicks "Preview & Finalize Prescription"
    UI->>API: POST /api/v1/prescriptions/:visitId
    API->>DB: Save Prescription Record (Immutable)
    API->>PDF: Generate A4 Vector Prescription with QR Code
    PDF-->>API: Stream PDF Binary Buffer
    API->>S3: Async upload copy to /clinics/:id/prescriptions/
    API-->>UI: 201 Created (PDF URL & Verification Token)
    UI-->>D: Display embedded PDF viewer with one-click print
    D->>UI: Clicks "Finish Encounter"
```

---

### Workflow 08: Diagnostic Lab/Radiology Report Upload & Presigned URL Access
*Front desk or doctor uploads diagnostic report, stored securely in Cloudinary, accessed via signed URL.*

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Receptionist / Doctor
    participant UI as Web Dashboard
    participant API as Express API (/reports)
    participant Cloud as Cloudinary Vault
    participant DB as MongoDB (MedicalReports)
    actor Patient as Patient

    Staff->>UI: Drags & drops Lab Report PDF (e.g., Lipid_Profile.pdf)
    UI->>API: POST /api/v1/reports/patient/:patientId (multipart/form-data)
    API->>API: Validate MIME type (PDF/JPG/PNG) & file size (< 10MB)
    API->>Cloud: Upload binary to private clinic folder
    Cloud-->>API: Return secure asset publicId & metadata
    API->>DB: Insert MedicalReport record
    API-->>UI: 201 Created (Report attached)
    
    Patient->>UI: Navigates to /portal/reports
    UI->>API: GET /api/v1/reports/:id/download
    API->>API: Check RBAC ownership (Patient owns report)
    API->>Cloud: Generate pre-signed URL (TTL = 15 minutes)
    Cloud-->>API: Return time-limited URL
    API-->>UI: Redirect to pre-signed download URL
```

---

### Workflow 09: Emergency Priority Escalation
*A patient presents with acute trauma or chest pain requiring immediate queue override.*

```mermaid
sequenceDiagram
    autonumber
    actor Nurse as Receptionist / Triage Nurse
    actor Doc as Clinician
    participant UI as Reception Console
    participant API as Express API (/queue/priority)
    participant DB as MongoDB
    participant WS as Socket.IO Gateway
    participant TV as Waiting Room Display

    Nurse->>Doc: Alerts clinician of acute emergency presentation
    Doc->>Nurse: Authorizes immediate Emergency Override
    Nurse->>UI: Clicks "EMERGENCY BUMP" on patient entry
    UI->>API: PUT /api/v1/queue/:entryId/priority { priority: 1, isEmergency: true }
    API->>DB: Set priorityOrder = 1, tokenNumber = "EMERGENCY-01"
    API->>WS: Emit 'queue:emergency' { room: "Room 1", token: "EMERGENCY" }
    WS->>TV: Flash High-Visibility Red Banner: "EMERGENCY CASE IN ROOM 1"
    API-->>UI: 200 OK (Emergency token assigned)
    Nurse->>Doc: Escorts patient directly into consultation room
```

---

### Workflow 10: Doctor Leave Management & Automated Appointment Rescheduling
*Doctor marks unplanned leave; system identifies conflicting appointments and notifies patients.*

```mermaid
sequenceDiagram
    autonumber
    actor Doc as Doctor
    participant UI as Doctor / Admin Console
    participant API as Express API (/doctors/:id/leaves)
    participant DB as MongoDB (DoctorLeaves & Appointments)
    participant NS as Notification Service
    actor Patient as Affected Patients

    Doc->>UI: Submits Leave Request (Date: Tomorrow, Reason: "Medical Emergency")
    UI->>API: POST /api/v1/doctors/:id/leaves
    API->>DB: Insert DoctorLeave record
    API->>DB: Query all Appointments for Doctor on that Date (status: CONFIRMED)
    API->>DB: Update Appointments -> SCHEDULE_CONFLICT_LEAVE
    loop For each affected appointment
        API->>NS: Trigger DOCTOR_LEAVE_NOTICE (SMS + Email)
        NS-->>Patient: Dispatches SMS: "Dr. Sharma is unavailable tomorrow. Click here to reschedule with priority."
    end
    API-->>UI: 201 Created (Leave logged, 12 patients notified)
```

---

## 3. Queue State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED: Online or Phone Booking
    SCHEDULED --> CHECKED_IN: Physical Arrival at Reception
    [*] --> CHECKED_IN: Walk-In Registration
    CHECKED_IN --> WAITING: Token Assigned (QueueEntry Created)
    WAITING --> CALLED: Doctor Clicks "Call Next"
    CALLED --> IN_CONSULTATION: Patient Enters Room
    CALLED --> SKIPPED: Patient Not Present after 3 Calls
    SKIPPED --> WAITING: Receptionist Recalls Token
    IN_CONSULTATION --> COMPLETED: Prescription Signed
    COMPLETED --> [*]: Billed & Discharged
    SCHEDULED --> CANCELLED: Patient or Clinic Cancels
    SCHEDULED --> NO_SHOW: Grace Period Exceeded (T + 20m)
```

---

## 4. Cashier Billing & Settlement Flowchart

```mermaid
flowchart TD
    Start([Encounter Completed]) --> FetchConsultation[System Fetches Consultation Fee from Doctor Profile]
    FetchConsultation --> AddProcedures{Any Lab or Procedure Charges?}
    AddProcedures -- Yes --> InputItems[Cashier Adds Procedures e.g., ECG, Dressing]
    AddProcedures -- No --> CheckDiscount{Authorized Discount Applied?}
    InputItems --> CheckDiscount
    CheckDiscount -- Yes --> ApplyDiscount[Deduct Discount with Admin Approval Flag]
    CheckDiscount -- No --> CalcTotal[Calculate Tax & Net Total Payable]
    ApplyDiscount --> CalcTotal
    CalcTotal --> SelectMode[Select Payment Mode: Cash / UPI QR / Card]
    SelectMode --> Settle[Record Payment in Ledger & Update Invoice to PAID]
    Settle --> PrintReceipt[Stream PDFKit Itemized Money Receipt & Hand to Patient]
    PrintReceipt --> End([Checkout Complete])
```
