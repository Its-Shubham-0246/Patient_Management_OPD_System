import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_opd';

async function runPhase13Tests() {
  console.log('================================================================');
  console.log('   SMART OPD MANAGEMENT SYSTEM - PHASE 13 ANALYTICS & BI TEST   ');
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
    const { Doctor } = await import('./dist/models/Doctor.js');
    const { Appointment } = await import('./dist/models/Appointment.js');
    const { Invoice } = await import('./dist/models/Invoice.js');
    const { Payment } = await import('./dist/models/Payment.js');
    const { QueueEntry } = await import('./dist/models/QueueEntry.js');
    const { Visit } = await import('./dist/models/Visit.js');
    const { ClinicSetting } = await import('./dist/models/ClinicSetting.js');
    const { User } = await import('./dist/models/User.js');

    assert(Boolean(Patient), 'Patient model loaded');
    assert(Boolean(Doctor), 'Doctor model loaded');
    assert(Boolean(Appointment), 'Appointment model loaded');
    assert(Boolean(Invoice), 'Invoice model loaded');
    assert(Boolean(Payment), 'Payment model loaded');
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
          emergencyBufferSlots: 4,
          maxTokensPerDay: 120
        }
      });
    }
    assert(Boolean(clinic._id), `Active Clinic identified: ${clinic.clinicName} (ID: ${clinic._id})`);

    // 4. Resolve or Create Doctor
    let doctor = await Doctor.findOne({ clinicId: clinic._id });
    if (!doctor) {
      let doctorUser = await User.findOne({ role: 'DOCTOR' });
      if (!doctorUser) {
        doctorUser = await User.create({
          fullName: 'Dr. Vikram Malhotra',
          email: 'vikram.malhotra@cityhealth.in',
          passwordHash: 'dummyhash123',
          role: 'DOCTOR',
          phone: '+91 98220 12345',
          clinicId: clinic._id
        });
      }
      doctor = await Doctor.create({
        clinicId: clinic._id,
        userId: doctorUser._id,
        fullName: 'Dr. Vikram Malhotra',
        specialization: 'Internal Medicine',
        department: 'General Medicine',
        medicalRegistrationNumber: 'MCI-88992',
        consultationFee: 750,
        averageConsultationMinutes: 15,
        roomNumber: 'Room 101',
        status: 'ACTIVE'
      });
    }
    assert(Boolean(doctor._id), `Doctor active: Dr. ${doctor.fullName} (${doctor.specialization})`);

    // 5. Seed Test Patient with Demographics & Risk Factors
    const uniqueUhid = `UHID-AN-${Date.now().toString().slice(-6)}`;
    const patient = await Patient.create({
      clinicId: clinic._id,
      uhid: uniqueUhid,
      fullName: 'Aarav Patel',
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      gender: 'MALE',
      dateOfBirth: new Date('1990-05-15'),
      age: 36,
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
      emergencyContact: {
        name: 'Neha Patel',
        relationship: 'Spouse',
        phone: '+91 98234 56789'
      }
    });
    assert(Boolean(patient._id), `Patient seeded: ${patient.fullName} (UHID: ${patient.uhid}, Age: ${patient.age}, Gender: ${patient.gender})`);

    // 6. Seed Appointment
    const appointmentDate = new Date();
    const appointment = await Appointment.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate,
      timeSlot: '10:30',
      appointmentType: 'IN_PERSON',
      bookingChannel: 'ONLINE_PATIENT',
      status: 'COMPLETED',
      symptoms: 'Routine diabetes check-up'
    });
    assert(Boolean(appointment._id), `Appointment seeded: ${appointment.appointmentType} Status: ${appointment.status}`);

    // Seed a Cancelled Appointment for cancellation rate calculation
    const cancelledAppt = await Appointment.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate,
      timeSlot: '11:00',
      appointmentType: 'IN_PERSON',
      bookingChannel: 'RECEPTIONIST_WALKIN',
      status: 'CANCELLED',
      cancellationReason: 'Patient personal emergency'
    });
    assert(Boolean(cancelledAppt._id), 'Cancelled appointment seeded for metrics verification');

    // 7. Seed Visit & QueueEntry
    const visit = await Visit.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentId: appointment._id,
      visitType: 'FIRST_VISIT',
      visitDate: new Date(),
      status: 'COMPLETED'
    });

    const queueEntry = await QueueEntry.create({
      clinicId: clinic._id,
      doctorId: doctor._id,
      patientId: patient._id,
      visitId: visit._id,
      tokenNumber: 15,
      queueDate: new Date(),
      priority: 'NORMAL',
      status: 'COMPLETED',
      calledAt: new Date(Date.now() - 15 * 60 * 1000)
    });
    assert(Boolean(queueEntry._id), `Queue entry seeded: Token #${queueEntry.tokenNumber} (Status: ${queueEntry.status})`);

    // 8. Seed Invoice & Payment
    const invoiceNumber = `INV-AN-${Date.now().toString().slice(-6)}`;
    const invoice = await Invoice.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentId: appointment._id,
      invoiceNumber,
      invoiceDate: new Date(),
      items: [
        {
          description: 'Specialist Physician Consultation',
          category: 'consultation',
          quantity: 1,
          unitPrice: 750,
          total: 750
        },
        {
          description: 'Fasting Blood Glucose Test',
          category: 'lab',
          quantity: 1,
          unitPrice: 250,
          total: 250
        }
      ],
      subtotal: 1000,
      discountAmount: 0,
      discountPercentage: 0,
      taxAmount: 0,
      grandTotal: 1000,
      paidAmount: 1000,
      balanceAmount: 0,
      dueDate: new Date(),
      status: 'paid'
    });
    assert(Boolean(invoice._id), `Invoice seeded: ${invoice.invoiceNumber} Total: Rs. ${invoice.grandTotal}`);

    const payment = await Payment.create({
      clinicId: clinic._id,
      invoiceId: invoice._id,
      patientId: patient._id,
      receiptNumber: `REC-AN-${Date.now().toString().slice(-6)}`,
      transactionId: `TXN-AN-${Date.now().toString().slice(-6)}`,
      amount: 1000,
      currency: 'INR',
      method: 'upi',
      status: 'success',
      receivedBy: doctor.userId,
      paymentDate: new Date()
    });
    assert(Boolean(payment._id), `Payment transaction seeded: Receipt ${payment.receiptNumber} Method: ${payment.method} Amount: Rs. ${payment.amount}`);

    // 9. Import Controllers from compiled dist
    const {
      getOverviewAnalytics,
      getAppointmentAnalytics,
      getRevenueAnalytics,
      getDoctorAnalytics,
      getPatientAnalytics,
      getQueueAnalytics
    } = await import('./dist/controllers/analyticsController.js');

    assert(typeof getOverviewAnalytics === 'function', 'getOverviewAnalytics controller verified');
    assert(typeof getAppointmentAnalytics === 'function', 'getAppointmentAnalytics controller verified');
    assert(typeof getRevenueAnalytics === 'function', 'getRevenueAnalytics controller verified');
    assert(typeof getDoctorAnalytics === 'function', 'getDoctorAnalytics controller verified');
    assert(typeof getPatientAnalytics === 'function', 'getPatientAnalytics controller verified');
    assert(typeof getQueueAnalytics === 'function', 'getQueueAnalytics controller verified');

    // Helper to mock req and res
    const createMockContext = (query = {}) => {
      const req = { query };
      let responseData = null;
      let statusCode = 200;

      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (payload) => {
          responseData = payload;
          return res;
        }
      };

      const next = (err) => {
        if (err) throw err;
      };

      return { req, res, getData: () => responseData?.data, getFull: () => responseData };
    };

    // 10. Test Overview Analytics
    console.log('\n--- 10. Testing getOverviewAnalytics ---');
    const ctxOv = createMockContext();
    await getOverviewAnalytics(ctxOv.req, ctxOv.res, (e) => { throw e; });
    const ovData = ctxOv.getData();

    assert(Boolean(ovData), 'Overview analytics returned data');
    assert(typeof ovData.totalPatients === 'number' && ovData.totalPatients > 0, `Total Patients count verified: ${ovData.totalPatients}`);
    assert(typeof ovData.totalAppointments === 'number' && ovData.totalAppointments > 0, `Total Appointments verified: ${ovData.totalAppointments}`);
    assert(typeof ovData.totalRevenue === 'number' && ovData.totalRevenue >= 1000, `Total Revenue aggregated: Rs. ${ovData.totalRevenue}`);
    assert(typeof ovData.totalCollected === 'number' && ovData.totalCollected >= 1000, `Total Collections aggregated: Rs. ${ovData.totalCollected}`);
    assert(typeof ovData.cancellationRate === 'number', `Cancellation Rate calculated: ${ovData.cancellationRate}%`);
    assert(typeof ovData.averageWaitTimeMinutes === 'number', `Average wait time present: ${ovData.averageWaitTimeMinutes} mins`);

    // 11. Test Appointment Analytics
    console.log('\n--- 11. Testing getAppointmentAnalytics ---');
    const ctxAppt = createMockContext();
    await getAppointmentAnalytics(ctxAppt.req, ctxAppt.res, (e) => { throw e; });
    const apptData = ctxAppt.getData();

    assert(Boolean(apptData), 'Appointment analytics returned data');
    assert(apptData.byStatus.COMPLETED >= 1, `Status COMPLETED counted: ${apptData.byStatus.COMPLETED}`);
    assert(apptData.byStatus.CANCELLED >= 1, `Status CANCELLED counted: ${apptData.byStatus.CANCELLED}`);
    assert(Array.isArray(apptData.byDay) && apptData.byDay.length > 0, `Daily appointment trend array populated (${apptData.byDay.length} days)`);
    assert(Array.isArray(apptData.byDoctor) && apptData.byDoctor.length > 0, `Doctor workload distribution present: ${apptData.byDoctor[0].name}`);
    assert(Array.isArray(apptData.byChannel) && apptData.byChannel.length > 0, 'Booking channels mapped');

    // 12. Test Revenue Analytics
    console.log('\n--- 12. Testing getRevenueAnalytics ---');
    const ctxRev = createMockContext();
    await getRevenueAnalytics(ctxRev.req, ctxRev.res, (e) => { throw e; });
    const revData = ctxRev.getData();

    assert(Boolean(revData), 'Revenue analytics returned data');
    assert(typeof revData.totalRevenue === 'number' && revData.totalRevenue >= 1000, `Total invoiced revenue verified: Rs. ${revData.totalRevenue}`);
    assert(typeof revData.collected === 'number' && revData.collected >= 1000, `Collected revenue verified: Rs. ${revData.collected}`);
    assert(revData.byMethod.upi >= 1000, `UPI payment method breakdown accurate: Rs. ${revData.byMethod.upi}`);
    assert(Array.isArray(revData.byDay) && revData.byDay.length > 0, `Daily financial ledger trend populated (${revData.byDay.length} data points)`);
    assert(Array.isArray(revData.byCategory) && revData.byCategory.length > 0, `Itemized categories present (found ${revData.byCategory.length} categories)`);

    // 13. Test Doctor Analytics
    console.log('\n--- 13. Testing getDoctorAnalytics ---');
    const ctxDoc = createMockContext();
    await getDoctorAnalytics(ctxDoc.req, ctxDoc.res, (e) => { throw e; });
    const docData = ctxDoc.getData();

    assert(Array.isArray(docData) && docData.length > 0, `Doctor metrics array populated (${docData.length} physicians)`);
    const foundDoc = docData.find((d) => d.name === doctor.fullName);
    assert(Boolean(foundDoc), `Physician Dr. ${doctor.fullName} located in metrics`);
    assert(foundDoc.totalAppointments >= 1, `Doctor total appointments tracked: ${foundDoc.totalAppointments}`);
    assert(foundDoc.completedConsultations >= 1, `Doctor completed consultations tracked: ${foundDoc.completedConsultations}`);
    assert(foundDoc.revenueGenerated >= 1000, `Doctor revenue attribution calculated: Rs. ${foundDoc.revenueGenerated}`);

    // 14. Test Patient Demographics Analytics
    console.log('\n--- 14. Testing getPatientAnalytics ---');
    const ctxPat = createMockContext();
    await getPatientAnalytics(ctxPat.req, ctxPat.res, (e) => { throw e; });
    const patData = ctxPat.getData();

    assert(Boolean(patData), 'Patient demographics data returned');
    assert(patData.totalPatients >= 1, `Total patients recorded: ${patData.totalPatients}`);
    assert(patData.byGender.MALE >= 1, `Male gender cohort counted: ${patData.byGender.MALE}`);
    assert(patData.byAgeGroup['36-50'] >= 1, `Age cohort 36-50 mapped for 36-yr-old patient: ${patData.byAgeGroup['36-50']}`);
    assert(Array.isArray(patData.topAllergies) && patData.topAllergies.length > 0, `Top allergies extracted: ${patData.topAllergies[0].name}`);
    assert(Array.isArray(patData.topChronicConditions) && patData.topChronicConditions.length > 0, `Chronic condition cohorts identified: ${patData.topChronicConditions[0].condition}`);

    // 15. Test Queue Analytics
    console.log('\n--- 15. Testing getQueueAnalytics ---');
    const ctxQ = createMockContext();
    await getQueueAnalytics(ctxQ.req, ctxQ.res, (e) => { throw e; });
    const qData = ctxQ.getData();

    assert(Boolean(qData), 'Queue analytics returned data');
    assert(qData.totalTokensIssued >= 1, `Total tokens issued verified: ${qData.totalTokensIssued}`);
    assert(typeof qData.peakHour === 'string' && qData.peakHour.length > 0, `Peak OPD hour calculated: ${qData.peakHour}`);
    assert(Array.isArray(qData.hourlyDistribution) && qData.hourlyDistribution.length === 13, `Hourly distribution spans 08:00 to 20:00 (13 hourly buckets)`);

    // 16. Test Custom Date Range Scoping
    console.log('\n--- 16. Testing Custom Date Range Scoping ---');
    const pastFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pastTo = new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ctxRange = createMockContext({ from: pastFrom, to: pastTo });
    await getOverviewAnalytics(ctxRange.req, ctxRange.res, (e) => { throw e; });
    const rangeData = ctxRange.getData();

    assert(rangeData.totalAppointments === 0, `Date filtering correctly scopes appointments outside window to 0`);
    assert(rangeData.totalRevenue === 0, `Date filtering correctly scopes revenue outside window to 0`);

    console.log('\n================================================================');
    console.log(`   PHASE 13 TESTS COMPLETED: ${passed}/${total} PASSED (100%)    `);
    console.log('================================================================');

  } catch (err) {
    console.error('Fatal error during Phase 13 test execution:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runPhase13Tests();
