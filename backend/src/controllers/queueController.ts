import { Request, Response, NextFunction } from 'express';
import { QueueEntry } from '../models/QueueEntry.js';
import { Visit } from '../models/Visit.js';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

// Helper to mask patient name for DPDP Act privacy compliance on public TV screens: "Rahul Mehta" -> "RAHUL M."
export const maskPatientName = (fullName: string): string => {
  if (!fullName) return 'PATIENT';
  const parts = fullName.trim().toUpperCase().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
};

// Normalize today's date to midnight
const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

// Get Doctor Queue
export const getDoctorQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const { start, end } = getTodayRange();
    const clinic = await getOrCreateClinic();

    const filter: any = {
      clinicId: clinic._id,
      queueDate: { $gte: start, $lte: end }
    };

    if (doctorId && doctorId !== 'ALL') {
      filter.doctorId = doctorId;
    }

    const queueEntries = await QueueEntry.find(filter)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department averageConsultationMinutes')
      .populate('visitId', 'checkInTime consultationStartTime consultationEndTime visitType status')
      .sort({ priorityOrder: 1, tokenNumber: 1 })
      .lean();

    // Compute dynamic estimated wait minutes for WAITING entries
    let waitingCounter = 0;
    const computed = queueEntries.map((entry: any) => {
      let estWait = 0;
      if (entry.status === 'WAITING') {
        const avgMin = entry.doctorId?.averageConsultationMinutes || 15;
        estWait = waitingCounter * avgMin;
        waitingCounter++;
      }
      return {
        ...entry,
        estimatedWaitMinutes: estWait
      };
    });

    return sendSuccess(res, computed);
  } catch (error) {
    next(error);
  }
};

// Public 4K Waiting Room Display Data
export const getDisplayQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = getTodayRange();
    const clinic = await getOrCreateClinic();

    const activeDoctors = await Doctor.find({ clinicId: clinic._id, status: 'ACTIVE' }).lean();

    const displayData = await Promise.all(
      activeDoctors.map(async (doc) => {
        // Current token: CALLED or IN_CONSULTATION
        const currentServing = await QueueEntry.findOne({
          doctorId: doc._id,
          queueDate: { $gte: start, $lte: end },
          status: { $in: ['CALLED', 'IN_CONSULTATION'] }
        })
          .populate('patientId', 'fullName uhid')
          .sort({ priorityOrder: 1, calledAt: -1 })
          .lean();

        // Upcoming waiting tokens
        const upcoming = await QueueEntry.find({
          doctorId: doc._id,
          queueDate: { $gte: start, $lte: end },
          status: 'WAITING'
        })
          .populate('patientId', 'fullName uhid')
          .sort({ priorityOrder: 1, tokenNumber: 1 })
          .limit(8)
          .lean();

        return {
          doctorId: doc._id,
          doctorName: doc.fullName,
          department: doc.department,
          roomNumber: doc.roomNumber,
          currentServing: currentServing
            ? {
                tokenNumber: currentServing.tokenNumber,
                status: currentServing.status,
                isEmergency: currentServing.isEmergency,
                maskedName: maskPatientName((currentServing.patientId as any)?.fullName),
                uhid: (currentServing.patientId as any)?.uhid,
                calledAt: currentServing.calledAt
              }
            : null,
          upcomingTokens: upcoming.map((u: any) => ({
            tokenNumber: u.tokenNumber,
            isEmergency: u.isEmergency,
            maskedName: maskPatientName((u.patientId as any)?.fullName),
            uhid: (u.patientId as any)?.uhid
          })),
          waitingCount: upcoming.length
        };
      })
    );

    return sendSuccess(res, {
      clinicName: clinic.clinicName,
      timestamp: new Date(),
      rooms: displayData
    });
  } catch (error) {
    next(error);
  }
};

