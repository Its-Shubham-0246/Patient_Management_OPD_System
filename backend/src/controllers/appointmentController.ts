import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { DoctorSchedule } from '../models/DoctorSchedule.js';
import { DoctorLeave } from '../models/DoctorLeave.js';
import { Patient } from '../models/Patient.js';
import { ClinicSetting } from '../models/ClinicSetting.js';
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

// Calendar Range Query
export const getCalendarAppointments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, doctorId } = req.query;
    const clinic = await getOrCreateClinic();

    if (!startDate || !endDate) {
      return next(new AppError('startDate and endDate query parameters are required', 400));
    }

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));
    end.setHours(23, 59, 59, 999);

    const filter: any = {
      clinicId: clinic._id,
      appointmentDate: { $gte: start, $lte: end }
    };

    if (doctorId) filter.doctorId = doctorId;

    if (req.user?.role === 'PATIENT' && req.user.patientProfileId) {
      filter.patientId = req.user.patientProfileId;
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

// Reschedule Appointment
export const rescheduleAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newDate, newTimeSlot, reason } = req.body;

    if (!newDate || !newTimeSlot) {
      return next(new AppError('newDate and newTimeSlot are required for rescheduling', 400));
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return next(new AppError(`Cannot reschedule an appointment that is already ${appointment.status}`, 400));
    }

    const targetDate = new Date(newDate);
    const normalizedTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    // Check if new slot is available
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      appointmentDate: normalizedTarget,
      timeSlot: newTimeSlot,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    });

    if (conflict) {
      return next(new AppError(`Slot ${newTimeSlot} on ${newDate} is already reserved by another patient.`, 409));
    }

    appointment.appointmentDate = normalizedTarget;
    appointment.timeSlot = newTimeSlot;
    appointment.status = 'CONFIRMED';
    appointment.notes = reason ? `${appointment.notes || ''} [Rescheduled: ${reason}]`.trim() : appointment.notes;

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department consultationFee');

    return sendSuccess(res, populated);
  } catch (error) {
    next(error);
  }
};

// Cancel Appointment
export const cancelAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    if (appointment.status === 'COMPLETED') {
      return next(new AppError('Cannot cancel a completed consultation encounter', 400));
    }

    appointment.status = 'CANCELLED';
    appointment.cancellationReason = cancellationReason || 'Cancelled by user or clinic';

    await appointment.save();

    return sendSuccess(res, {
      message: 'Appointment successfully cancelled and slot released',
      appointmentId: appointment._id,
      status: appointment.status
    });
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

    const clinic = await getOrCreateClinic();
    const targetDate = new Date(String(date));
    const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon ...
    const normalizedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    // 1. Check clinic holiday
    const isHoliday = clinic.holidays?.find((h: any) => {
      const hDate = new Date(h.date);
      return (
        hDate.getFullYear() === normalizedDate.getFullYear() &&
        hDate.getMonth() === normalizedDate.getMonth() &&
        hDate.getDate() === normalizedDate.getDate()
      );
    });

    if (isHoliday) {
      return sendSuccess(res, {
        doctorId,
        date: String(date),
        isClinicHoliday: true,
        holidayReason: isHoliday.reason,
        isWorkingDay: false,
        totalSlots: 0,
        availableSlotsCount: 0,
        slots: []
      });
    }

    // 2. Check doctor leave
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
        isWorkingDay: false,
        totalSlots: 0,
        availableSlotsCount: 0,
        slots: []
      });
    }

    // 3. Fetch doctor weekly schedule
    const schedule = await DoctorSchedule.findOne({ doctorId, dayOfWeek, isActive: true });
    if (!schedule || !schedule.shifts || schedule.shifts.length === 0) {
      return sendSuccess(res, {
        doctorId,
        date: String(date),
        isWorkingDay: false,
        totalSlots: 0,
        availableSlotsCount: 0,
        slots: []
      });
    }

    // 4. Fetch booked appointments
    const booked = await Appointment.find({
      doctorId,
      appointmentDate: normalizedDate,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    }).select('timeSlot');

    const bookedSlotsSet = new Set(booked.map((b) => b.timeSlot));

    // 5. Generate all discrete slots across shifts
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

