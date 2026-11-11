import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Doctor } from '../models/Doctor.js';
import { DoctorSchedule } from '../models/DoctorSchedule.js';
import { DoctorLeave } from '../models/DoctorLeave.js';
import { User } from '../models/User.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, status } = req.query;
    const filter: any = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    const doctors = await Doctor.find(filter).sort({ department: 1, fullName: 1 });
    return sendSuccess(res, doctors);
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return next(new AppError('Doctor record not found', 404));
    }
    return sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
};

const CreateDoctorSchema = z.object({
  fullName: z.string().min(2).trim(),
  phone: z.string().min(10).max(15).trim(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  medicalCouncilRegNo: z.string().min(3).trim(),
  department: z.string().min(2).trim(),
  specialization: z.string().min(2).trim(),
  qualifications: z.array(z.string()).default([]),
  roomNumber: z.string().min(1).trim(),
  consultationFee: z.coerce.number().min(0).default(500),
  averageConsultationMinutes: z.coerce.number().min(5).max(60).default(15),
  maxDailyPatients: z.coerce.number().min(1).max(100).default(25),
  isAutoAllocatable: z.boolean().default(true)
});

export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateDoctorSchema.parse(req.body);
    const clinic = await getOrCreateClinic();

    // Check duplicate phone
    const existingUser = await User.findOne({ clinicId: clinic._id, phone: validated.phone });
    if (existingUser) {
      return next(new AppError('A user account with this phone number already exists.', 409));
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // Create User account with role DOCTOR
    const user = await User.create({
      clinicId: clinic._id,
      fullName: validated.fullName,
      phone: validated.phone,
      email: validated.email || undefined,
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE'
    });

    // Create Doctor Profile
    const doctor = await Doctor.create({
      clinicId: clinic._id,
      userId: user._id,
      fullName: validated.fullName,
      phone: validated.phone,
      email: validated.email || undefined,
      medicalCouncilRegNo: validated.medicalCouncilRegNo,
      department: validated.department,
      specialization: validated.specialization,
      qualifications: validated.qualifications,
      roomNumber: validated.roomNumber,
      consultationFee: validated.consultationFee,
      averageConsultationMinutes: validated.averageConsultationMinutes,
      maxDailyPatients: validated.maxDailyPatients,
      isAutoAllocatable: validated.isAutoAllocatable,
      status: 'ACTIVE'
    });

    user.doctorProfileId = doctor._id as any;
    await user.save();

    // Create default Mon-Sat schedules (09:00 - 13:00 and 17:00 - 20:00)
    for (let day = 1; day <= 6; day++) {
      await DoctorSchedule.create({
        clinicId: clinic._id,
        doctorId: doctor._id,
        dayOfWeek: day,
        shifts: [
          { startTime: '09:00', endTime: '13:00', slotDurationMinutes: 15, maxPatientsPerShift: 16 },
          { startTime: '17:00', endTime: '20:00', slotDurationMinutes: 15, maxPatientsPerShift: 12 }
        ],
        isActive: true
      });
    }

    return sendSuccess(res, doctor, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return next(new AppError('Doctor not found', 404));
    }

    const allowed = [
      'fullName',
      'department',
      'specialization',
      'qualifications',
      'roomNumber',
      'consultationFee',
      'averageConsultationMinutes',
      'maxDailyPatients',
      'isAutoAllocatable',
      'status'
    ];

    allowed.forEach((f) => {
      if (req.body[f] !== undefined) {
        (doctor as any)[f] = req.body[f];
      }
    });

    await doctor.save();
    return sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
};

export const getDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await DoctorSchedule.find({ doctorId: req.params.id }).sort({ dayOfWeek: 1 });
    return sendSuccess(res, schedules);
  } catch (error) {
    next(error);
  }
};

export const updateDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id || req.params.doctorId;
    const { schedules } = req.body; // array of { dayOfWeek, shifts, isActive }

    if (!Array.isArray(schedules)) {
      return next(new AppError('schedules array is required', 400));
    }

    const clinic = await getOrCreateClinic();
    const updated = [];

    for (const item of schedules) {
      const schedule = await DoctorSchedule.findOneAndUpdate(
        { clinicId: clinic._id, doctorId, dayOfWeek: item.dayOfWeek },
        {
          shifts: item.shifts,
          isActive: item.isActive !== undefined ? item.isActive : true
        },
        { upsert: true, new: true }
      );
      updated.push(schedule);
    }

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const getDoctorLeaves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaves = await DoctorLeave.find({ doctorId: req.params.id }).sort({ startDate: -1 });
    return sendSuccess(res, leaves);
  } catch (error) {
    next(error);
  }
};

export const requestDoctorLeave = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, reason, allDay, shiftId } = req.body;
    if (!startDate || !endDate || !reason) {
      return next(new AppError('Start date, end date, and reason are required', 400));
    }

    const clinic = await getOrCreateClinic();
    const doctorId = req.params.id;

    const leave = await DoctorLeave.create({
      clinicId: clinic._id,
      doctorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allDay: allDay !== undefined ? allDay : true,
      shiftId,
      reason,
      status: 'APPROVED', // Auto-approved or approved by Admin/Clinician
      approvedBy: req.user?._id
    });

    return sendSuccess(res, leave, 201);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const leave = await DoctorLeave.findById(req.params.leaveId);
    if (!leave) {
      return next(new AppError('Leave record not found', 404));
    }

    leave.status = status;
    leave.approvedBy = req.user?._id;
    await leave.save();

    return sendSuccess(res, leave);
  } catch (error) {
    next(error);
  }
};

