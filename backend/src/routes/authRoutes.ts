import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  seedDefaultUsers
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/seed', seedDefaultUsers);

// Protected session profile endpoint
router.get('/me', authenticate, getMe);

export default router;

