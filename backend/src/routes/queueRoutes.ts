import { Router } from 'express';
import {
  getDoctorQueue,
  getDisplayQueue,
  checkInPatient,
  callNextToken,
  startConsultation,
  completeConsultation,
  skipToken,
  recallToken,
  markEmergency
} from '../controllers/queueController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public TV Display endpoint (No auth required for wall-mounted TV)
router.get('/display', getDisplayQueue);

// Protected Queue Operations
router.get('/doctor/:doctorId', authenticate, getDoctorQueue);
router.get('/:doctorId', authenticate, getDoctorQueue);
router.post('/checkin', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), checkInPatient);

// Doctor & Staff Queue Controls
router.put('/:entryId/call-next', authenticate, restrictTo('DOCTOR', 'RECEPTIONIST', 'ADMIN'), callNextToken);
router.put('/:entryId/start', authenticate, restrictTo('DOCTOR', 'ADMIN'), startConsultation);
router.put('/:entryId/complete', authenticate, restrictTo('DOCTOR', 'ADMIN'), completeConsultation);
router.put('/:entryId/skip', authenticate, restrictTo('DOCTOR', 'RECEPTIONIST', 'ADMIN'), skipToken);
router.put('/:entryId/recall', authenticate, restrictTo('DOCTOR', 'RECEPTIONIST', 'ADMIN'), recallToken);
router.put('/:entryId/emergency', authenticate, restrictTo('DOCTOR', 'ADMIN'), markEmergency);

export default router;
