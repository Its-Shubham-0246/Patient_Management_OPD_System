import { Router } from 'express';
import {
  savePrescription,
  getPrescriptionById,
  getPrescriptionByVisit,
  getPatientPrescriptions,
  getDoctorTodayPrescriptions,
  getFormularyCatalog
} from '../controllers/prescriptionController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public / Auth Catalogs
router.get('/formulary', authenticate, getFormularyCatalog);

// Doctor Today Completed Consultations
router.get('/doctor/today', authenticate, restrictTo('DOCTOR', 'ADMIN'), getDoctorTodayPrescriptions);

// Patient Prescription History
router.get('/patient/:patientId', authenticate, getPatientPrescriptions);

// Prescription by Visit ID
router.get('/visit/:visitId', authenticate, getPrescriptionByVisit);

// Save / Finalize Prescription for Visit
router.post('/:visitId', authenticate, restrictTo('DOCTOR', 'ADMIN'), savePrescription);

// Get Prescription by ID
router.get('/:id', authenticate, getPrescriptionById);

export default router;
