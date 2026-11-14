import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getInvoicePayments,
  applyDiscount,
  getDailyCollectionReport,
  voidInvoice
} from '../controllers/billingController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Daily Collections Report
router.get('/daily-report', authenticate, restrictTo('RECEPTIONIST', 'ADMIN'), getDailyCollectionReport);

// Invoice CRUD & Operations
router.get('/', authenticate, getInvoices);
router.post('/', authenticate, restrictTo('RECEPTIONIST', 'ADMIN'), createInvoice);

router.get('/:id', authenticate, getInvoiceById);
router.post('/:id/payments', authenticate, restrictTo('RECEPTIONIST', 'ADMIN'), recordPayment);
router.post('/:id/discount', authenticate, restrictTo('RECEPTIONIST', 'ADMIN'), applyDiscount);
router.post('/:id/void', authenticate, restrictTo('ADMIN'), voidInvoice);
router.get('/:id/payments', authenticate, getInvoicePayments);

export default router;

