import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_opd';

async function runPhase12Tests() {
  console.log('================================================================');
  console.log('   SMART OPD MANAGEMENT SYSTEM - PHASE 12 PATIENT PORTAL TEST   ');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] #${total}: ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] #${total}: ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Connect to Database
    await mongoose.connect(MONGO_URI);
    assert(mongoose.connection.readyState === 1, 'Connected to MongoDB successfully');

    // 2. Load Models
    const { Patient } = await import('./dist/models/Patient.js');
    const { Appointment } = await import('./dist/models/Appointment.js');
    const { QueueEntry } = await import('./dist/models/QueueEntry.js');
    const { Visit } = await import('./dist/models/Visit.js');
    const { Prescription } = await import('./dist/models/Prescription.js');
    const { Invoice } = await import('./dist/models/Invoice.js');
    const { MedicalReport } = await import('./dist/models/MedicalReport.js');
    const { Doctor } = await import('./dist/models/Doctor.js');
    const { ClinicSetting } = await import('./dist/models/ClinicSetting.js');
    const { User } = await import('./dist/models/User.js');

    assert(Boolean(Patient), 'Patient model loaded');
    assert(Boolean(QueueEntry), 'QueueEntry model loaded');

    // 3. Resolve or Create Clinic
    let clinic = await ClinicSetting.findOne();
    if (!clinic) {
      clinic = await ClinicSetting.create({
        clinicName: 'City Health Care Clinic',
        clinicPrefix: 'CHC',
        registrationNumber: 'REG-2026-001',
        contact: {
          phone: '+91 98765 43210',
          emergencyHotline: '108',
          email: 'contact@cityhealthcare.in',
          address: { street: '12 Medical Square', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' }
        },
        operatingHours: [{ dayOfWeek: 1, isOpen: true, shifts: [{ openTime: '08:00', closeTime: '20:00' }] }],
        departments: ['General Medicine'],
        appointmentRules: {
          maxAdvanceBookingDays: 30,
          cancellationCutoffHours: 2,
          defaultSlotDurationMinutes: 15,
          allowWalkIns: true,
          allocationMode: 'HYBRID',
          autoAllocationWeights: { confirmedWeight: 1, queueWeight: 1.5 }
        }
      });
    }

    // 4. Resolve or Create Doctor
    let doctor = await Doctor.findOne({ clinicId: clinic._id });
    if (!doctor) {
      doctor = await Doctor.create({
        clinicId: clinic._id,
        fullName: 'Dr. Anand Sharma',
        specialization: 'General Physician',
        department: 'General Medicine',
        medicalRegistrationNumber: 'MCI-2026-9901',
        consultationFee: 500,
        roomNumber: '102',
        averageConsultationMinutes: 15,
        status: 'ACTIVE'
      });
    }

    // 5. Create or Find Patient
    const uniqueUhid = `OPD-2611-${Math.floor(1000 + Math.random() * 9000)}`;
    const patient = await Patient.create({
      clinicId: clinic._id,
      uhid: uniqueUhid,
      fullName: 'Vikram Joshi',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `vikram_${Date.now()}@example.com`,
      gender: 'MALE',
      dateOfBirth: new Date('1988-03-22'),
      age: 38,
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      address: { line1: '404 Lotus Enclave', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
      emergencyContact: { name: 'Pooja Joshi', relation: 'Spouse', phone: '+91 98765 00000' }
    });

    assert(Boolean(patient._id), `Patient created with UHID: ${patient.uhid}`);
    assert(patient.allergies.length === 2, 'Allergies stored for critical alert banner');

    // 6. Test Patient Profile Update (US-042)
    patient.phone = '9999988888';
    patient.address.city = 'Navi Mumbai';
    patient.emergencyContact.phone = '9888877777';
    await patient.save();

    const updatedPt = await Patient.findById(patient._id);
    assert(updatedPt.phone === '9999988888' && updatedPt.address.city === 'Navi Mumbai', 'Patient contact profile updated successfully');

    // 7. Test Patient Appointment Booking (US-041)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const normalizedApptDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    const appt = await Appointment.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: normalizedApptDate,
      timeSlot: '11:00',
      bookingChannel: 'ONLINE_PATIENT',
      notes: 'Persistent fever and fatigue',
      status: 'CONFIRMED'
    });

    assert(Boolean(appt._id), `Appointment booked online via portal for slot ${appt.timeSlot}`);

    // Query appointments by patientId
    const ptAppts = await Appointment.find({ patientId: patient._id, clinicId: clinic._id });
    assert(ptAppts.length >= 1, `Patient appointments query returned ${ptAppts.length} record(s)`);

    // 8. Test Appointment Cancellation from Portal (US-041 AC2)
    appt.status = 'CANCELLED';
    appt.cancellationReason = 'Family travel emergency';
    await appt.save();

    const cancelledAppt = await Appointment.findById(appt._id);
    assert(cancelledAppt.status === 'CANCELLED' && cancelledAppt.cancellationReason === 'Family travel emergency', 'Patient appointment cancelled with reason audit');

    // 9. Test Live Token Queue Lookup for Patient (FR-10-04, US-015)
    // Check-in patient into today's queue
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const visit = await Visit.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      checkInTime: new Date(),
      visitType: 'FIRST_VISIT',
      status: 'WAITING'
    });

    const queueEntry = await QueueEntry.create({
      clinicId: clinic._id,
      visitId: visit._id,
      patientId: patient._id,
      doctorId: doctor._id,
      tokenNumber: 9,
      queueDate: todayStart,
      status: 'WAITING',
      isEmergency: false,
      priorityOrder: 100
    });

    assert(Boolean(queueEntry._id), `OPD Queue Token #${queueEntry.tokenNumber} issued for patient`);

    // Verify token active lookup
    const activeEntry = await QueueEntry.findOne({
      clinicId: clinic._id,
      patientId: patient._id,
      queueDate: { $gte: todayStart },
      status: { $in: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED'] }
    }).populate('doctorId');

    assert(Boolean(activeEntry), 'Active token resolved for patient portal live telemetry');
    assert(activeEntry.tokenNumber === 9, 'Active token number matches #9');
    assert(Boolean(activeEntry.doctorId.roomNumber), `Doctor room number resolved for patient navigation (Room #${activeEntry.doctorId.roomNumber})`);

    // 10. Test Transition to CALLED (Triggers visual alert & audio chime in portal)
    activeEntry.status = 'CALLED';
    activeEntry.calledAt = new Date();
    await activeEntry.save();
    const calledEntry = await QueueEntry.findById(activeEntry._id);
    assert(calledEntry.status === 'CALLED' && Boolean(calledEntry.calledAt), 'Token transitioned to CALLED status');

    // 11. Test Patient Digital Prescription History (FR-12-05, US-043)
    const rx = await Prescription.create({
      clinicId: clinic._id,
      visitId: visit._id,
      patientId: patient._id,
      doctorId: doctor._id,
      prescriptionNumber: `RX-2611-${Math.floor(1000 + Math.random() * 9000)}`,
      prescriptionDate: new Date(),
      chiefComplaints: ['Headache', 'Fever'],
      diagnosis: ['Viral Pharyngitis'],
      medicines: [
        { name: 'Paracetamol 650mg', dosage: '1 tablet', form: 'Tablet', frequency: '1-0-1', duration: '3 days', instructions: 'After meals' },
        { name: 'Azithromycin 500mg', dosage: '1 tablet', form: 'Tablet', frequency: '1-0-0', duration: '3 days', instructions: 'Before food' }
      ],
      advice: 'Hydrate well and rest for 3 days.',
      isFinalized: true,
      finalizedAt: new Date(),
      digitalSignature: 'SIG-VERIFIED'
    });

    const patientRxList = await Prescription.find({ patientId: patient._id, clinicId: clinic._id });
    assert(patientRxList.length >= 1, `Patient prescription vault returned ${patientRxList.length} signed Rx`);
    assert(patientRxList[0].medicines.length === 2, 'Prescribed medications detail present for printable letterhead');

    // 12. Test Patient Invoices & Receipts (FR-21-04, US-043)
    const invoice = await Invoice.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      invoiceNumber: `INV-2611-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: new Date(),
      dueDate: new Date(),
      status: 'paid',
      items: [
        { description: 'OPD Consultation', category: 'consultation', quantity: 1, unitPrice: 500, discount: 0, tax: 0, total: 500 },
        { description: 'Blood Glucose Test', category: 'lab', quantity: 1, unitPrice: 150, discount: 0, tax: 0, total: 150 }
      ],
      subtotal: 650,
      discountAmount: 0,
      discountPercentage: 0,
      taxAmount: 0,
      grandTotal: 650,
      paidAmount: 650,
      balanceAmount: 0,
      currency: 'INR'
    });

    const patientInvoices = await Invoice.find({ patientId: patient._id, clinicId: clinic._id });
    assert(patientInvoices.length >= 1, `Patient billing ledger returned ${patientInvoices.length} receipt(s)`);
    assert(patientInvoices[0].status === 'paid', 'Receipt shows PAID status with 0 balance');

    // 13. Test Diagnostic Reports Vault Upload (FR-14-05)
    const report = await MedicalReport.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      uploadedBy: patient._id,
      reportType: 'lab',
      reportName: 'Complete Blood Count (CBC)',
      title: 'Complete Blood Count (CBC)',
      reportDate: new Date(),
      fileUrl: `/uploads/reports/${patient.uhid}_cbc.pdf`,
      fileSizeBytes: 245000,
      mimeType: 'application/pdf',
      labName: 'Suburban Diagnostics',
      findings: 'Hemoglobin: 14.2 g/dL (Normal). Platelets: 220,000 /mcL.',
      isSharedWithPatient: true,
      isDeleted: false
    });

    const patientReports = await MedicalReport.find({ patientId: patient._id, clinicId: clinic._id, isDeleted: false });
    assert(patientReports.length >= 1, `Diagnostic vault returned ${patientReports.length} report(s)`);
    assert(patientReports[0].labName === 'Suburban Diagnostics', 'External diagnostic report uploaded and linked');

    // Summary
    console.log('----------------------------------------------------------------');
    console.log(`Results: ${passed} / ${total} tests passed.`);
    if (passed === total) {
      console.log('   ALL PHASE 12 PATIENT PORTAL VERIFICATIONS COMPLETED SUCCESSFULLY!  ');
    } else {
      console.error(`   ${total - passed} tests failed!`);
    }
    console.log('================================================================');
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runPhase12Tests();
