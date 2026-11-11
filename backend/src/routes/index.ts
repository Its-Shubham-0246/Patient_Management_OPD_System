import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import clinicRoutes from './clinicRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import staffRoutes from './staffRoutes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

// Core route controllers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/clinic', clinicRoutes);
router.use('/doctors', doctorRoutes);
router.use('/staff', staffRoutes);

// Root API v1 info
router.get('/', (req, res) => {
  return sendSuccess(res, {
    name: 'Smart OPD Management System API',
    version: '1.0.0',
    documentation: '/docs',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      clinic: '/api/v1/clinic',
      doctors: '/api/v1/doctors',
      patients: '/api/v1/patients',
      appointments: '/api/v1/appointments',
      queue: '/api/v1/queue',
      prescriptions: '/api/v1/prescriptions',
      invoices: '/api/v1/invoices',
      analytics: '/api/v1/analytics'
    }
  });
});

export default router;

