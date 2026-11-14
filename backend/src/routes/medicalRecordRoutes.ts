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

// Diagnostic Reports (supports both /records/patient/:id/reports and /reports/patient/:id)
router.get('/patient/:patientId/reports', authenticate, getPatientReports);
router.get('/patient/:patientId', authenticate, getPatientReports);

router.post('/patient/:patientId/reports', authenticate, restrictTo('DOCTOR', 'ADMIN', 'RECEPTIONIST'), uploadReport);
router.post('/patient/:patientId', authenticate, restrictTo('DOCTOR', 'ADMIN', 'RECEPTIONIST'), uploadReport);

router.get('/reports/:id', authenticate, getReportById);
router.get('/:id', authenticate, getReportById);

router.delete('/reports/:id', authenticate, restrictTo('ADMIN', 'DOCTOR'), deleteReport);
router.delete('/:id', authenticate, restrictTo('ADMIN', 'DOCTOR'), deleteReport);

// Follow-Ups (supports both /records/followups and /followups)
router.get('/followups', authenticate, getFollowUps);
router.get('/', authenticate, getFollowUps);

router.post('/followups', authenticate, restrictTo('DOCTOR', 'ADMIN'), createFollowUp);
router.post('/', authenticate, restrictTo('DOCTOR', 'ADMIN'), createFollowUp);

router.put('/followups/:id/status', authenticate, restrictTo('DOCTOR', 'RECEPTIONIST', 'ADMIN'), updateFollowUpStatus);
router.put('/:id/status', authenticate, restrictTo('DOCTOR', 'RECEPTIONIST', 'ADMIN'), updateFollowUpStatus);

export default router;
