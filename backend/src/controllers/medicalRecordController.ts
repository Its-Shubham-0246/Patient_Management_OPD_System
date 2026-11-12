import { Request, Response, NextFunction } from 'express';
import { MedicalReport } from '../models/MedicalReport.js';
import { FollowUp } from '../models/FollowUp.js';
import { Visit } from '../models/Visit.js';
import { Prescription } from '../models/Prescription.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// 1. Unified Longitudinal Patient Timeline
export const getPatientTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const clinic = await getOrCreateClinic();

    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // 1. Fetch Visits
    const visits = await Visit.find({ clinicId: clinic._id, patientId })
      .populate('doctorId', 'fullName specialization roomNumber department')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch Finalized Prescriptions
    const prescriptions = await Prescription.find({ clinicId: clinic._id, patientId, isFinalized: true })
      .populate('doctorId', 'fullName specialization medicalRegistrationNumber department')
      .sort({ prescriptionDate: -1 })
      .lean();

    // 3. Fetch Diagnostic Reports
    const reports = await MedicalReport.find({ clinicId: clinic._id, patientId, isDeleted: false })
      .populate('uploadedBy', 'fullName role')
      .populate('doctorId', 'fullName specialization')
      .sort({ reportDate: -1 })
      .lean();

    // 4. Fetch Follow-Ups
    const followUps = await FollowUp.find({ clinicId: clinic._id, patientId })
      .populate('doctorId', 'fullName specialization')
      .sort({ followUpDate: -1 })
      .lean();

    // Synthesize chronological timeline events
    const timelineEvents: Array<{
      id: string;
      type: 'ENCOUNTER' | 'PRESCRIPTION' | 'DIAGNOSTIC_REPORT' | 'FOLLOW_UP';
      date: Date;
      title: string;
      summary: string;
      badgeText: string;
      data: any;
    }> = [];

    // Map Visits
    for (const v of visits) {
      timelineEvents.push({
        id: `v_${v._id}`,
        type: 'ENCOUNTER',
        date: v.checkInTime || (v as any).createdAt,
        title: `OPD Visit with ${(v.doctorId as any)?.fullName || 'Physician'}`,
        summary: v.chiefComplaint || (v.diagnosis && v.diagnosis.length > 0 ? v.diagnosis.join(', ') : 'Clinical consultation encounter'),
        badgeText: v.status,
        data: v
      });
    }

    // Map Prescriptions
    for (const rx of prescriptions) {
      const medSummary = rx.medicines && rx.medicines.length > 0
        ? rx.medicines.map((m) => `${m.name} (${m.dosage})`).join(', ')
        : 'Consultation advice';

      timelineEvents.push({
        id: `rx_${rx._id}`,
        type: 'PRESCRIPTION',
        date: rx.prescriptionDate || (rx as any).createdAt,
        title: `Digital Prescription #${rx.prescriptionNumber}`,
        summary: `Diagnosis: ${rx.diagnosis?.join(', ') || 'N/A'} • Medicines: ${medSummary}`,
        badgeText: rx.isFinalized ? 'Finalized' : 'Draft',
        data: rx
      });
    }

    // Map Reports
    for (const r of reports) {
      timelineEvents.push({
        id: `rep_${r._id}`,
        type: 'DIAGNOSTIC_REPORT',
        date: r.reportDate || (r as any).createdAt,
        title: `${r.reportName || r.title} (${r.reportType.toUpperCase()})`,
        summary: `Lab: ${r.labName || 'Diagnostic Center'} ${r.findings ? '• ' + r.findings : ''}`,
        badgeText: r.reportType.toUpperCase(),
        data: r
      });
    }

    // Map Follow-ups
    for (const f of followUps) {
      timelineEvents.push({
        id: `f_${f._id}`,
        type: 'FOLLOW_UP',
        date: f.followUpDate,
        title: `Follow-Up Review with ${(f.doctorId as any)?.fullName || 'Doctor'}`,
        summary: f.reason,
        badgeText: f.status.toUpperCase(),
        data: f
      });
    }

    // Sort all events in descending chronological order
    timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Build longitudinal vitals trends
    const vitalsTrend = prescriptions
      .filter((rx) => rx.vitals && (rx.vitals.weightKg || rx.vitals.bloodPressure || rx.vitals.pulseRate))
      .map((rx) => ({
        date: rx.prescriptionDate,
        weightKg: rx.vitals?.weightKg,
        heightCm: rx.vitals?.heightCm,
        bmi: rx.vitals?.bmi,
        bloodPressure: rx.vitals?.bloodPressure,
        pulseRate: rx.vitals?.pulseRate,
        temperatureF: rx.vitals?.temperatureF,
        spo2Percent: rx.vitals?.spo2Percent
      }));

    return sendSuccess(res, {
      patient: {
        _id: patient._id,
        uhid: patient.uhid,
        fullName: patient.fullName,
        phone: patient.phone,
        gender: patient.gender,
        age: patient.age,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || []
      },
      metrics: {
        totalEncounters: visits.length,
        totalPrescriptions: prescriptions.length,
        totalReports: reports.length,
        totalFollowUps: followUps.length
      },
      vitalsTrend,
      timeline: timelineEvents
    });
  } catch (error) {
    next(error);
  }
};

