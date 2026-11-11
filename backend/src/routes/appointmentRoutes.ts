import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  getCalendarAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  getAvailableSlots,
  autoAllocateDoctor,
  bookAutoAllocatedAppointment
} from '../controllers/appointmentController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Auto allocation recommendation endpoint
router.get('/auto-allocate', authenticate, autoAllocateDoctor);
router.post('/auto-allocate', authenticate, bookAutoAllocatedAppointment);

// Calendar range view query
router.get('/calendar', authenticate, getCalendarAppointments);

// Slots calculation for doctor
router.get('/doctor/:doctorId/slots', authenticate, getAvailableSlots);

// Appointments query and booking
router.get('/', authenticate, getAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.post('/', authenticate, createAppointment);
router.put('/:id/status', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), updateAppointmentStatus);
router.put('/:id/reschedule', authenticate, rescheduleAppointment);
router.put('/:id/cancel', authenticate, cancelAppointment);

export default router;

