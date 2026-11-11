import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  getDoctorSchedule,
  updateDoctorSchedule,
  getDoctorLeaves,
  requestDoctorLeave,
  updateLeaveStatus
} from '../controllers/doctorController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public / Roster query
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/schedule', getDoctorSchedule);
router.get('/:id/leaves', getDoctorLeaves);

// Authenticated modifications
router.post('/', authenticate, restrictTo('ADMIN'), createDoctor);
router.put('/:id', authenticate, restrictTo('ADMIN'), updateDoctor);
router.put('/:id/schedule', authenticate, restrictTo('ADMIN', 'DOCTOR'), updateDoctorSchedule);
router.post('/:id/leaves', authenticate, restrictTo('ADMIN', 'DOCTOR'), requestDoctorLeave);
router.put('/leaves/:leaveId/status', authenticate, restrictTo('ADMIN'), updateLeaveStatus);

export default router;

