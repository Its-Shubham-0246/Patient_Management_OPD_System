import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { PatientPortal } from './pages/PatientPortal';
import { WaitingRoomDisplay } from './pages/WaitingRoomDisplay';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Fullscreen TV Display (No Navigation Shell) */}
        <Route path="/display/waiting-room" element={<WaitingRoomDisplay />} />

        {/* Public Authentication Views */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Clinical Application Shell */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* Doctor Routes */}
          <Route path="/doctor" element={<Navigate to="/doctor/workspace" replace />} />
          <Route path="/doctor/workspace" element={<DoctorDashboard />} />
          <Route path="/doctor/*" element={<DoctorDashboard />} />

          {/* Reception Routes */}
          <Route path="/reception" element={<Navigate to="/reception/dashboard" replace />} />
          <Route path="/reception/dashboard" element={<ReceptionDashboard />} />
          <Route path="/reception/*" element={<ReceptionDashboard />} />

          {/* Patient Portal Routes */}
          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/dashboard" element={<PatientPortal />} />
          <Route path="/portal/*" element={<PatientPortal />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
