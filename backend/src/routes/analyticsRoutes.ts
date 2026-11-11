import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Dashboard Operational Stats
router.get('/dashboard', authenticate, restrictTo('RECEPTIONIST', 'DOCTOR', 'ADMIN'), getDashboardStats);
router.get('/overview', authenticate, restrictTo('ADMIN'), getDashboardStats);

export default router;

