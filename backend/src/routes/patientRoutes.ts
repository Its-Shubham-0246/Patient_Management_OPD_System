import { Router } from 'express';
import {
  getAllPatients,
  searchPatients,
  getPatientById,
  createPatient,
  updatePatient,
  addPatientDocument,
  addChronicCondition,
  getPatientMedicalHistory
} from '../controllers/patientController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Debounced search endpoint for quick query
router.get('/search', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), searchPatients);

// Patient Roster Query
router.get('/', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getAllPatients);

// Patient Registration
router.post('/', authenticate, restrictTo('RECEPTIONIST', 'ADMIN'), createPatient);

// Fetch Single Patient (by MongoDB ID or UHID)
router.get('/:id', authenticate, getPatientById);

// Update Demographics / Profile
router.put('/:id', authenticate, updatePatient);

// Medical History & Attachments
router.get('/:id/medical-history', authenticate, getPatientMedicalHistory);
router.post('/:id/medical-history', authenticate, restrictTo('DOCTOR', 'ADMIN'), addChronicCondition);
router.post('/:id/documents', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), addPatientDocument);

export default router;

