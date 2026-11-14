import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_opd';

async function runPhase11Tests() {
  console.log('================================================================');
  console.log('   SMART OPD MANAGEMENT SYSTEM - PHASE 11 NOTIFICATIONS TEST    ');
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

    // 2. Import Models and Services
    const { Notification } = await import('./dist/models/Notification.js');
    const { ClinicSetting } = await import('./dist/models/ClinicSetting.js');
    const { User } = await import('./dist/models/User.js');
    const { Patient } = await import('./dist/models/Patient.js');
    const {
      NotificationService,
      DLT_SMS_TEMPLATES,
      sanitizeDltVar,
      generateHealthcareEmailHtml
    } = await import('./dist/services/notificationService.js');

    assert(Boolean(Notification), 'Notification Mongoose model loaded');
    assert(Boolean(NotificationService), 'NotificationService loaded');

    // 3. Schema & Index Verification
    const schemaPaths = Object.keys(Notification.schema.paths);
    assert(schemaPaths.includes('clinicId'), 'Schema includes clinicId');
    assert(schemaPaths.includes('recipientRole'), 'Schema includes recipientRole');
    assert(schemaPaths.includes('type'), 'Schema includes type');
    assert(schemaPaths.includes('event'), 'Schema includes event');
    assert(schemaPaths.includes('channel'), 'Schema includes channel');
    assert(schemaPaths.includes('deliveryLogs'), 'Schema includes deliveryLogs');
    assert(schemaPaths.includes('isRead'), 'Schema includes isRead');

    // 4. TRAI DLT Compliant SMS Templates Verification
    const dltKeys = Object.keys(DLT_SMS_TEMPLATES);
    const expectedKeys = [
      'APPT_CONFIRMED',
      'CHECKIN_TOKEN_ISSUED',
      'QUEUE_NEXT_CALLED',
      'FOLLOWUP_REMINDER',
      'DOCTOR_LEAVE_NOTICE',
      'INVOICE_GENERATED',
      'PRESCRIPTION_READY'
    ];

    const allKeysPresent = expectedKeys.every((k) => dltKeys.includes(k));
    assert(allKeysPresent, 'All 7 registered TRAI DLT SMS templates present');

    // Verify DLT Header and 160-char length limits
    const sampleRender = DLT_SMS_TEMPLATES.APPT_CONFIRMED.render({
      patientName: 'Rahul Mehta',
      doctorName: 'A. Sharma',
      clinicName: 'City Clinic',
      date: '2026-11-15',
      time: '10:30 AM',
      appointmentRef: 'APT-101'
    });

    assert(DLT_SMS_TEMPLATES.APPT_CONFIRMED.header === 'SMROPD', 'DLT Sender Header is SMROPD');
    assert(DLT_SMS_TEMPLATES.APPT_CONFIRMED.templateId === '1107168923450012', 'DLT Template ID matches registration');
    assert(sampleRender.length <= 160, `Rendered DLT SMS within 160 GSM chars (${sampleRender.length} chars)`);

    // Verify variable sanitization
    const dirtyInput = 'Rahul\n<Mehta>\t\r';
    const cleanOutput = sanitizeDltVar(dirtyInput);
    assert(!cleanOutput.includes('\n') && !cleanOutput.includes('<'), 'DLT variable sanitization removes control/HTML chars');

    // 5. Healthcare HTML Email Generator Verification
    const sampleHtml = generateHealthcareEmailHtml({
      to: 'patient@example.com',
      subject: 'Appointment Confirmed',
      heading: 'Your Appointment is Confirmed',
      bodyHtml: '<p>Consultation details.</p>',
      actionText: 'View Details',
      actionUrl: 'http://localhost:5173/portal'
    });

    assert(sampleHtml.includes('DPDP Act 2023'), 'Email template includes Indian DPDP Act 2023 legal footer');
    assert(sampleHtml.includes('#1e2d4a'), 'Email template includes clinic navy branding palette');
    assert(sampleHtml.includes('Emergency: 108'), 'Email template includes clinic emergency hotline');

    // 6. Clinic & User Context Setup
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
        holidays: [],
        departments: ['General Medicine', 'Cardiology'],
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

    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      admin = await User.create({
        clinicId: clinic._id,
        fullName: 'Dr. System Administrator',
        email: `admin_${Date.now()}@smartopd.in`,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    }

    let patient = await Patient.findOne({ clinicId: clinic._id });
    if (!patient) {
      patient = await Patient.create({
        clinicId: clinic._id,
        uhid: `OPD-2611-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: 'Rahul Mehta',
        phone: '+919876543210',
        gender: 'MALE',
        dateOfBirth: new Date('1990-05-15'),
        bloodGroup: 'B+'
      });
    }

    // 7. Dispatch Multi-Channel In-App + Simulated SMS & Email
    const testNotif = await NotificationService.send({
      clinicId: clinic._id,
      recipientUserId: admin._id,
      recipientPatientId: patient._id,
      recipientRole: 'PATIENT',
      type: 'APPOINTMENT',
      event: 'APPT_CONFIRMED',
      channel: 'MULTI',
      title: 'Appointment Confirmed - Dr. A. Sharma',
      message: 'Your appointment is confirmed for tomorrow 10:00 AM.',
      actionUrl: '/portal/dashboard',
      phone: patient.phone,
      email: 'rahul.mehta@example.com'
    });

    assert(Boolean(testNotif._id), 'Created notification in MongoDB');
    assert(testNotif.deliveryLogs.length === 3, 'Delivery logs recorded for IN_APP, SMS, and EMAIL');
    assert(testNotif.deliveryLogs.some((l) => l.channel === 'SMS' && l.status === 'SENT'), 'SMS logged with SENT status');
    assert(testNotif.deliveryLogs.some((l) => l.channel === 'EMAIL' && l.status === 'SENT'), 'Email logged with SENT status');
    assert(testNotif.deliveryLogs.some((l) => l.channel === 'IN_APP' && l.status === 'DELIVERED'), 'In-App logged with DELIVERED status');

    // 8. Test Specialized Clinical Trigger Facades
    const tokenNotif = await NotificationService.notifyQueueTokenIssued({
      clinicId: clinic._id,
      patientId: patient._id,
      patientName: patient.fullName,
      doctorName: 'A. Sharma',
      clinicName: clinic.clinicName,
      tokenNumber: 7,
      waitTime: 20,
      phone: patient.phone
    });
    assert(tokenNotif.event === 'CHECKIN_TOKEN_ISSUED', 'Queue token issuance notification created');

    const callNotif = await NotificationService.notifyQueueCalled({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorName: 'A. Sharma',
      roomNumber: '102',
      tokenNumber: 7,
      phone: patient.phone
    });
    assert(callNotif.event === 'QUEUE_NEXT_CALLED', 'Queue token called notification created');

    const rxNotif = await NotificationService.notifyPrescriptionReady({
      clinicId: clinic._id,
      patientId: patient._id,
      patientName: patient.fullName,
      doctorName: 'A. Sharma',
      clinicName: clinic.clinicName,
      visitRef: 'VST-42',
      prescriptionId: new mongoose.Types.ObjectId(),
      phone: patient.phone,
      email: 'rahul.mehta@example.com'
    });
    assert(rxNotif.event === 'PRESCRIPTION_READY', 'Prescription ready notification created');

    const invNotif = await NotificationService.notifyInvoiceGenerated({
      clinicId: clinic._id,
      patientId: patient._id,
      patientName: patient.fullName,
      clinicName: clinic.clinicName,
      invoiceNumber: 'INV-2611-00042',
      amount: 650.0,
      status: 'PAID',
      phone: patient.phone,
      email: 'rahul.mehta@example.com'
    });
    assert(invNotif.event === 'INVOICE_GENERATED', 'Invoice generated receipt notification created');

    // 9. Read/Unread State Toggles
    const unreadBefore = await Notification.countDocuments({ clinicId: clinic._id, isRead: false });
    assert(unreadBefore >= 5, `Unread notifications detected (${unreadBefore} items)`);

    // Mark single notification read
    testNotif.isRead = true;
    testNotif.readAt = new Date();
    await testNotif.save();
    const fetchedSingle = await Notification.findById(testNotif._id);
    assert(fetchedSingle.isRead === true && Boolean(fetchedSingle.readAt), 'Single notification marked as read with timestamp');

    // Mark all notifications read
    await Notification.updateMany({ clinicId: clinic._id }, { isRead: true, readAt: new Date() });
    const unreadAfter = await Notification.countDocuments({ clinicId: clinic._id, isRead: false });
    assert(unreadAfter === 0, 'Mark all as read reduced unread count to 0');

    // Summary
    console.log('----------------------------------------------------------------');
    console.log(`Results: ${passed} / ${total} tests passed.`);
    if (passed === total) {
      console.log('   ALL PHASE 11 NOTIFICATION VERIFICATIONS COMPLETED SUCCESSFULLY!  ');
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

runPhase11Tests();