// Auto Allocate and Book in 1-Click
export const bookAutoAllocatedAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, department, appointmentDate, preferredTimeSlot, bookingChannel, notes } = req.body;
    if (!patientId || !department || !appointmentDate) {
      return next(new AppError('patientId, department, and appointmentDate are required', 400));
    }

    const clinic = await getOrCreateClinic();
    const apptDate = new Date(appointmentDate);
    const normalizedDate = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());

    // 1. Run auto-allocation
    const doctors = await Doctor.find({
      department,
      status: 'ACTIVE',
      isAutoAllocatable: true
    }).lean();

    if (doctors.length === 0) {
      return next(new AppError(`No active doctors available in ${department}`, 404));
    }

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
        const workloadIndex = Number(((1.0 * confirmedCount + 1.25 * waitingCount) / capacity).toFixed(2));
        return { doc, workloadIndex };
      })
    );

    evaluated.sort((a, b) => a.workloadIndex - b.workloadIndex);
    const chosenDoctor = evaluated[0].doc;
    const workloadScore = evaluated[0].workloadIndex;

    // 2. Select slot: if preferredTimeSlot given and free, use it; otherwise find first available slot
    let slotToBook = preferredTimeSlot;
    if (slotToBook) {
      const conflict = await Appointment.findOne({
        doctorId: chosenDoctor._id,
        appointmentDate: normalizedDate,
        timeSlot: slotToBook,
        status: { $nin: ['CANCELLED', 'NO_SHOW'] }
      });
      if (conflict) {
        slotToBook = undefined;
      }
    }

    if (!slotToBook) {
      // Find first free slot
      const dayOfWeek = normalizedDate.getDay();
      const sched = await DoctorSchedule.findOne({ doctorId: chosenDoctor._id, dayOfWeek, isActive: true });
      if (sched && sched.shifts.length > 0) {
        const shift = sched.shifts[0];
        const booked = await Appointment.find({
          doctorId: chosenDoctor._id,
          appointmentDate: normalizedDate,
          status: { $nin: ['CANCELLED', 'NO_SHOW'] }
        }).select('timeSlot');
        const bookedSet = new Set(booked.map((b) => b.timeSlot));

        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        let curr = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;
        const dur = shift.slotDurationMinutes || 15;

        while (curr + dur <= end) {
          const t = `${Math.floor(curr / 60).toString().padStart(2, '0')}:${(curr % 60).toString().padStart(2, '0')}`;
          if (!bookedSet.has(t)) {
            slotToBook = t;
            break;
          }
          curr += dur;
        }
      }
    }

    if (!slotToBook) {
      slotToBook = '09:00'; // fallback
    }

    // 3. Create appointment with allocationDetails
    let tokenNumber: number | undefined;
    if (bookingChannel === 'RECEPTIONIST_WALKIN') {
      const highestToken = await Appointment.findOne({
        doctorId: chosenDoctor._id,
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
      patientId,
      doctorId: chosenDoctor._id,
      appointmentDate: normalizedDate,
      timeSlot: slotToBook,
      bookingChannel: bookingChannel || 'RECEPTIONIST_WALKIN',
      notes,
      tokenNumber,
      status: bookingChannel === 'RECEPTIONIST_WALKIN' ? 'CHECKED_IN' : 'CONFIRMED',
      allocationDetails: {
        method: 'AUTOMATIC',
        workloadIndexAtAllocation: workloadScore,
        recommendedDoctorId: chosenDoctor._id
      }
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
      .populate('doctorId', 'fullName specialization roomNumber department consultationFee');

    return sendSuccess(res, populated, 201);
  } catch (error) {
    next(error);
  }
};
