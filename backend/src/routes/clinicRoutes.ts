import { Router } from 'express';
import {
  getClinicProfile,
  updateClinicProfile,
  getHolidays,
  addHoliday,
  deleteHoliday
} from '../controllers/clinicController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public metadata
router.get('/', getClinicProfile);
router.get('/holidays', getHolidays);

// Admin-only updates
router.put('/', authenticate, restrictTo('ADMIN'), updateClinicProfile);
router.post('/holidays', authenticate, restrictTo('ADMIN'), addHoliday);
router.delete('/holidays/:id', authenticate, restrictTo('ADMIN'), deleteHoliday);

export default router;

