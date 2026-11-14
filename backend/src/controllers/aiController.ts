import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  structureToSoapNote,
  summarizePatientHistory,
  checkDrugSafety,
  forecastQueueOperations,
  logAIAuditEvent,
  anonymizeClinicalPayload
} from '../services/aiAssistantService.js';
import { Patient } from '../models/Patient.js';
import { Visit } from '../models/Visit.js';
import { Prescription } from '../models/Prescription.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getOrCreateClinic } from './authController.js';

/**
 * 1. POST /api/v1/ai/soap-assist
 * Transcribe raw doctor dictation/notes into structured SOAP draft with ICD-10 suggestions
 */
export const soapAssist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = (req as any).user;
    const { rawNotes, age, gender, vitals, patientId } = req.body;

    if (!rawNotes || typeof rawNotes !== 'string') {
      return sendError(res, 'rawNotes string is required for SOAP structuring', 400);
    }

    const soapDraft = await structureToSoapNote({
      rawNotes,
      age: age ? Number(age) : undefined,
      gender,
      vitals
    });

    // Immutable audit logging
    if (user) {
      await logAIAuditEvent({
        clinicId: clinic._id,
        action: 'AI_SOAP_SUMMARY_GENERATED',
        actorUserId: user._id,
        actorRole: user.role,
        patientId: patientId && mongoose.isValidObjectId(patientId) ? patientId : undefined,
        details: {
          feature: 'DICTATION_TO_SOAP',
          inputLength: rawNotes.length,
          primaryImpression: soapDraft.assessment.primaryImpression,
          suggestedIcdCodes: soapDraft.assessment.differentialDiagnosisSuggestions.map((s) => s.icd10Hint)
        },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, soapDraft);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/v1/ai/summarize-history
 * Synthesize multi-visit longitudinal medical record for the consulting physician
 */
export const summarizeHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = (req as any).user;
    const { patientId, age, gender, chronicConditions, allergies, pastVisits, pastPrescriptions } = req.body;

    let payloadAge = age;
    let payloadGender = gender;
    let payloadConditions = chronicConditions || [];
    let payloadAllergies = allergies || [];
    let payloadVisits = pastVisits || [];
    let payloadPrescriptions = pastPrescriptions || [];

    // If patientId is provided, pull real longitudinal MongoDB data
    if (patientId && mongoose.isValidObjectId(patientId)) {
      const patient = await Patient.findById(patientId).lean();
      if (patient) {
        payloadAge = patient.age;
        payloadGender = patient.gender;
        payloadConditions = patient.chronicConditions || [];
        payloadAllergies = patient.allergies || [];
      }

      const [visits, prescriptions] = await Promise.all([
        Visit.find({ patientId, clinicId: clinic._id }).sort({ visitDate: -1 }).limit(5).lean(),
        Prescription.find({ patientId, clinicId: clinic._id }).sort({ createdAt: -1 }).limit(5).lean()
      ]);

      payloadVisits = visits;
      payloadPrescriptions = prescriptions;
    }

    const summary = await summarizePatientHistory({
      age: payloadAge,
      gender: payloadGender,
      chronicConditions: payloadConditions,
      allergies: payloadAllergies,
      pastVisits: payloadVisits,
      pastPrescriptions: payloadPrescriptions
    });

    if (user) {
      await logAIAuditEvent({
        clinicId: clinic._id,
        action: 'AI_HISTORY_SUMMARIZED',
        actorUserId: user._id,
        actorRole: user.role,
        patientId: patientId && mongoose.isValidObjectId(patientId) ? patientId : undefined,
        details: {
          feature: 'LONGITUDINAL_SUMMARY',
          encountersAnalyzed: payloadVisits.length,
          chronicConditionsCount: payloadConditions.length
        },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/v1/ai/drug-interaction-check
 * Verify proposed prescription against patient's documented allergies and chronic diseases
 */
export const checkDrugInteractions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = (req as any).user;
    const { medications, allergies, chronicConditions, patientId } = req.body;

    if (!Array.isArray(medications)) {
      return sendError(res, 'medications must be an array', 400);
    }

    let resolvedAllergies = allergies || [];
    let resolvedConditions = chronicConditions || [];

    // If patientId supplied, augment with live documented medical alerts
    if (patientId && mongoose.isValidObjectId(patientId)) {
      const patient = await Patient.findById(patientId).select('allergies chronicConditions').lean();
      if (patient) {
        if (Array.isArray(patient.allergies)) {
          resolvedAllergies = Array.from(new Set([...resolvedAllergies, ...patient.allergies]));
        }
        if (Array.isArray(patient.chronicConditions)) {
          resolvedConditions = Array.from(new Set([...resolvedConditions, ...patient.chronicConditions]));
        }
      }
    }

    const checkResult = checkDrugSafety({
      medications,
      allergies: resolvedAllergies,
      chronicConditions: resolvedConditions
    });

    if (user) {
      await logAIAuditEvent({
        clinicId: clinic._id,
        action: 'AI_DRUG_CHECK_PERFORMED',
        actorUserId: user._id,
        actorRole: user.role,
        patientId: patientId && mongoose.isValidObjectId(patientId) ? patientId : undefined,
        details: {
          medicationsChecked: medications.map((m) => m.name),
          hasConflict: checkResult.hasConflict,
          maxSeverity: checkResult.maxSeverity,
          alertsCount: checkResult.alerts.length
        },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, checkResult);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/v1/ai/operational-forecast
 * Predict OPD patient influx and provide dynamic queue recommendations
 */
export const getOperationalForecast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayCount, totalHistoryCount] = await Promise.all([
      QueueEntry.countDocuments({
        clinicId: clinic._id,
        queueDate: { $gte: startOfToday }
      }),
      QueueEntry.countDocuments({ clinicId: clinic._id })
    ]);

    const averageDaily = Math.max(15, Math.round(totalHistoryCount / 10));

    const forecast = forecastQueueOperations({
      todayCheckIns: todayCount,
      averageDailyTokens: averageDaily,
      currentHour: now.getHours()
    });

    return sendSuccess(res, forecast);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/v1/ai/audit-accept
 * Doctor explicitly approves, edits, or discards an AI suggestion (HITL Compliance)
 */
export const auditAccept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = (req as any).user;
    const { action, feature, patientId, doctorEditedBeforeSave, targetResourceId, notes } = req.body;

    const recordedAction = action === 'DISCARDED' ? 'AI_DRAFT_DISCARDED' : 'AI_DRAFT_ACCEPTED';

    const logEntry = await logAIAuditEvent({
      clinicId: clinic._id,
      action: recordedAction,
      actorUserId: user ? user._id : new mongoose.Types.ObjectId(),
      actorRole: user ? user.role : 'DOCTOR',
      patientId: patientId && mongoose.isValidObjectId(patientId) ? patientId : undefined,
      targetResourceId: targetResourceId && mongoose.isValidObjectId(targetResourceId) ? targetResourceId : undefined,
      details: {
        feature: feature || 'SOAP_CONSULTATION_DRAFT',
        doctorEditedBeforeSave: Boolean(doctorEditedBeforeSave),
        notes: notes || undefined,
        acceptedAt: new Date().toISOString()
      },
      ipAddress: req.ip
    });

    return sendSuccess(res, {
      status: 'AUDIT_RECORDED',
      auditId: logEntry?._id,
      action: recordedAction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/v1/ai/audit-logs
 * List compliance audit trail entries for AI governance verification
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const page = parseInt(req.query.page as string, 10) || 1;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ clinicId: clinic._id })
        .populate('actorUserId', 'fullName email role')
        .populate('patientId', 'fullName uhid')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({ clinicId: clinic._id })
    ]);

    return sendSuccess(res, {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

