import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  getAvailableSlots,
  autoAllocateDoctor
} from '../controllers/appointmentController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Auto allocation recommendation endpoint
router.get('/auto-allocate', authenticate, autoAllocateDoctor);

// Slots calculation for doctor
router.get('/doctor/:doctorId/slots', authenticate, getAvailableSlots);

// Appointments query and booking
router.get('/', authenticate, getAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.post('/', authenticate, createAppointment);
router.put('/:id/status', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), updateAppointmentStatus);

export default router;
