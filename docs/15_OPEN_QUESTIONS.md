# Smart OPD – Open Questions & Clinic Configuration Log

> **Document ID:** 15_OPEN_QUESTIONS  
> **Version:** 1.0.0  
> **Status:** Pending Clinic Owner Input  
> **Last Updated:** 2026-11-11  
> **Target Reviewer:** Clinic Medical Director / Practice Owner  

---

## 1. Introduction & Purpose

To ensure that **Smart OPD** reflects the operational reality of the clinic rather than arbitrary defaults, this document registers all pending business, administrative, legal, and clinical decisions. 

Until the clinic leadership provides explicit specifications, the platform operates on the **Default Assumptions** detailed below. Every default assumption is fully configurable via the Clinic Admin Settings Console (`/admin/settings`).

---

## 2. Master Clinic Decisions & Configuration Inquiries

| Q-ID | Category | Clinical / Operational Inquiry | Why It Matters | Default System Assumption | Status |
|---|---|---|---|---|---|
| **CQ-01** | **Identity** | What is the legal registered name of the clinic, physical address, and contact numbers? | Appears on prescriptions, legal invoices, and SMS sender IDs. | `{{CLINIC_NAME}}`, `{{CLINIC_ADDRESS}}`, `{{CLINIC_PHONE}}` | PENDING |
| **CQ-02** | **Identity** | Does the clinic possess an official logo, letterhead format, or specific brand colors? | Embedded in PDF headers and web application navbar. | Standard Navy (`#1e2d4a`) + Default Medical Cross Logo | PENDING |
| **CQ-03** | **Identity** | What is the clinic's Clinical Establishments Act registration number? | Mandatory legal disclosure on all medical prescriptions. | `CEA-REG-PENDING-XXXX` | PENDING |
| **CQ-04** | **Specialties** | Which medical departments will be active initially (e.g., General Medicine, Pediatrics, Ortho)? | Determines doctor filtering and patient self-booking categories. | General Medicine, Pediatrics, Gynecology, Dermatology | PENDING |
| **CQ-05** | **Operating Hours** | What are the standard clinic operating hours across weekdays and weekends? | Controls online appointment slot generation boundaries. | Mon–Sat: 09:00 AM – 08:00 PM; Sunday: Closed | PENDING |
| **CQ-06** | **Rosters** | Will doctors follow fixed daily shift blocks (e.g., Morning 9–1, Evening 5–8) or continuous hours? | Dictates schedule engine slot generation logic. | Split Shift: 09:00–13:00 and 17:00–20:00 | PENDING |
| **CQ-07** | **Slot Duration** | What is the standard appointment slot duration per specialty? | Determines number of available appointments per hour. | 15 minutes for General OPD; 30 minutes for Specialties | PENDING |
| **CQ-08** | **Buffer Time** | Should a buffer gap (e.g., 5 mins) be enforced between appointment slots? | Prevents cumulative schedule creep when consultations run over. | 0 minutes buffer (slots are back-to-back) | PENDING |
| **CQ-09** | **Booking Window** | How many days in advance can patients book an appointment online? | Prevents bookings too far in advance with high risk of no-shows. | Up to 14 days in advance | PENDING |
| **CQ-10** | **Cancellation Policy**| What is the cutoff window for patient self-cancellation without penalty? | Governs refund eligibility and slot recycling rules. | Up to 4 hours prior to appointment time | PENDING |
| **CQ-11** | **Walk-In Policy** | How are walk-in patients interleaved with pre-booked appointments? | Determines queue priority algorithm. | Walk-ins assigned next available FIFO slot after checked-in appointments | PENDING |
| **CQ-12** | **Emergency Protocol**| What criteria permit a patient to bypass the live queue (Emergency Bump)? | High-risk clinical override feature in queue console. | Requires clinician approval; bumps patient to Token `#1-EMERGENCY` | PENDING |
| **CQ-13** | **Late Arrival** | How long is an appointment reserved before the patient is marked `NO_SHOW`? | Frees up doctor time and manages waiting room backlog. | 20 minutes past scheduled slot time | PENDING |
| **CQ-14** | **Check-in to Token**| Does booking an appointment reserve a specific token number or does check-in assign it? | **Critical OPD Rule**: Arrival order vs booking order. | Token assigned strictly upon physical check-in at reception | PENDING |
| **CQ-15** | **Consultation Fee**| What is the baseline consultation fee per doctor, and is it uniform or variable? | Pre-fills the billing invoice upon visit completion. | ₹ 500 for General Physician; ₹ 800 for Specialist | PENDING |
| **CQ-16** | **Follow-up Policy**| Is a follow-up consultation free of charge if conducted within a specific timeframe? | Prevents duplicate billing on valid follow-ups. | Free follow-up within 7 calendar days of primary visit | PENDING |
| **CQ-17** | **Taxation / GST** | Is the clinic GST registered? Are clinical consultation services exempt or taxable? | Determines tax calculation engine in billing module. | Clinical healthcare services treated as GST Exempt (0%) | PENDING |
| **CQ-18** | **Payment Modes** | Which payment methods does the reception accept (Cash, UPI QR, Card, Online)? | Sets up settlement options in POS billing interface. | Cash, Static UPI QR, Credit/Debit Card POS terminal | PENDING |
| **CQ-19** | **Razorpay Gateway**| Should an online payment gateway (Razorpay) be enabled for advance online booking? | Determines whether online payment is mandatory or optional at booking. | Pay-at-Clinic upon arrival (online payment disabled in v1) | PENDING |
| **CQ-20** | **SMS Gateway** | Does the clinic have an existing DLT registration with Twilio, MSG91, or Airtel? | Required for sending transactional SMS to patients in India. | Mock SMS console in development; MSG91 DLT in production | PENDING |
| **CQ-21** | **Email Gateway** | What email domain will send appointment reminders (`noreply@clinic.com`)? | Required for SPF, DKIM, and transactional deliverability. | Standard SendGrid SMTP with custom verified clinic domain | PENDING |
| **CQ-22** | **Report Uploads** | Who has authorization to upload lab reports (Receptionist vs Doctor only)? | Governs role-based access control rules for medical reports. | Both Receptionist and Doctor can upload; Doctor reviews | PENDING |
| **CQ-23** | **Cloud Storage** | What is the maximum acceptable file size for diagnostic report uploads? | Manages Cloudinary storage bandwidth and performance. | Maximum 10MB per PDF/Image; JPG, PNG, PDF accepted | PENDING |
| **CQ-24** | **Data Retention** | For how many years should patient medical history and prescriptions be archived? | Legal compliance under Indian Medical Council regulations. | Permanent active storage (minimum 7 years mandated by law) | PENDING |
| **CQ-25** | **Digital Signature**| Do doctors wish to upload their digitized signature image or sign electronically? | Rendered on bottom-right of PDF prescription. | Electronic cryptographic verification stamp with doctor's Reg No | PENDING |
| **CQ-26** | **Waiting Display** | Does the waiting room have a smart TV / monitor for the live queue display? | Determines whether to deploy full-screen audio chime queue view. | Full-screen live token board with audio chime enabled | PENDING |
| **CQ-27** | **Staff Accounts** | How many front-desk receptionists need individual login credentials? | Determines initial user provisioning and audit traceability. | 2 Receptionist accounts (`reception1`, `reception2`) | PENDING |
| **CQ-28** | **Referral Tracking**| Does the clinic track referring physicians or external diagnostic centers? | Influences data fields on patient registration and analytics. | Optional `referredBy` free-text field enabled on registration | PENDING |
| **CQ-29** | **Drug Master List** | Does the clinic have a preferred formulary / list of generic and branded medicines? | Pre-populates autocomplete dropdown in prescription builder. | Standard WHO Essential Medicines + Indian generic formulary | PENDING |
| **CQ-30** | **Teleconsultation**| Will video/telehealth consultations be offered in this OPD deployment? | Dictates WebRTC / video calling integration roadmap. | In-person physical OPD only for Phase 1; Telehealth in Phase 2 | PENDING |

---

## 3. Decision Log Sign-Off Protocol

As the clinic owner or administrator reviews and specifies the answers to the questions above, each item will be marked **APPROVED**, recorded in the database `clinicSettings` collection, and signed off in `11_PROJECT_TRACKER.md`.

