import { Router } from 'express';
import { getAllStaff, createStaff, updateStaff } from '../controllers/staffController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Staff management is admin-only
router.get('/', authenticate, restrictTo('ADMIN'), getAllStaff);
router.post('/', authenticate, restrictTo('ADMIN'), createStaff);
router.put('/:id', authenticate, restrictTo('ADMIN'), updateStaff);

export default router;