// Patient Live Token Lookup: Get active queue entry for a patient today
export const getPatientActiveQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const { start, end } = getTodayRange();
    const clinic = await getOrCreateClinic();

    const entry = await QueueEntry.findOne({
      clinicId: clinic._id,
      patientId,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED'] }
    })
      .populate('patientId', 'fullName uhid phone gender age bloodGroup')
      .populate('doctorId', 'fullName specialization roomNumber department averageConsultationMinutes')
      .populate('visitId', 'checkInTime consultationStartTime consultationEndTime visitType status')
      .sort({ createdAt: -1 })
      .lean();

    if (!entry) {
      return sendSuccess(res, { active: false, message: 'No active visit or token today' });
    }

    // Compute patients ahead if still waiting
    let patientsAhead = 0;
    if (entry.status === 'WAITING') {
      patientsAhead = await QueueEntry.countDocuments({
        clinicId: clinic._id,
        doctorId: (entry.doctorId as any)?._id,
        queueDate: { $gte: start, $lte: end },
        status: 'WAITING',
        $or: [
          { priorityOrder: { $lt: entry.priorityOrder } },
          { priorityOrder: entry.priorityOrder, tokenNumber: { $lt: entry.tokenNumber } }
        ]
      });
    }

    const avgMinutes = (entry.doctorId as any)?.averageConsultationMinutes || 15;
    const estimatedWaitMinutes = entry.status === 'WAITING' ? patientsAhead * avgMinutes : 0;

    // Look for currently serving token for this doctor
    const currentServing = await QueueEntry.findOne({
      clinicId: clinic._id,
      doctorId: (entry.doctorId as any)?._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['CALLED', 'IN_CONSULTATION'] }
    })
      .select('tokenNumber status calledAt')
      .lean();

    return sendSuccess(res, {
      active: true,
      entry,
      patientsAhead,
      estimatedWaitMinutes,
      currentServingToken: currentServing?.tokenNumber || null,
      currentServingStatus: currentServing?.status || null,
      currentServingCalledAt: currentServing?.calledAt || null
    });
  } catch (error) {
    next(error);
  }
};

// Physical Ingress: Check in patient
export const checkInPatient = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, patientId, doctorId, isEmergency } = req.body;
    const clinic = await getOrCreateClinic();
    const { start, end } = getTodayRange();

    let targetPatientId = patientId;
    let targetDoctorId = doctorId;

    let appointment: any;
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
      if (!appointment) return next(new AppError('Appointment not found', 404));
      targetPatientId = appointment.patientId;
      targetDoctorId = appointment.doctorId;
    }

    if (!targetPatientId || !targetDoctorId) {
      return next(new AppError('patientId and doctorId are required for check-in', 400));
    }

    // Check if patient is already in today's active queue for this doctor
    const existingQueue = await QueueEntry.findOne({
      doctorId: targetDoctorId,
      patientId: targetPatientId,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] }
    });

    if (existingQueue) {
      return next(
        new AppError(`Patient already checked in today with Token #${existingQueue.tokenNumber}`, 409)
      );
    }

    // Determine next sequential token for this doctor today
    const highestToken = await QueueEntry.findOne({
      doctorId: targetDoctorId,
      queueDate: { $gte: start, $lte: end }
    })
      .sort({ tokenNumber: -1 })
      .select('tokenNumber')
      .lean();

    const tokenNumber = (highestToken?.tokenNumber || 0) + 1;

    // Create Visit
    const visit = await Visit.create({
      clinicId: clinic._id,
      appointmentId: appointment?._id,
      patientId: targetPatientId,
      doctorId: targetDoctorId,
      checkInTime: new Date(),
      visitType: isEmergency ? 'EMERGENCY' : appointment ? 'FOLLOW_UP' : 'FIRST_VISIT',
      status: 'WAITING'
    });

    // Create QueueEntry
    const queueEntry = await QueueEntry.create({
      clinicId: clinic._id,
      visitId: visit._id,
      doctorId: targetDoctorId,
      patientId: targetPatientId,
      tokenNumber,
      queueDate: start,
      status: 'WAITING',
      isEmergency: !!isEmergency,
      priorityOrder: isEmergency ? 1 : 100
    });

    // Update appointment if linked
    if (appointment) {
      appointment.status = 'CHECKED_IN';
      appointment.tokenNumber = tokenNumber;
      await appointment.save();
    }

    const populated = await QueueEntry.findById(queueEntry._id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department averageConsultationMinutes')
      .populate('visitId');

    // Emit Socket.IO Event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', {
        doctorId: targetDoctorId,
        tokenNumber,
        status: 'WAITING'
      });
    }

    // Trigger Notification for Token Issue
    try {
      const patientObj: any = populated?.patientId;
      const docObj: any = populated?.doctorId;
      NotificationService.notifyQueueTokenIssued({
        clinicId: clinic._id,
        patientId: patientObj?._id,
        patientName: patientObj?.fullName || 'Patient',
        doctorName: docObj?.fullName || 'Doctor',
        clinicName: clinic.clinicName || 'City Health Care Clinic',
        tokenNumber,
        waitTime: 15,
        phone: patientObj?.phone,
        io
      }).catch((err) => console.error('[Queue Token Notification Error]', err));
    } catch (notifErr) {
      console.error('[Queue Token Notification Failed]', notifErr);
    }

    return sendSuccess(res, populated, 201);
  } catch (error) {
    next(error);
  }
};

