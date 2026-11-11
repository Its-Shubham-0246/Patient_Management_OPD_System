# Smart OPD – PDF Generation Specification

> **Document ID:** 14_PDF_GENERATION  
> **Version:** 1.0.0  
> **Status:** Approved Architecture  
> **Last Updated:** 2026-11-11  
> **Applicable Stack:** Node.js 20 · PDFKit · TypeScript · Cloudinary · Stream Pipeline  

---

## 1. Executive Summary & Engine Selection

The generation of high-quality, standardized, and tamper-resistant PDF documents is an indispensable clinical and administrative requirement for **Smart OPD**.

### 1.1 Technology Choice: PDFKit
For backend Node.js rendering, **PDFKit** has been selected as the primary PDF authoring engine:
- **Zero Headless Browser Overhead**: Unlike Puppeteer or Playwright which require heavy Chromium runtimes (200MB+ RAM per instance), PDFKit is a lightweight native streaming JavaScript engine.
- **Microsecond Generation**: Generates 2-page clinical prescriptions and itemized invoices in under 50 milliseconds.
- **Precise Coordinate Geometry**: Enables vector-sharp typography, exact millimeter print alignments, barcode/QR code embedding, and standard A4 compliance.
- **Streaming Response**: Enables direct HTTP streaming (`pipe(res)`) to the client without requiring mandatory intermediate disk writes.

---

## 2. Document Architecture & Types

