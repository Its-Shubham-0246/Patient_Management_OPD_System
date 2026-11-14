import { Router } from 'express';
import { recordPayment, getInvoicePayments } from '../controllers/billingController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// REST /payments endpoints
router.post('/', authenticate, restrictTo('RECEPTIONIST', 'ADMIN'), recordPayment);
router.get('/:invoiceId', authenticate, getInvoicePayments);

export default router;

