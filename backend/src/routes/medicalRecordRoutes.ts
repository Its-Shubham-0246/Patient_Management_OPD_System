import { Router } from 'express';
import {
  getPatientTimeline,
  uploadReport,
  getPatientReports,
  getReportById,
  deleteReport,
  getFollowUps,
  createFollowUp,
  updateFollowUpStatus
} from '../controllers/medicalRecordController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Longitudinal Patient Timeline
router.get('/patient/:patientId/timeline', authenticate, getPatientTimeline);

// Diagnostic Reports
router.get('/patient/:patientId/reports', authenticate, getPatientReports);
router.post('/patient/:patientId/reports', authenticate, restrictTo('DOCTOR', 'ADMIN', 'RECEPTIONIST'), uploadReport);
router.get('/reports/:id', authenticate, getReportById);
router.delete('/reports/:id', authenticate, restrictTo('ADMIN', 'DOCTOR'), deleteReport);

// Follow-Ups
router.get('/followups', authenticate, getFollowUps);
router.post('/followups', authenticate, restrictTo('DOCTOR', 'ADMIN'), createFollowUp);
router.put('/followups/:id/status', authenticate, restrictTo('DOCTOR', 'RECEPTIONIST', 'ADMIN'), updateFollowUpStatus);

export default router;