The system standardizes three official clinical documents:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SMART OPD PDF SUITE                             │
├──────────────────────┬──────────────────────┬──────────────────────────┤
│ 1. Clinical Rx       │ 2. Billing Invoice   │ 3. Medical History       │
│    Prescription      │    & Money Receipt   │    Summary (EMR Export)  │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ - Doctor header      │ - Clinic Tax/GST     │ - Full EMR Timeline      │
│ - Patient Vitals     │ - Itemized Charges   │ - Chronic Allergies      │
│ - Rx Drugs Table     │ - Payment Mode (UPI) │ - Multi-visit Diagnoses  │
│ - Digital QR Code    │ - Outstanding Due    │ - Lab Report Index       │
└──────────────────────┴──────────────────────┴──────────────────────────┘
```

---

## 3. Clinical Prescription PDF Layout Spec

### 3.1 Page Coordinates & Grid (A4 Standard: 595.28 x 841.89 points)
- **Margins**: Top: 36pt (0.5"), Bottom: 36pt, Left: 40pt, Right: 40pt.
- **Content Width**: 515.28 points.

### 3.2 Visual Structure

```
+------------------------------------------------------------------------+
| [CLINIC LOGO]   {{CLINIC_NAME}}              Ph: {{CLINIC_PHONE}}      |
|                 {{CLINIC_ADDRESS}}           Reg: {{CLINIC_REG_NO}}    |
+------------------------------------------------------------------------+
| Dr. {{DOCTOR_NAME}}, MBBS, MD                Dept: {{DEPARTMENT}}      |
| Medical Council Reg No: {{DOC_REG_NO}}       Room: {{ROOM_NUMBER}}     |
+------------------------------------------------------------------------+
| Patient: {{PATIENT_NAME}}      Age/Sex: {{AGE}}/{{SEX}}   UHID: {{UHID}}|
| Date: {{DATE}}                 Visit ID: #{{VISIT_ID}}   BP: 120/80    |
+------------------------------------------------------------------------+
| CHIEF COMPLAINT:                                                       |
| • Fever with chills for 3 days                                         |
|                                                                        |
| DIAGNOSIS:                                                             |
| • Acute Upper Respiratory Tract Infection (J06.9)                      |
|                                                                        |
| Rx (MEDICATIONS):                                                      |
| #  Medicine Name          Dose     Freq      Duration    Instructions  |
| 1  Tab. Paracetamol 650mg 1 tab    1-0-1     3 Days      After food    |
| 2  Cap. Amoxicillin 500mg 1 cap    1-1-1     5 Days      After food    |
| 3  Syr. Levocetirizine    5 ml     0-0-1     5 Days      At bedtime    |
|                                                                        |
| GENERAL ADVICE & LIFESTYLE:                                            |
| • Warm saline gargles twice daily. Ensure adequate oral hydration.     |
|                                                                        |
| FOLLOW-UP: After 5 days on {{FOLLOW_UP_DATE}} or SOS                   |
+------------------------------------------------------------------------+
| [QR Verification]                             ________________________ |
| Scan to verify authenticity                   Dr. {{DOCTOR_NAME}}      |
|                                               (Electronically Signed)  |
+------------------------------------------------------------------------+
| Emergency Contact: {{EMERGENCY_PHONE}} | Valid for single dispensation |
+------------------------------------------------------------------------+
```

---

## 4. Billing Invoice & Money Receipt Layout Spec

### 4.1 Required Financial Elements
In compliance with standard commercial billing practices:
1. **Invoice Metadata**: Unique sequential Invoice ID (`INV-YYYY-XXXXX`), date, payment timestamp.
2. **Tax Compliance (India / GST)**: Clinic GSTIN, SAC/HSN codes for healthcare services, CGST (9%) + SGST (9%) or tax-exempt healthcare annotations.
3. **Itemized Table**:
   - Item No.
   - Description (e.g., General OPD Consultation, ECG Procedure, Dressing)
   - Unit Price (₹)
   - Quantity
   - Discount (₹)
   - Taxable Amount (₹)
4. **Settlement Box**:
   - Total Gross
   - Discount Deductions
   - Net Payable
   - Paid Amount & Mode (Cash / Razorpay / UPI QR / Card)
   - Balance Outstanding

---

## 5. Implementation Code Architecture

### 5.1 Service Pattern (`PrescriptionPdfService.ts`)

```typescript
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class PrescriptionPdfService {
  public static generate(data: IPrescriptionPdfPayload, res: Response): void {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Prescription_${data.patient.uhid}_${data.visit.id}`,
        Author: `Dr. ${data.doctor.name} - ${data.clinic.name}`,
        Subject: 'Medical Outpatient Prescription'
      }
    });

    // Pipe directly to HTTP Response stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="prescription_${data.patient.uhid}.pdf"`
    );
    doc.pipe(res);

    // 1. Clinic Header
    this.drawClinicHeader(doc, data.clinic);
    
    // 2. Doctor Banner
    this.drawDoctorDetails(doc, data.doctor);

    // 3. Patient Vitals Strip
    this.drawPatientBanner(doc, data.patient, data.vitals);

    // 4. Clinical Findings & Diagnosis
    this.drawClinicalFindings(doc, data.diagnosis, data.complaints);

    // 5. Drug Prescription Table
    this.drawMedicineTable(doc, data.medications);

    // 6. Advice & Follow-up
    this.drawAdviceAndFollowup(doc, data.advice, data.followUpDate);

    // 7. Security QR Code & Sign-Off
    this.drawFooterSignature(doc, data.doctor, data.verificationUrl);

    // Finalize
    doc.end();
  }
}
```

---

## 6. Security, Storage & Verification

1. **Tamper Verification QR Code**:
   - Every prescription and invoice embeds a signed JWT payload within a 2D QR Code:
     `https://{{CLINIC_DOMAIN}}/verify/rx?token={{SIGNED_JWT}}`
   - Pharmacists and insurance verifiers scanning the QR code immediately view an immutable server-validated authenticity confirmation.
2. **Cloudinary Cold Archival**:
   - Completed consultations trigger an asynchronous background worker that writes a copy to Cloudinary under the private directory:
     `clinics/{clinicId}/prescriptions/{year}/{month}/rx_{visitId}.pdf`
   - Access to archived PDFs is strictly governed by pre-signed, time-limited URLs (TTL = 15 minutes).
3. **Audit Log Hook**:
   - Any PDF generation or download action triggers an audit log entry:
     `AUDIT_EVENT: PDF_DOWNLOADED | Resource: Prescription | ID: {visitId} | Actor: {userId}`

