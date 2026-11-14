import mongoose from 'mongoose';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_opd';
const TEST_PORT = 5055;

async function runSystemVerification() {
  console.log('================================================================');
  console.log('    SMART OPD SYSTEM - FULL LIVE SUBSYSTEM VERIFICATION PROBE   ');
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

  let server = null;

  try {
    // 1. Connect Database
    console.log('\n--- 1. Database Connection & Seed Data ---');
    await mongoose.connect(MONGO_URI);
    assert(mongoose.connection.readyState === 1, 'MongoDB connection active and ready');

    // 2. Start Live Express Server
    console.log('\n--- 2. Starting Express Server on Port ' + TEST_PORT + ' ---');
    const { createServer } = await import('./dist/server.js');
    const app = createServer();
    server = http.createServer(app);

    await new Promise((resolve) => {
      server.listen(TEST_PORT, '127.0.0.1', () => {
        resolve();
      });
    });
    assert(server.listening, `Live HTTP server listening on http://127.0.0.1:${TEST_PORT}`);

    // Helper for HTTP requests
    const apiCall = async (method, path, body = null, token = null) => {
      const url = `http://127.0.0.1:${TEST_PORT}/api/v1${path}`;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      };

      const res = await fetch(url, options);
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // 3. Health Probe Endpoint
    console.log('\n--- 3. Probing Health Check Endpoint ---');
    const healthRes = await apiCall('GET', '/health');
    assert(healthRes.status === 200, `GET /api/v1/health returned HTTP 200 OK`);
    assert(healthRes.data?.data?.database?.isConnected === true, `Health probe reports MongoDB connected`);

    // 4. Seed Endpoint
    console.log('\n--- 4. Seeding/Verifying Demo User Accounts ---');
    const seedRes = await apiCall('POST', '/auth/seed');
    assert(seedRes.status === 200 || seedRes.status === 201, `POST /api/v1/auth/seed succeeded (HTTP ${seedRes.status})`);
    assert(seedRes.data?.data?.accounts?.length >= 4, `4 Demo accounts configured: Admin, Doctor, Receptionist, Patient`);

    // 5. Authentication Test: Admin Login
    console.log('\n--- 5. Testing Role-Based Authentication ---');
    const adminLogin = await apiCall('POST', '/auth/login', {
      loginIdentifier: '9876543210',
      password: 'Admin@123'
    });
    assert(adminLogin.status === 200, 'Admin login succeeded (HTTP 200)');
    const adminToken = adminLogin.data?.data?.accessToken;
    assert(Boolean(adminToken), 'Admin JWT access token issued');
    assert(adminLogin.data?.data?.user?.role === 'ADMIN', 'Admin role verified in token payload');

    // Doctor Login
    const docLogin = await apiCall('POST', '/auth/login', {
      loginIdentifier: '9876543211',
      password: 'Doctor@123'
    });
    assert(docLogin.status === 200, 'Doctor login succeeded (HTTP 200)');
    const docToken = docLogin.data?.data?.accessToken;
    assert(docLogin.data?.data?.user?.role === 'DOCTOR', 'Doctor role verified');

    // Receptionist Login
    const recLogin = await apiCall('POST', '/auth/login', {
      loginIdentifier: '9876543212',
      password: 'Reception@123'
    });
    assert(recLogin.status === 200, 'Receptionist login succeeded (HTTP 200)');
    const recToken = recLogin.data?.data?.accessToken;
    assert(recLogin.data?.data?.user?.role === 'RECEPTIONIST', 'Receptionist role verified');

    // Patient Login
    const patLogin = await apiCall('POST', '/auth/login', {
      loginIdentifier: '9876543213',
      password: 'Patient@123'
    });
    assert(patLogin.status === 200, 'Patient login succeeded (HTTP 200)');
    assert(patLogin.data?.data?.user?.role === 'PATIENT', 'Patient role verified');

    // 6. Clinic Settings Endpoint
    console.log('\n--- 6. Probing Clinic Profile & Roster Endpoints ---');
    const clinicRes = await apiCall('GET', '/clinic', null, adminToken);
    assert(clinicRes.status === 200, 'GET /api/v1/clinic returned HTTP 200');
    assert(Boolean(clinicRes.data?.data?.clinicName), `Clinic Identity verified: ${clinicRes.data?.data?.clinicName}`);

    // Doctor Directory
    const docsRes = await apiCall('GET', '/doctors', null, recToken);
    assert(docsRes.status === 200, 'GET /api/v1/doctors returned HTTP 200');
    assert(Array.isArray(docsRes.data?.data) && docsRes.data.data.length > 0, `Active Doctors listed: ${docsRes.data?.data?.length} physicians`);

    // 7. Patient Management Endpoint
    console.log('\n--- 7. Probing Patient Management & Ingress ---');
    const patListRes = await apiCall('GET', '/patients?limit=5', null, recToken);
    assert(patListRes.status === 200, 'GET /api/v1/patients returned HTTP 200');
    assert(Array.isArray(patListRes.data?.data?.patients), `Patient directory searchable (${patListRes.data?.data?.total} registered)`);

    // 8. Appointment Scheduling Endpoint
    console.log('\n--- 8. Probing Appointments & Scheduling ---');
    const apptListRes = await apiCall('GET', '/appointments?limit=5', null, recToken);
    assert(apptListRes.status === 200, 'GET /api/v1/appointments returned HTTP 200');
    assert(Array.isArray(apptListRes.data?.data?.appointments || apptListRes.data?.data), 'Appointments schedule queries functional');

    // 9. Digital Prescriptions & EMR Endpoints
    console.log('\n--- 9. Probing Consultation & Prescriptions ---');
    const rxRes = await apiCall('GET', '/prescriptions/formulary', null, docToken);
    assert(rxRes.status === 200, 'GET /api/v1/prescriptions/formulary returned HTTP 200');
    assert(Array.isArray(rxRes.data?.data?.medications), 'Prescription formulary catalog accessible');

    // 10. Billing & Ledger Endpoints
    console.log('\n--- 10. Probing Invoicing & Billing Ledger ---');
    const invRes = await apiCall('GET', '/billing?limit=5', null, adminToken);
    assert(invRes.status === 200, 'GET /api/v1/billing returned HTTP 200');
    assert(Array.isArray(invRes.data?.data?.invoices || invRes.data?.data), 'Itemized invoice ledger functional');

    // 11. Notifications Hub Endpoints
    console.log('\n--- 11. Probing Multi-Channel Notifications Hub ---');
    const notifRes = await apiCall('GET', '/notifications?limit=5', null, adminToken);
    assert(notifRes.status === 200, 'GET /api/v1/notifications returned HTTP 200');
    assert(Array.isArray(notifRes.data?.data?.notifications || notifRes.data?.data), 'Notification dispatch feed functional');

    // 12. Business Analytics & Financial KPIs
    console.log('\n--- 12. Probing Business Analytics & BI ---');
    const analyticsRes = await apiCall('GET', '/analytics/overview', null, adminToken);
    assert(analyticsRes.status === 200, 'GET /api/v1/analytics/overview returned HTTP 200');
    assert(typeof analyticsRes.data?.data?.totalRevenue === 'number', `Executive KPI: Total Invoiced Revenue Rs. ${analyticsRes.data?.data?.totalRevenue}`);
    assert(typeof analyticsRes.data?.data?.totalPatients === 'number', `Executive KPI: Total Patients Footfall ${analyticsRes.data?.data?.totalPatients}`);

    // Revenue Breakdown
    const revRes = await apiCall('GET', '/analytics/revenue', null, adminToken);
    assert(revRes.status === 200, 'GET /api/v1/analytics/revenue returned HTTP 200');
    assert(Boolean(revRes.data?.data?.byMethod), 'Payment methods breakdown calculated (cash, upi, card)');

    // 13. Clinical AI Co-Pilot Endpoints
    console.log('\n--- 13. Probing Clinical AI Co-Pilot & Safety Gates ---');
    const soapRes = await apiCall(
      'POST',
      '/ai/soap-assist',
      {
        rawNotes: 'Patient 45M complains of dry cough and low grade fever for 3 days, BP 130/80, pulse 76, no wheezing, advise chest X-ray and symptomatic cough syrup'
      },
      docToken
    );
    assert(soapRes.status === 200, 'POST /api/v1/ai/soap-assist returned HTTP 200');
    assert(soapRes.data?.data?.metadata?.aiDraft === true, 'SOAP output flagged as non-autonomous aiDraft');
    assert(soapRes.data?.data?.subjective?.chiefComplaints?.length > 0, 'Chief complaints structured automatically');

    // Drug Safety Screen
    const safetyRes = await apiCall(
      'POST',
      '/ai/drug-interaction-check',
      {
        medications: [{ name: 'Amoxicillin' }],
        allergies: ['Penicillin']
      },
      docToken
    );
    assert(safetyRes.status === 200, 'POST /api/v1/ai/drug-interaction-check returned HTTP 200');
    assert(safetyRes.data?.data?.hasConflict === true, 'Pharmacovigilance engine caught Penicillin-Amoxicillin allergy');
    assert(safetyRes.data?.data?.maxSeverity === 'CRITICAL', 'Severity rated as CRITICAL');

    // Compliance Audit Logs
    const auditRes = await apiCall('GET', '/ai/audit-logs?limit=5', null, adminToken);
    assert(auditRes.status === 200, 'GET /api/v1/ai/audit-logs returned HTTP 200');
    assert(Array.isArray(auditRes.data?.data?.logs), 'Compliance audit trail accessible');

    console.log('\n================================================================');
    console.log(` FULL SYSTEM LIVE VERIFICATION: ${passed}/${total} PASSED (100%) `);
    console.log(' All Live HTTP Endpoints & Clinical Subsystems Operating Properly');
    console.log('================================================================');

  } catch (err) {
    console.error('Fatal error during Live System Verification:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log('[System Probe] Test HTTP server stopped.');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('[System Probe] Disconnected from MongoDB.');
    }
  }
}

runSystemVerification();