// 2. Upload / Register Diagnostic Report
export const uploadReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const {
      visitId,
      doctorId,
      reportType,
      title,
      reportName,
      reportDate,
      fileUrl,
      filePublicId,
      thumbnailUrl,
      fileSizeBytes,
      mimeType,
      labName,
      referringDoctor,
      findings,
      isSharedWithPatient
    } = req.body;

    const clinic = await getOrCreateClinic();
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    const name = title || reportName;
    if (!name || !fileUrl) {
      return next(new AppError('Report title and fileUrl are required', 400));
    }

    const report = await MedicalReport.create({
      clinicId: clinic._id,
      patientId: patient._id,
      visitId,
      doctorId,
      uploadedBy: req.user?._id,
      reportType: reportType || 'lab',
      reportName: name,
      title: name,
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      fileUrl,
      filePublicId: filePublicId || 'local_storage',
      thumbnailUrl,
      fileSizeBytes: fileSizeBytes || 102400,
      mimeType: mimeType || 'application/pdf',
      labName,
      referringDoctor,
      findings,
      isSharedWithPatient: isSharedWithPatient !== undefined ? !!isSharedWithPatient : true
    });

    // Also sync to Patient's documents embedded array for cross-system consistency
    if (patient.documents) {
      patient.documents.push({
        title: name,
        docType: (reportType?.toUpperCase() === 'RADIOLOGY' ? 'IMAGING' : 'LAB_REPORT') as any,
        fileUrl,
        uploadedAt: new Date(),
        notes: findings
      });
      await patient.save();
    }

    return sendSuccess(res, report, 201);
  } catch (error) {
    next(error);
  }
};

// 3. Get Patient Diagnostic Reports
export const getPatientReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const { type } = req.query;

    const filter: any = {
      patientId,
      isDeleted: false
    };

    if (type && type !== 'all') {
      filter.reportType = type;
    }

    const reports = await MedicalReport.find(filter)
      .populate('uploadedBy', 'fullName role')
      .populate('doctorId', 'fullName specialization')
      .sort({ reportDate: -1 })
      .lean();

    return sendSuccess(res, reports);
  } catch (error) {
    next(error);
  }
};

// 4. Get Report by ID
export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await MedicalReport.findById(id)
      .populate('patientId', 'fullName uhid phone gender age')
      .populate('uploadedBy', 'fullName role')
      .populate('doctorId', 'fullName specialization');

    if (!report || report.isDeleted) {
      return next(new AppError('Report not found or has been deleted', 404));
    }

    return sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
};

// 5. Soft Delete Medical Report
export const deleteReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await MedicalReport.findById(id);

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    report.isDeleted = true;
    report.deletedAt = new Date();
    await report.save();

    return sendSuccess(res, { message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Get Follow-Ups
export const getFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const clinic = await getOrCreateClinic();

    const filter: any = { clinicId: clinic._id };
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    const followUps = await FollowUp.find(filter)
      .populate('patientId', 'fullName uhid phone')
      .populate('doctorId', 'fullName specialization roomNumber')
      .populate('prescriptionId', 'prescriptionNumber')
      .sort({ followUpDate: 1 })
      .lean();

    return sendSuccess(res, followUps);
  } catch (error) {
    next(error);
  }
};

// 7. Create Follow-Up
export const createFollowUp = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId, visitId, prescriptionId, followUpDate, reason, instructions } = req.body;
    const clinic = await getOrCreateClinic();

    if (!patientId || !doctorId || !followUpDate || !reason) {
      return next(new AppError('patientId, doctorId, followUpDate, and reason are required', 400));
    }

    const followUp = await FollowUp.create({
      clinicId: clinic._id,
      patientId,
      doctorId,
      visitId,
      prescriptionId,
      followUpDate: new Date(followUpDate),
      reason,
      instructions,
      status: 'scheduled',
      createdBy: req.user?._id
    });

    const populated = await FollowUp.findById(followUp._id)
      .populate('patientId', 'fullName uhid phone')
      .populate('doctorId', 'fullName specialization');

    return sendSuccess(res, populated, 201);
  } catch (error) {
    next(error);
  }
};

// 8. Update Follow-Up Status
export const updateFollowUpStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, linkedAppointmentId } = req.body;

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return next(new AppError('Follow-up record not found', 404));
    }

    if (status) followUp.status = status;
    if (linkedAppointmentId) followUp.linkedAppointmentId = linkedAppointmentId;
    await followUp.save();

    return sendSuccess(res, followUp);
  } catch (error) {
    next(error);
  }
};
