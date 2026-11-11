# Smart OPD – UI/UX Design Specification & Figma-Ready Wireframes
## Single-Clinic Outpatient Department Management System

> **Document ID:** 02-UI-UX-Design.md  
> **Version:** 2.0.0 (Master Release)  
> **Status:** Stage A Architectural Baseline – Fully Detailed  
> **Date:** 2026-11-11  
> **Design Framework:** Tailwind CSS v3.4 + shadcn/ui + Radix UI Primitives + Lucide Icons  
> **Target Aesthetics:** Professional Hospital ERP (Deep Navy `#1e2d4a` & Clean Slate `#f8fafc`, High-Density Information Hierarchy)  

---

## 1. Design System & Tokens

### 1.1 Color Palette & Semantic System

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLOR SYSTEM SPECIFICATION                      │
├───────────────────┬──────────────┬──────────────┬──────────────────────┤
│ Token Name        │ Hex Code     │ Tailwind Cls │ Semantic Usage       │
├───────────────────┼──────────────┼──────────────┼──────────────────────┤
│ Primary Navy      │ #1E2D4A      │ bg-slate-900 │ Main Sidebar, Topbar │
│ Accent Blue       │ #3B6FCE      │ bg-blue-600  │ Primary CTA Buttons  │
│ Clinic Teal       │ #0D9488      │ bg-teal-600  │ Active Status Badges │
│ Neutral Canvas    │ #F8FAFC      │ bg-slate-50  │ App Background       │
│ Surface White     │ #FFFFFF      │ bg-white     │ Data Cards, Modals   │
│ Border Light      │ #E2E8F0      │ border-slate │ Dividers, Row Borders│
│ Text Primary      │ #0F172A      │ text-slate-900│ Headings, Body Text │
│ Text Muted        │ #64748B      │ text-slate-500│ Subtitles, Captions │
│ Clinical Alert    │ #DC2626      │ bg-red-600   │ Allergies, Emergency │
│ Success Green     │ #16A34A      │ bg-green-600 │ Paid, Completed Token│
│ Warning Amber     │ #D97706      │ bg-amber-600 │ Delayed Queue, Due   │
└───────────────────┴──────────────┴──────────────┴──────────────────────┘
```

### 1.2 Typography Hierarchy (Inter Font Family)
- **Display (Waiting Room TV)**: 72px / Line Height: 80px / Weight: 800 (ExtraBold)
- **H1 (Page Headers)**: 24px / Line Height: 32px / Weight: 700 (Bold)
- **H2 (Card Headers & Section Titles)**: 18px / Line Height: 26px / Weight: 600 (SemiBold)
- **H3 (Subsections & Table Headers)**: 14px / Line Height: 20px / Weight: 600 (SemiBold) – Uppercase tracking
- **Body Regular**: 14px / Line Height: 20px / Weight: 400 (Regular)
- **Body Compact (Data Tables)**: 13px / Line Height: 18px / Weight: 400 (Regular)
- **Captions & Metadata**: 11px / Line Height: 16px / Weight: 500 (Medium)

---

## 2. Component Inventory & Ergonomics (shadcn/ui + Radix UI)

- **Navigation**: Sidebar with collapsible rail, Breadcrumb navigation, Command palette (`⌘K` / `Alt+C` patient quick-search).
- **Forms**: React Hook Form + Zod-controlled `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup`, `Calendar / DatePicker`.
- **Data Display**: TanStack `Table` with sorting/pagination, `Badge` (pill status badges), `Card` with subtle 1px border.
- **Feedback**: `Sonner` toast notifications, `Dialog` (standard confirmation modals), `Sheet` (slide-out right drawer for quick patient registration), `Skeleton` loaders.
- **Keyboard Shortcut Ergonomics**:
  - `Alt + C` or `⌘K` : Focus instant patient search bar.
  - `Alt + N` : Slide open New Patient Registration drawer.
  - `Alt + P` : Trigger print dialogue for active Token Slip or Billing Receipt.
  - `Alt + Q` : Advance Live Queue to next patient ("Call Next").
- **Bilingual UI Toggle**: Floating or topbar switch (`EN` / `हिंदी`) powered by `react-i18next` across all portals.

---

## 3. Screen-by-Screen UI Specifications & Wireframes

### 3.1 Clinic Admin Dashboard (`/admin`)

#### Screen A1: Admin Overview & Operational Cockpit (`/admin/dashboard`)
*High-density summary of today's outpatient operations across all doctors:*

```
+-----------------------------------------------------------------------------------------------+
| [🏥 CLINIC LOGO] {{CLINIC_NAME}} | Admin Portal                [🔍 Search] [🔔 3] [Dr. Owner ▼]|
+-----------------------------------------------------------------------------------------------+
| [📊 Overview   ] | TODAY'S CLINIC SUMMARY                                                     |
| [👨‍⚕️ Doctors    ] | +-------------------+ +-------------------+ +-------------------+ +---------+ |
| [📅 Schedule   ] | | TOTAL BOOKINGS    | | CHECKED-IN (OPD)  | | IN-CONSULTATION   | | REVENUE | |
| [👥 Staff      ] | | 48                | | 32                | | 4 Active Doctors  | | ₹ 24,500| |
| [💳 Billing    ] | +-------------------+ +-------------------+ +-------------------+ +---------+ |
| [📈 Analytics  ] |                                                                             |
| [📜 Audit Logs ] | ACTIVE OPD QUEUE MONITOR (ALL CONSULTING ROOMS)                             |
| [⚙️ Settings   ] | +-------------------------------------------------------------------------+ |
|                  | | Doctor Name       | Department     | Room  | Waiting | In-Clinic | Status| |
|                  | | Dr. Sharma (MD)   | Gen. Medicine  | Rm 1  | 8 pts   | Token #14 | ACTIVE| |
|                  | | Dr. Verma (MS)    | Orthopedics    | Rm 2  | 5 pts   | Token #08 | ACTIVE| |
|                  | | Dr. Gupta (DGO)   | Gynecology     | Rm 3  | 2 pts   | Token #06 | ACTIVE| |
|                  | +-------------------------------------------------------------------------+ |
|                  |                                                                             |
|                  | RECENT FINANCIAL COLLECTIONS (TODAY)                                        |
|                  | [All Cashiers ▼] [Export CSV]                                               |
|                  | +-------------+----------------------+-----------+----------+-------------+ |
|                  | | Inv #       | Patient Name (UHID)  | Service   | Mode     | Amount      | |
|                  | | INV-2026-42 | Rahul Mehta (00042)  | Consult   | UPI QR   | ₹ 500.00    | |
|                  | | INV-2026-41 | Anita Rao (00038)    | ECG+Dres  | Cash     | ₹ 850.00    | |
+------------------+-----------------------------------------------------------------------------+
```

#### Screen A2: Doctor Management & Capacity Configuration (`/admin/doctors`)
*Admin manages physician credentials, specialties, room assignments, and auto-allocation capacity:*

```
+-----------------------------------------------------------------------------------------------+
| DOCTOR DIRECTORY & CAPACITY CONFIGURATION                         [+ Add New Doctor Account]  |
+-----------------------------------------------------------------------------------------------+
| [🔍 Filter by Department: All ▼] [Status: Active ▼]                                          |
| +---------------------+-----------------+------+------+--------+----------+---------+-------+ |
| | Doctor Name         | Specialty       | Room | Fee  | Cap/Day| Avg Mins | Auto-Alc| Action| |
| +---------------------+-----------------+------+------+--------+----------+---------+-------+ |
| | Dr. Rajesh Sharma   | General Medicine| Rm 1 | ₹500 | 25 pts | 15 mins  | [ON  ]  | [Edit]| |
| | Dr. Sunil Mehta     | General Medicine| Rm 3 | ₹500 | 20 pts | 15 mins  | [ON  ]  | [Edit]| |
| | Dr. Ananya Verma    | Orthopedics     | Rm 2 | ₹800 | 20 pts | 20 mins  | [ON  ]  | [Edit]| |
| | Dr. Priya Gupta     | Gynecology      | Rm 4 | ₹800 | 25 pts | 20 mins  | [ON  ]  | [Edit]| |
| | Dr. H. C. Talwar    | Senior Neuro    | Rm 5 |₹1500 | 10 pts | 30 mins  | [OFF ]  | [Edit]| |
| +---------------------+-----------------+------+------+--------+----------+---------+-------+ |
+-----------------------------------------------------------------------------------------------+
```

#### Screen A3: Clinic Master Settings Console (`/admin/settings`)
*Admin configures clinic branding, operating shifts, fee schedules, and allocation modes:*

```
+-----------------------------------------------------------------------------------------------+
| CLINIC CONFIGURATION & OPERATING RULES                                                        |
+-----------------------------------------------------------------------------------------------+
| [ Clinic Profile ] [ Operating Hours & Shifts ] [ Appointment & Allocation Rules ] [ Billing ]|
|                                                                                               |
| SMART SPECIALIST AUTO-ALLOCATION SETTINGS:                                                    |
| Default Allocation Mode:                                                                      |
| (•) AUTOMATIC ALLOCATION (System recommends lowest-workload specialist)                       |
| ( ) PATIENT CHOICE (Patient browses and chooses specialist manually)                          |
| ( ) HYBRID (Auto-assign with patient override option)                                         |
|                                                                                               |
| Workload Calculation Weights:                                                                 |
| Confirmed Appointments Weight: [ 1.00 ]   Waiting Queue Weight: [ 1.25 ]                      |
| In-Consultation Weight:        [ 1.50 ]   Max Daily Patient Threshold: [ 25 ]                 |
|                                                                                               |
| Receptionist Override Policy:                                                                 |
| [X] Allow Receptionists to manually override doctor allocation                                |
| [X] Require standardized reason selection for all manual overrides                           |
|                                                                                               |
| [SAVE CONFIGURATION CHANGES]                                                                  |
+-----------------------------------------------------------------------------------------------+
```

---

### 3.2 Doctor Clinical Workspace (`/doctor`)

#### Screen D1: Doctor Queue Roster & Consultation Workspace (`/doctor/workspace`)
*Ergonomic split-screen layout minimizing scrolling and clicks:*

```
+-----------------------------------------------------------------------------------------------+
| [🏥] Smart OPD | Dr. Sharma (Gen. Medicine) - Room 1           [LIVE QUEUE: 8 WAITING] [Logout]|
+-----------------------------------------------------------------------------------------------+
| QUEUED PATIENTS  | ACTIVE CONSULTATION: Rahul Mehta (UHID: OPD-2611-00042) | Age: 34 / M       |
| +--------------+ | Blood Group: B+ | Allergies: [⚠️ PENICILLIN] | BP: 128/82 | Temp: 98.6°F     |
| | Token #14 [▶]| +---------------------------------------------------------------------------+
| | Rahul Mehta  | | [ Clinical Findings ] [ Rx Prescription ] [ Past EMR History ] [ Reports ]|
| | 10:15 AM     | |                                                                           |
| +--------------+ | CHIEF COMPLAINTS & DURATION:                                               |
| | Token #15    | | [ Fever with chills x 3 days, dry cough, body ache                      ] |
| | Priya Singh  | |                                                                           |
| | 10:30 AM     | | PROVISIONAL DIAGNOSIS (ICD-10 Search):                                    |
| +--------------+ | [ J06.9 - Acute Upper Respiratory Infection                             ] |
| | Token #16    | |                                                                           |
| | Amit Kumar   | | Rx - MEDICATIONS:                                                         |
| | 10:45 AM     | | +-----------------------+---------+---------+----------+----------------+ |
| +--------------+ | | Drug Name             | Dosage  | Freq    | Duration | Timing         | |
|                  | | Tab. Paracetamol 650  | 1 Tab   | 1-0-1   | 3 Days   | After Food     | |
| [CALL NEXT ▶ ] | | Cap. Cefixime 200mg   | 1 Cap   | 1-0-1   | 5 Days   | After Food     | |
| [SKIP TOKEN  ] | | Syr. Ascoril-D        | 10 ml   | 0-0-1   | 5 Days   | At Bedtime     | |
| [EMERGENCY ⚠️] | +-----------------------+---------+---------+----------+----------------+ |
|                  | [+ Add Medication]                                                          |
|                  |                                                                             |
|                  | CLINICAL ADVICE & FOLLOW-UP:                                                |
|                  | Advice: [ Warm water gargles. Steam inhalation twice daily.              ] |
|                  | Follow-up: [ Review after 5 days (16-Nov-2026) or SOS                    ] |
|                  |                                                                             |
|                  | [🖨️ PREVIEW & SIGN RX (PDF)]           [💾 FINALIZE & CALL NEXT PATIENT ▶] |
+------------------+---------------------------------------------------------------------------+
```

---

### 3.3 Receptionist Front-Desk Console (`/reception`)

#### Screen R1: Receptionist Ingress, Check-In & Auto-Allocation (`/reception/dashboard`)

```
+-----------------------------------------------------------------------------------------------+
| [🏥] Smart OPD | Front Desk Receptionist (Console)             [⚡ QUICK WALK-IN] [New Pt Drawer]|
+-----------------------------------------------------------------------------------------------+
| [🔍 Quick Search: Enter Patient Mobile Number, UHID or Name...                          (⌘K)] |
+-----------------------------------------------------------------------------------------------+
| TODAY'S APPOINTMENT INGRESS & OPD CHECK-IN                                                     |
| Filter: [Doctor: All ▼] [Status: Confirmed / Arrived ▼] [Time: Morning Shift ▼]                |
| +-------+-------------+----------------------+-----------+----------+-----------------------+ |
| | Token | Appt Time   | Patient Name (UHID)  | Doctor    | Status   | Front-Desk Actions    | |
| +-------+-------------+----------------------+-----------+----------+-----------------------+ |
| | #14   | 10:15 AM    | Rahul Mehta (00042)  | Dr. Sharma| CHECKEDIN| [Print Token] [Bill]  | |
| | -     | 10:30 AM    | Priya Singh (00043)  | Dr. Sharma| CONFIRMED| [CHECK-IN & ISSUE #15]| |
| | -     | 10:45 AM    | Amit Kumar (00044)   | Dr. Sharma| CONFIRMED| [CHECK-IN & ISSUE #16]| |
| | #08   | 10:30 AM    | Suresh Patel (00031) | Dr. Verma | IN-CONS  | [View Bill Receipt]   | |
| +-------+-------------+----------------------+-----------+----------+-----------------------+ |
|                                                                                               |
| ⚡ RECEPTIONIST SMART DOCTOR AUTO-ALLOCATION DRAWER:                                          |
| Patient: Walk-in Patient | Department: General Medicine                                       |
| SYSTEM RECOMMENDED: 🏆 Dr. Rajesh Sharma (Workload: 0.34 - LOW)   [1-CLICK AUTO ALLOCATE]     |
| [Show Workload Breakdown & Override Options ▼]                                               |
+-----------------------------------------------------------------------------------------------+
```

---

### 3.4 Live Waiting Room Fullscreen Display Board (`/display/waiting-room`)

*Targeted for 4K / 1080p Smart TVs placed in the clinic patient lounge:*

```
+===============================================================================================+
|                                    {{CLINIC_NAME}} OPD QUEUE                                  |
|                               Current Time: 10:28 AM | Monday                                 |
+===============================================================================================+
|                                                                                               |
|     NOW CALLING:                                                                              |
|     +-----------------------------------------------------------------------------------+     |
|     |                                                                                   |     |
|     |            TOKEN # 14   --->   ROOM 1 (Dr. Sharma - General Medicine)             |     |
|     |                                                                                   |     |
|     |                     Patient: RAHUL M. (UHID: OPD-2611-00042)                      |     |
|     |                                                                                   |     |
|     +-----------------------------------------------------------------------------------+     |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
| UPCOMING TOKENS (PLEASE BE SEATED IN THE LOUNGE):                                             |
|                                                                                               |
|  ROOM 1 (Dr. Sharma):   [ Token #15 - Priya S. ]    [ Token #16 - Amit K. ]                   |
|  ROOM 2 (Dr. Verma):    [ Token #09 - Geeta B. ]    [ Token #10 - Rajesh M. ]                 |
|  ROOM 3 (Dr. Gupta):    [ Token #07 - Sunita P. ]   [ Token #08 - Meena R. ]                  |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
| 📢 Please proceed to your consultation room when your token is chimed and displayed.         |
+===============================================================================================+
```

---

### 3.5 Patient Mobile Portal (`/portal` - Responsive 375px)

```
+-----------------------------------+
| 🏥 {{CLINIC_NAME}}         [👤 John]
+-----------------------------------+
| YOUR ACTIVE VISIT TODAY:
| +-------------------------------+
| | 🎫 YOUR OPD TOKEN: #15        |
| | Dr. Sharma (Room 1)           |
| | Status: 1 PATIENT AHEAD OF YOU|
| | Est. Consultation: ~10 mins   |
| +-------------------------------+
|
| BOOK AN APPOINTMENT:
| 1. Select Specialty: [General Med ▼]
| 2. Doctor Allocation Mode:
|    (•) Smart Auto-Assign Doctor
|        (Dr. Sharma - Est. wait 10m)
|    ( ) Choose Specific Doctor
| 3. Pick Date: [ Tomorrow, 12 Nov ]
| 4. Pick Slot: [ 10:15 AM ]
| [CONFIRM APPOINTMENT]
|
| QUICK LINKS:
| [ 📄 My Prescriptions (PDF)   ]
| [ 🧪 My Diagnostic Reports    ]
| [ 💳 Billing & Payment Ledger ]
+-----------------------------------+
```

---

## 4. Responsive Breakpoint Adaptation Matrix

| Component | Desktop (≥ 1280px) | Tablet (768px – 1024px) | Mobile (375px – 480px) |
|---|---|---|---|
| **Admin Sidebar** | Full 240px expanded navigation rail | Collapsed 64px icon rail with tooltips | Off-canvas sheet drawer via hamburger |
| **Doctor Workspace** | Permanent 50/50 split-screen view | 40/60 split-screen view | Tabbed switch (Tab 1: EMR, Tab 2: Rx) |
| **Reception Ingress**| Full table with inline action buttons | Table with horizontal overflow scroll | Card-based collapsible ingress list |
| **Waiting Room TV** | 72pt font, 3-column room grid | 48pt font, 2-column room grid | Single column active token display |
