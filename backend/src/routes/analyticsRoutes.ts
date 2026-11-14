import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import {
  getOverviewAnalytics,
  getAppointmentAnalytics,
  getRevenueAnalytics,
  getDoctorAnalytics,
  getPatientAnalytics,
  getQueueAnalytics
} from '../controllers/analyticsController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Dashboard Operational Stats (legacy endpoint)
router.get('/dashboard', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getDashboardStats);

// Phase 13 Analytics & Business Intelligence Endpoints
router.get('/overview', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getOverviewAnalytics);
router.get('/appointments', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getAppointmentAnalytics);
router.get('/revenue', authenticate, restrictTo('ADMIN'), getRevenueAnalytics);
router.get('/doctors', authenticate, restrictTo('ADMIN', 'DOCTOR'), getDoctorAnalytics);
router.get('/patients', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getPatientAnalytics);
router.get('/queue', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getQueueAnalytics);

export default router;
