import { Router } from 'express';
import {
  soapAssist,
  summarizeHistory,
  checkDrugInteractions,
  getOperationalForecast,
  auditAccept,
  getAuditLogs
} from '../controllers/aiController.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = Router();

// Doctor Consultation AI Co-Pilot & Safety Gates
router.post('/soap-assist', authenticate, restrictTo('DOCTOR', 'ADMIN'), soapAssist);
router.post('/summarize-history', authenticate, restrictTo('DOCTOR', 'ADMIN'), summarizeHistory);
router.post('/drug-interaction-check', authenticate, restrictTo('DOCTOR', 'ADMIN'), checkDrugInteractions);
router.post('/operational-forecast', authenticate, restrictTo('DOCTOR', 'ADMIN', 'RECEPTIONIST'), getOperationalForecast);

// Human-In-The-Loop Approval & Governance Audit Trail
router.post('/audit-accept', authenticate, restrictTo('DOCTOR', 'ADMIN'), auditAccept);
router.get('/audit-logs', authenticate, restrictTo('DOCTOR', 'ADMIN'), getAuditLogs);

export default router;

