import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { DoctorSchedule } from '../models/DoctorSchedule.js';
import { DoctorLeave } from '../models/DoctorLeave.js';
import { Patient } from '../models/Patient.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Query Appointments
export const getAppointments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { date, doctorId, patientId, status } = req.query;
    const clinic = await getOrCreateClinic();
    const filter: any = { clinicId: clinic._id };

    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    // Patient role can only see their own appointments
    if (req.user?.role === 'PATIENT' && req.user.patientProfileId) {
      filter.patientId = req.user.patientProfileId;
    } else if (patientId) {
      filter.patientId = patientId;
    }

    if (date) {
      const parsedDate = new Date(String(date));
      const start = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      const end = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department consultationFee')
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .lean();

    return sendSuccess(res, appointments);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      return next(new AppError('Appointment record not found', 404));
    }
    return sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
};

const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentDate: z.string().min(1),
  timeSlot: z.string().min(1),
  bookingChannel: z.enum(['ONLINE_PATIENT', 'RECEPTIONIST_WALKIN', 'RECEPTIONIST_PHONE', 'DOCTOR_FOLLOWUP']).default('RECEPTIONIST_WALKIN'),
  notes: z.string().optional()
});

export const createAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = CreateAppointmentSchema.parse(req.body);
    const clinic = await getOrCreateClinic();

    const apptDate = new Date(validated.appointmentDate);
    const normalizedDate = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());

    // Check double-booking
    const existing = await Appointment.findOne({
      doctorId: validated.doctorId,
      appointmentDate: normalizedDate,
      timeSlot: validated.timeSlot,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    });

    if (existing) {
      return next(
        new AppError(
          `Slot ${validated.timeSlot} is already booked for this doctor on ${normalizedDate.toISOString().slice(0, 10)}. Please choose an alternate slot.`,
          409
        )
      );
    }

    // Determine token number for today
    let tokenNumber: number | undefined;
    if (validated.bookingChannel === 'RECEPTIONIST_WALKIN') {
      const highestToken = await Appointment.findOne({
        doctorId: validated.doctorId,
        appointmentDate: normalizedDate,
        tokenNumber: { $exists: true }
      })
        .sort({ tokenNumber: -1 })
        .select('tokenNumber')
        .lean();

      tokenNumber = (highestToken?.tokenNumber || 0) + 1;
    }

    const appointment = await Appointment.create({
      clinicId: clinic._id,
      patientId: validated.patientId,
      doctorId: validated.doctorId,
      appointmentDate: normalizedDate,
      timeSlot: validated.timeSlot,
      bookingChannel: validated.bookingChannel,
      notes: validated.notes,
      tokenNumber,
      status: validated.bookingChannel === 'RECEPTIONIST_WALKIN' ? 'CHECKED_IN' : 'CONFIRMED'
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department consultationFee');

    return sendSuccess(res, populated, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    // If checking in and has no token, assign sequential daily token
    if (status === 'CHECKED_IN' && !appointment.tokenNumber) {
      const highestToken = await Appointment.findOne({
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        tokenNumber: { $exists: true }
      })
        .sort({ tokenNumber: -1 })
        .select('tokenNumber')
        .lean();

      appointment.tokenNumber = (highestToken?.tokenNumber || 0) + 1;
    }

    if (status) appointment.status = status;
    if (cancellationReason) appointment.cancellationReason = cancellationReason;

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department consultationFee');

    return sendSuccess(res, populated);
  } catch (error) {
    next(error);
  }
};

// Calculate Available Slots for a Doctor on a Date
export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return next(new AppError('Query parameter "date" (YYYY-MM-DD) is required', 400));
    }

    const targetDate = new Date(String(date));
    const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon ...
    const normalizedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    // 1. Check doctor leave
    const leave = await DoctorLeave.findOne({
      doctorId,
      status: 'APPROVED',
      startDate: { $lte: normalizedDate },
      endDate: { $gte: normalizedDate }
    });

    if (leave && leave.allDay) {
      return sendSuccess(res, {
        doctorId,
        date: String(date),
        isDoctorOnLeave: true,
        leaveReason: leave.reason,
        slots: []
      });
    }

    // 2. Fetch doctor weekly schedule
    const schedule = await DoctorSchedule.findOne({ doctorId, dayOfWeek, isActive: true });
    if (!schedule || !schedule.shifts || schedule.shifts.length === 0) {
      return sendSuccess(res, {
        doctorId,
        date: String(date),
        isWorkingDay: false,
        slots: []
      });
    }

    // 3. Fetch booked appointments
    const booked = await Appointment.find({
      doctorId,
      appointmentDate: normalizedDate,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    }).select('timeSlot');

    const bookedSlotsSet = new Set(booked.map((b) => b.timeSlot));

    // 4. Generate all discrete slots across shifts
    const allSlots: Array<{ time: string; isAvailable: boolean }> = [];

    for (const shift of schedule.shifts) {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      const duration = shift.slotDurationMinutes || 15;

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + duration <= endMinutes) {
        const slotH = Math.floor(currentMinutes / 60)
          .toString()
          .padStart(2, '0');
        const slotM = (currentMinutes % 60).toString().padStart(2, '0');
        const timeString = `${slotH}:${slotM}`;

        allSlots.push({
          time: timeString,
          isAvailable: !bookedSlotsSet.has(timeString)
        });

        currentMinutes += duration;
      }
    }

    return sendSuccess(res, {
      doctorId,
      date: String(date),
      isWorkingDay: true,
      totalSlots: allSlots.length,
      availableSlotsCount: allSlots.filter((s) => s.isAvailable).length,
      slots: allSlots
    });
  } catch (error) {
    next(error);
  }
};

// Smart Specialist Auto-Allocation Engine
export const autoAllocateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, date } = req.query;
    if (!department) {
      return next(new AppError('Department is required for auto-allocation', 400));
    }

    const targetDate = date ? new Date(String(date)) : new Date();
    const normalizedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const doctors = await Doctor.find({
      department: String(department),
      status: 'ACTIVE',
      isAutoAllocatable: true
    }).lean();

    if (doctors.length === 0) {
      return next(new AppError(`No active auto-allocatable doctors found in ${department}`, 404));
    }

    // Score each doctor using Workload Index W_i
    const evaluated = await Promise.all(
      doctors.map(async (doc) => {
        const [confirmedCount, waitingCount] = await Promise.all([
          Appointment.countDocuments({
            doctorId: doc._id,
            appointmentDate: normalizedDate,
            status: 'CONFIRMED'
          }),
          Appointment.countDocuments({
            doctorId: doc._id,
            appointmentDate: normalizedDate,
            status: 'CHECKED_IN'
          })
        ]);

        const capacity = doc.maxDailyPatients || 25;
        // W_i = (1.0 * confirmed + 1.25 * waiting) / capacity
        const workloadIndex = Number(((1.0 * confirmedCount + 1.25 * waitingCount) / capacity).toFixed(2));

        return {
          ...doc,
          confirmedCount,
          waitingCount,
          workloadIndex,
          isRecommended: false
        };
      })
    );

    // Sort by workloadIndex ascending (lowest load first)
    evaluated.sort((a, b) => a.workloadIndex - b.workloadIndex);
    if (evaluated.length > 0) {
      evaluated[0].isRecommended = true;
    }

    return sendSuccess(res, {
      department,
      date: normalizedDate.toISOString().slice(0, 10),
      recommendedDoctor: evaluated[0],
      eligibleDoctors: evaluated
    });
  } catch (error) {
    next(error);
  }
};

