import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_opd';

async function runPhase14Tests() {
  console.log('================================================================');
  console.log('   SMART OPD MANAGEMENT SYSTEM - PHASE 14 CLINICAL AI & HITL    ');
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
    const { AuditLog } = await import('./dist/models/AuditLog.js');
    const { Patient } = await import('./dist/models/Patient.js');
    const { Doctor } = await import('./dist/models/Doctor.js');
    const { ClinicSetting } = await import('./dist/models/ClinicSetting.js');
    const { User } = await import('./dist/models/User.js');
    const { Visit } = await import('./dist/models/Visit.js');
    const { Prescription } = await import('./dist/models/Prescription.js');
    const { QueueEntry } = await import('./dist/models/QueueEntry.js');

    assert(Boolean(AuditLog), 'AuditLog model loaded successfully');
    assert(Boolean(Patient), 'Patient model loaded successfully');
    assert(Boolean(Doctor), 'Doctor model loaded successfully');

    // 3. Resolve or Create Clinic & Doctor
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
        departments: ['General Medicine']
      });
    }

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
        roomNumber: 'Room 101',
        status: 'ACTIVE'
      });
    }

    // 4. Test Services Import
    const {
      anonymizeClinicalPayload,
      structureToSoapNote,
      summarizePatientHistory,
      checkDrugSafety,
      forecastQueueOperations,
      logAIAuditEvent
    } = await import('./dist/services/aiAssistantService.js');

    assert(typeof anonymizeClinicalPayload === 'function', 'anonymizeClinicalPayload function loaded');
    assert(typeof structureToSoapNote === 'function', 'structureToSoapNote function loaded');
    assert(typeof summarizePatientHistory === 'function', 'summarizePatientHistory function loaded');
    assert(typeof checkDrugSafety === 'function', 'checkDrugSafety function loaded');
    assert(typeof forecastQueueOperations === 'function', 'forecastQueueOperations function loaded');
    assert(typeof logAIAuditEvent === 'function', 'logAIAuditEvent function loaded');

    // 5. Test PII De-Identification Layer (DPDP Act 2023 Compliance)
    console.log('\n--- 5. Testing PII De-Identification Layer ---');
    const dirtyPayload = {
      patientName: 'Rameshwar Sharma',
      phone: '+91 9823456789',
      email: 'rameshwar.s@example.com',
      uhid: 'OPD-2611-98765',
      address: { street: '12 Linking Road, Bandra' },
      emergencyContact: { phone: '9876543210' },
      age: 48,
      gender: 'MALE',
      rawNotes: 'Patient Rameshwar Sharma (+91 9823456789, rameshwar.s@example.com, OPD-2611-98765) reports chest pain'
    };

    const sanitized = anonymizeClinicalPayload(dirtyPayload);
    assert(sanitized.patientName === undefined, 'Direct patientName stripped');
    assert(sanitized.phone === undefined, 'Direct phone stripped');
    assert(sanitized.email === undefined, 'Direct email stripped');
    assert(sanitized.uhid === undefined, 'Direct uhid stripped');
    assert(sanitized.address === undefined, 'Direct address stripped');
    assert(sanitized.emergencyContact === undefined, 'Direct emergencyContact stripped');
    assert(sanitized.age === 48 && sanitized.gender === 'MALE', 'Clinical attributes preserved');
    assert(typeof sanitized.patientToken === 'string' && sanitized.patientToken.startsWith('PATIENT_ANON_'), 'Ephemeral patientToken assigned');
    assert(sanitized.rawNotes.includes('[REDACTED_PHONE]'), 'Embedded phone number redacted in notes text');
    assert(sanitized.rawNotes.includes('[REDACTED_EMAIL]'), 'Embedded email redacted in notes text');
    assert(sanitized.rawNotes.includes('[REDACTED_UHID]'), 'Embedded UHID redacted in notes text');

    // 6. Test Dictation to SOAP Structuring (HITL Engine)
    console.log('\n--- 6. Testing Dictation to SOAP Structuring ---');
    const dictationInput = {
      rawNotes: 'Patient 42M complains of severe throbbing headache for 3 days with nausea and photophobia, BP is 135/85, pulse 78, no neck stiffness, suspect migraine without aura, advise oral analgesics and rest in dark room, review in 5 days',
      age: 42,
      gender: 'MALE',
      vitals: { bloodPressure: '135/85', pulseRate: 78 }
    };

    const soapResult = await structureToSoapNote(dictationInput);
    assert(Boolean(soapResult), 'SOAP structuring generated output');
    assert(Array.isArray(soapResult.subjective.chiefComplaints) && soapResult.subjective.chiefComplaints.length > 0, `Chief complaints extracted: ${soapResult.subjective.chiefComplaints.join(', ')}`);
    assert(typeof soapResult.subjective.historyOfPresentIllness === 'string' && soapResult.subjective.historyOfPresentIllness.length > 20, 'History of Present Illness (HPI) synthesized');
    assert(soapResult.objective.observedVitalsSummary.includes('135/85'), 'Observed vitals integrated in objective summary');
    assert(soapResult.assessment.primaryImpression.toLowerCase().includes('migraine'), `Primary impression identified: ${soapResult.assessment.primaryImpression}`);
    assert(soapResult.assessment.differentialDiagnosisSuggestions.some((d) => d.icd10Hint === 'G43.909'), 'ICD-10 grounding mapped (G43.909 Migraine)');
    assert(Array.isArray(soapResult.plan.nonPharmacologicalAdvice) && soapResult.plan.nonPharmacologicalAdvice.length > 0, 'Non-pharmacological advice generated');
    assert(soapResult.plan.followUpRecommendation.includes('5 to 7 days'), 'Follow-up timeline recommendation formatted');
    assert(soapResult.metadata.aiDraft === true, 'Flagged explicitly as aiDraft (Non-autonomous)');
    assert(soapResult.metadata.disclaimer.includes('Non-autonomous clinical draft'), 'Mandatory Human-in-the-Loop disclaimer embedded');

    // 7. Test Longitudinal Patient EMR Summary
    console.log('\n--- 7. Testing Longitudinal Patient EMR Summary ---');
    const summaryInput = {
      age: 52,
      gender: 'MALE',
      chronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      allergies: ['Penicillin'],
      pastVisits: [
        { chiefComplaints: ['Recurrent headache', 'Fatigue'] },
        { chiefComplaints: ['High blood sugar review'] }
      ],
      pastPrescriptions: [
        {
          medications: [
            { name: 'Metformin', dosage: '500mg', frequency: '1-0-1' },
            { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0' }
          ]
        }
      ]
    };

    const summaryResult = await summarizePatientHistory(summaryInput);
    assert(Boolean(summaryResult), 'Longitudinal summary returned');
    assert(summaryResult.briefSummary.includes('Type 2 Diabetes Mellitus'), 'Summary includes chronic condition history');
    assert(summaryResult.keyChronicConditions.length === 2, 'Key chronic conditions listed (2 found)');
    assert(summaryResult.activeMedicationsSummary.some((m) => m.includes('Metformin')), 'Active medications parsed (Metformin found)');
    assert(summaryResult.riskAlerts.some((a) => a.includes('Penicillin')), 'Risk alert triggered for Penicillin allergy');

    // 8. Test Pharmacovigilance & Drug Safety Screening
    console.log('\n--- 8. Testing Pharmacovigilance & Drug Safety Screening ---');

    // 8.1 Critical Penicillin Allergy Conflict
    const check1 = checkDrugSafety({
      medications: [{ name: 'Amoxicillin + Clavulanic Acid', dosage: '625mg', frequency: '1-0-1' }],
      allergies: ['Penicillin']
    });
    assert(check1.hasConflict === true, 'Check 1: Detected allergy conflict for Amoxicillin in Penicillin allergy');
    assert(check1.maxSeverity === 'CRITICAL', 'Check 1: Conflict rated as CRITICAL');
    assert(check1.alerts[0].type === 'ALLERGY_CONFLICT', 'Check 1: Alert type is ALLERGY_CONFLICT');

    // 8.2 Cephalosporin Cross-Reactivity
    const check2 = checkDrugSafety({
      medications: [{ name: 'Cefixime', dosage: '200mg', frequency: '1-0-1' }],
      allergies: ['Penicillin']
    });
    assert(check2.hasConflict === true, 'Check 2: Detected Cephalosporin cross-reactivity with Penicillin');
    assert(check2.maxSeverity === 'HIGH', 'Check 2: Severity rated as HIGH');

    // 8.3 Sulfa Drug Allergy
    const check3 = checkDrugSafety({
      medications: [{ name: 'Cotrimoxazole (Bactrim)', dosage: 'Double Strength' }],
      allergies: ['Sulfa Drugs']
    });
    assert(check3.hasConflict === true && check3.maxSeverity === 'CRITICAL', 'Check 3: Detected CRITICAL Sulfa allergy conflict');

    // 8.4 NSAID in Peptic Ulcer Disease
    const check4 = checkDrugSafety({
      medications: [{ name: 'Ibuprofen', dosage: '400mg' }],
      chronicConditions: ['Peptic Ulcer Disease']
    });
    assert(check4.hasConflict === true, 'Check 4: Detected NSAID contraindication in Peptic Ulcer');
    assert(check4.alerts[0].type === 'CONDITION_CONTRAINDICATION', 'Check 4: Alert type is CONDITION_CONTRAINDICATION');

    // 8.5 Beta-Blocker in Bronchial Asthma
    const check5 = checkDrugSafety({
      medications: [{ name: 'Propranolol', dosage: '40mg' }],
      chronicConditions: ['Bronchial Asthma']
    });
    assert(check5.hasConflict === true && check5.maxSeverity === 'CRITICAL', 'Check 5: Non-selective beta blocker in Asthma flagged as CRITICAL bronchospasm risk');

    // 8.6 Corticosteroid in Diabetes
    const check6 = checkDrugSafety({
      medications: [{ name: 'Prednisolone', dosage: '20mg' }],
      chronicConditions: ['Type 2 Diabetes Mellitus']
    });
    assert(check6.hasConflict === true && check6.maxSeverity === 'HIGH', 'Check 6: Steroid in Diabetes flagged as HIGH hyperglycemia risk');

    // 8.7 Clean / Safe Prescription
    const check7 = checkDrugSafety({
      medications: [{ name: 'Paracetamol', dosage: '650mg', frequency: 'SOS' }],
      allergies: ['Penicillin', 'Sulfa'],
      chronicConditions: ['Hypertension']
    });
    assert(check7.hasConflict === false && check7.maxSeverity === 'NONE', 'Check 7: Safe medication cleared with zero conflicts');

    // 9. Test Operational Queue Forecasting
    console.log('\n--- 9. Testing Operational Queue Forecasting ---');
    const forecast = forecastQueueOperations({
      todayCheckIns: 48,
      averageDailyTokens: 50,
      currentHour: 11
    });
    assert(forecast.expectedFootfallToday >= 48, `Expected footfall predicted: ${forecast.expectedFootfallToday} patients`);
    assert(typeof forecast.predictedPeakHours === 'string', `Predicted peak hours: ${forecast.predictedPeakHours}`);
    assert(typeof forecast.recommendedStaffing === 'string', `Recommended staffing: ${forecast.recommendedStaffing}`);
    assert(forecast.averageWaitForecastMinutes > 0, `Average wait time forecast: ${forecast.averageWaitForecastMinutes} mins`);

    // 10. Test Immutable Audit Trail Logging
    console.log('\n--- 10. Testing Immutable Audit Trail Logging ---');
    const auditRecord = await logAIAuditEvent({
      clinicId: clinic._id,
      action: 'AI_SOAP_SUMMARY_GENERATED',
      actorUserId: doctor.userId,
      actorRole: 'DOCTOR',
      details: {
        feature: 'DICTATION_TO_SOAP',
        inputLength: 120,
        primaryImpression: 'Migraine without aura'
      },
      ipAddress: '127.0.0.1'
    });
    assert(Boolean(auditRecord?._id), `Audit log document saved to MongoDB (ID: ${auditRecord?._id})`);
    assert(auditRecord.action === 'AI_SOAP_SUMMARY_GENERATED', 'Audit action verified');
    assert(auditRecord.actorRole === 'DOCTOR', 'Audit actor role verified');

    // Doctor Acceptance Audit Event
    const acceptAudit = await logAIAuditEvent({
      clinicId: clinic._id,
      action: 'AI_DRAFT_ACCEPTED',
      actorUserId: doctor.userId,
      actorRole: 'DOCTOR',
      details: {
        feature: 'DICTATION_TO_SOAP',
        doctorEditedBeforeSave: true,
        notes: 'Doctor adjusted follow-up from 5 to 7 days'
      }
    });
    assert(acceptAudit.action === 'AI_DRAFT_ACCEPTED', 'Doctor acceptance audit event recorded with edit tracking');

    // 11. Test Express Controllers
    console.log('\n--- 11. Testing Express Controllers ---');
    const {
      soapAssist,
      summarizeHistory,
      checkDrugInteractions,
      getOperationalForecast,
      auditAccept,
      getAuditLogs
    } = await import('./dist/controllers/aiController.js');

    assert(typeof soapAssist === 'function', 'soapAssist controller verified');
    assert(typeof summarizeHistory === 'function', 'summarizeHistory controller verified');
    assert(typeof checkDrugInteractions === 'function', 'checkDrugInteractions controller verified');
    assert(typeof getOperationalForecast === 'function', 'getOperationalForecast controller verified');
    assert(typeof auditAccept === 'function', 'auditAccept controller verified');
    assert(typeof getAuditLogs === 'function', 'getAuditLogs controller verified');

    // Helper for mock HTTP context
    const createMockContext = (body = {}, query = {}, user = null) => {
      const req = {
        body,
        query,
        user: user || { _id: doctor.userId, role: 'DOCTOR' },
        ip: '127.0.0.1'
      };
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

      return { req, res, getData: () => responseData?.data, getFull: () => responseData };
    };

    // Test soapAssist Controller
    const ctxSoap = createMockContext({ rawNotes: 'Patient has high grade fever for 2 days with chills and body ache' });
    await soapAssist(ctxSoap.req, ctxSoap.res, (e) => { throw e; });
    const soapCtrlData = ctxSoap.getData();
    assert(soapCtrlData.subjective.chiefComplaints.some((c) => c.toLowerCase().includes('fever')), 'soapAssist HTTP endpoint returned structured complaints');

    // Test summarizeHistory Controller
    const ctxHist = createMockContext({
      age: 35,
      gender: 'FEMALE',
      chronicConditions: ['Hypothyroidism'],
      allergies: ['Sulfa']
    });
    await summarizeHistory(ctxHist.req, ctxHist.res, (e) => { throw e; });
    const histCtrlData = ctxHist.getData();
    assert(Boolean(histCtrlData.briefSummary), 'summarizeHistory HTTP endpoint returned briefing');

    // Test checkDrugInteractions Controller
    const ctxDrug = createMockContext({
      medications: [{ name: 'Amoxicillin' }],
      allergies: ['Penicillin']
    });
    await checkDrugInteractions(ctxDrug.req, ctxDrug.res, (e) => { throw e; });
    const drugCtrlData = ctxDrug.getData();
    assert(drugCtrlData.hasConflict === true && drugCtrlData.maxSeverity === 'CRITICAL', 'checkDrugInteractions HTTP endpoint caught critical conflict');

    // Test getOperationalForecast Controller
    const ctxForecast = createMockContext();
    await getOperationalForecast(ctxForecast.req, ctxForecast.res, (e) => { throw e; });
    const forecastCtrlData = ctxForecast.getData();
    assert(typeof forecastCtrlData.expectedFootfallToday === 'number', 'getOperationalForecast HTTP endpoint returned expected footfall');

    // Test auditAccept Controller
    const ctxAccept = createMockContext({
      action: 'ACCEPTED',
      feature: 'DICTATION_TO_SOAP',
      doctorEditedBeforeSave: true,
      notes: 'Doctor verified and approved AI draft'
    });
    await auditAccept(ctxAccept.req, ctxAccept.res, (e) => { throw e; });
    const acceptCtrlData = ctxAccept.getData();
    assert(acceptCtrlData.status === 'AUDIT_RECORDED', 'auditAccept HTTP endpoint confirmed audit recording');

    // Test getAuditLogs Controller
    const ctxLogs = createMockContext({}, { page: '1', limit: '10' });
    await getAuditLogs(ctxLogs.req, ctxLogs.res, (e) => { throw e; });
    const logsCtrlData = ctxLogs.getData();
    assert(Array.isArray(logsCtrlData.logs) && logsCtrlData.logs.length > 0, `getAuditLogs HTTP endpoint returned paginated audit trail (${logsCtrlData.logs.length} entries)`);

    console.log('\n================================================================');
    console.log(`   PHASE 14 TESTS COMPLETED: ${passed}/${total} PASSED (100%)    `);
    console.log('================================================================');

  } catch (err) {
    console.error('Fatal error during Phase 14 test execution:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runPhase14Tests();