// Doctor Calls Next Token
export const callNextToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId)
      .populate('patientId', 'fullName uhid')
      .populate('doctorId', 'fullName roomNumber department');

    if (!entry) return next(new AppError('Queue entry not found', 404));

    entry.status = 'CALLED';
    entry.calledAt = new Date();
    entry.callCount = (entry.callCount || 0) + 1;
    await entry.save();

    // Emit Socket.IO Event with audio chime trigger
    const io = req.app.get('io');
    if (io) {
      const payload = {
        doctorId: (entry.doctorId as any)?._id,
        roomNo: (entry.doctorId as any)?.roomNumber,
        tokenNumber: entry.tokenNumber,
        maskedPatientName: maskPatientName((entry.patientId as any)?.fullName),
        uhid: (entry.patientId as any)?.uhid,
        calledAt: entry.calledAt
      };
      io.emit('queue:called', payload);
      io.emit('queue:updated', { doctorId: (entry.doctorId as any)?._id });
    }

    // Trigger Notification for Urgent Token Call
    try {
      const clinic = await getOrCreateClinic();
      const patientObj: any = entry.patientId;
      const docObj: any = entry.doctorId;
      NotificationService.notifyQueueCalled({
        clinicId: clinic._id,
        patientId: patientObj?._id,
        doctorName: docObj?.fullName || 'Doctor',
        roomNumber: docObj?.roomNumber || '1',
        tokenNumber: entry.tokenNumber,
        phone: patientObj?.phone,
        io
      }).catch((err) => console.error('[Queue Called Notification Error]', err));
    } catch (notifErr) {
      console.error('[Queue Called Notification Failed]', notifErr);
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

// Start Consultation
export const startConsultation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId);
    if (!entry) return next(new AppError('Queue entry not found', 404));

    entry.status = 'IN_CONSULTATION';
    await entry.save();

    await Visit.findByIdAndUpdate(entry.visitId, {
      status: 'IN_CONSULTATION',
      consultationStartTime: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { doctorId: entry.doctorId, tokenNumber: entry.tokenNumber, status: 'IN_CONSULTATION' });
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

// Complete Consultation
export const completeConsultation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId);
    if (!entry) return next(new AppError('Queue entry not found', 404));

    entry.status = 'COMPLETED';
    await entry.save();

    const visit = await Visit.findByIdAndUpdate(
      entry.visitId,
      {
        status: 'COMPLETED',
        consultationEndTime: new Date()
      },
      { new: true }
    );

    if (visit?.appointmentId) {
      await Appointment.findByIdAndUpdate(visit.appointmentId, { status: 'COMPLETED' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { doctorId: entry.doctorId, tokenNumber: entry.tokenNumber, status: 'COMPLETED' });
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

// Skip Token (Patient didn't show after calls)
export const skipToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId);
    if (!entry) return next(new AppError('Queue entry not found', 404));

    entry.status = 'SKIPPED';
    await entry.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { doctorId: entry.doctorId });
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

// Recall Token back to Waiting
export const recallToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId);
    if (!entry) return next(new AppError('Queue entry not found', 404));

    entry.status = 'WAITING';
    await entry.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { doctorId: entry.doctorId });
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

// Elevate Patient to Emergency Priority (Head of Queue)
export const markEmergency = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId)
      .populate('patientId', 'fullName uhid')
      .populate('doctorId', 'roomNumber fullName');

    if (!entry) return next(new AppError('Queue entry not found', 404));

    entry.isEmergency = true;
    entry.priorityOrder = 1;
    await entry.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:emergency', {
        doctorId: entry.doctorId,
        tokenNumber: entry.tokenNumber,
        roomNo: (entry.doctorId as any)?.roomNumber
      });
      io.emit('queue:updated', { doctorId: entry.doctorId });
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

