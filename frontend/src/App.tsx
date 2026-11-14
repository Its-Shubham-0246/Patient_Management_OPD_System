import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClinicSettingsPage } from './pages/admin/ClinicSettingsPage';
import { DoctorManagementPage } from './pages/admin/DoctorManagementPage';
import { StaffManagementPage } from './pages/admin/StaffManagementPage';
import { PatientDirectoryPage } from './pages/reception/PatientDirectoryPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorWorkspacePage } from './pages/doctor/DoctorWorkspacePage';
import { MedicalRecordsPage } from './pages/patient/MedicalRecordsPage';
import { BillingLedgerPage } from './pages/billing/BillingLedgerPage';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { AppointmentSchedulingPage } from './pages/appointments/AppointmentSchedulingPage';
import { BookAppointmentPage } from './pages/patient/BookAppointmentPage';
import { LiveQueuePage } from './pages/queue/LiveQueuePage';
import { PatientPortal } from './pages/PatientPortal';
import { WaitingRoomDisplay } from './pages/WaitingRoomDisplay';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Fullscreen TV Display (Public Display) */}
          <Route path="/display/waiting-room" element={<WaitingRoomDisplay />} />

          {/* Public Authentication Views */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Clinical Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />

            {/* Admin Routes (Restricted to ADMIN) */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ClinicSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DoctorManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <StaffManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppointmentSchedulingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <LiveQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/consultation"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DoctorWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BillingLedgerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes (Restricted to DOCTOR & ADMIN) */}
            <Route path="/doctor" element={<Navigate to="/doctor/workspace" replace />} />
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/workspace"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <AppointmentSchedulingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <PatientDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:id"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <PatientProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/records"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/records/:id"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/*"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Reception Routes (Restricted to RECEPTIONIST & ADMIN) */}
            <Route path="/reception" element={<Navigate to="/reception/dashboard" replace />} />
            <Route
              path="/reception/dashboard"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <ReceptionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/appointments"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <AppointmentSchedulingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/billing"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <BillingLedgerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/queue"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <LiveQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/patients"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <PatientDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/records"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/records/:id"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/*"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <ReceptionDashboard />
                </ProtectedRoute>
              }
            />

            {/* General Patient Profile Routes */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'ADMIN']}>
                  <PatientDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'PATIENT']}>
                  <PatientProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Patient Portal Routes (Restricted to PATIENT & ADMIN) */}
            <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
            <Route
              path="/portal/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <PatientPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/book"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <BookAppointmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/records"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/reports"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/invoices"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <BillingLedgerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/*"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <PatientPortal />
                </ProtectedRoute>
              }
            />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

