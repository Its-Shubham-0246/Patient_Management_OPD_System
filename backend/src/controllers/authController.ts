import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Patient, generateNextUHID } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { DoctorSchedule } from '../models/DoctorSchedule.js';
import { ClinicSetting } from '../models/ClinicSetting.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  verifyRefreshToken
} from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Helper to get or create default clinic
export const getOrCreateClinic = async () => {
  let clinic = await ClinicSetting.findOne();
  if (!clinic) {
    clinic = await ClinicSetting.create({
      clinicName: 'City Health Care Clinic',
      clinicPrefix: 'OPD',
      tagline: 'Comprehensive Outpatient Healthcare'
    });
  }
  return clinic;
};

// Zod Validation Schemas
const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  phone: z.string().min(10, 'Valid 10-digit mobile number required').max(15).trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  age: z.coerce.number().min(0).max(125).optional(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'DPDP Act digital consent is mandatory for outpatient registration'
  })
});

const LoginSchema = z.object({
  loginIdentifier: z.string().min(3, 'Phone or email is required').trim(),
  password: z.string().min(6, 'Password is required')
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const clinic = await getOrCreateClinic();

    // Check for duplicate phone
    const existingUser = await User.findOne({ clinicId: clinic._id, phone: validated.phone });
    if (existingUser) {
      return next(new AppError('A patient account with this phone number already exists.', 409));
    }

    // Hash password with bcrypt cost factor 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // Generate Sequential UHID
    const uhid = await generateNextUHID(clinic.clinicPrefix);

    // Create Patient Profile
    const patient = await Patient.create({
      clinicId: clinic._id,
      uhid,
      fullName: validated.fullName,
      phone: validated.phone,
      email: validated.email || undefined,
      gender: validated.gender,
      age: validated.age,
      allergies: [],
      chronicConditions: [],
      consentGiven: validated.consentGiven,
      consentDate: new Date()
    });

    // Create User Account
    const user = await User.create({
      clinicId: clinic._id,
      fullName: validated.fullName,
      phone: validated.phone,
      email: validated.email || undefined,
      passwordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patientProfileId: patient._id
    });

    // Link user to patient
    patient.userId = user._id as any;
    await patient.save();

    // Generate Dual Tokens
    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      clinicId: clinic._id.toString(),
      fullName: user.fullName
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
          uhid: patient.uhid
        },
        patient: {
          id: patient._id,
          uhid: patient.uhid,
          fullName: patient.fullName,
          gender: patient.gender,
          age: patient.age
        },
        accessToken,
        expiresIn: 900
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { loginIdentifier, password } = LoginSchema.parse(req.body);
    const clinic = await getOrCreateClinic();

    // Query by phone or email
    const user = await User.findOne({
      clinicId: clinic._id,
      $or: [{ phone: loginIdentifier }, { email: loginIdentifier.toLowerCase() }]
    });

    if (!user) {
      return next(new AppError('Invalid mobile number/email or password.', 401));
    }

    // Check account lockout
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil(((user.lockUntil?.getTime() || 0) - Date.now()) / 60000);
      return next(
        new AppError(
          `Account locked due to 5 consecutive failed logins. Try again in ${remainingMinutes} minute(s).`,
          423
        )
      );
    }

    if (user.status === 'INACTIVE') {
      return next(new AppError('Your account has been deactivated. Please contact clinic administration.', 403));
    }

    // Compare Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedLogins();
      const remainingAttempts = 5 - user.failedLoginAttempts;
      return next(
        new AppError(
          remainingAttempts > 0
            ? `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`
            : 'Invalid credentials. Account locked for 30 minutes.',
          401
        )
      );
    }

    // Reset failed logins on success
    await user.resetFailedLogins();

    // Generate Dual Tokens
    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      clinicId: clinic._id.toString(),
      fullName: user.fullName
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setRefreshTokenCookie(res, refreshToken);

    let uhid: string | undefined;
    if (user.patientProfileId) {
      const pt = await Patient.findById(user.patientProfileId).select('uhid');
      if (pt) uhid = pt.uhid;
    }

    return sendSuccess(res, {
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        doctorProfileId: user.doctorProfileId,
        patientProfileId: user.patientProfileId,
        uhid
      },
      accessToken,
      expiresIn: 900
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return next(new AppError('No refresh session found. Please log in.', 401));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      clearRefreshTokenCookie(res);
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      clearRefreshTokenCookie(res);
      return next(new AppError('User session is no longer active.', 401));
    }

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      clinicId: user.clinicId.toString(),
      fullName: user.fullName
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    setRefreshTokenCookie(res, newRefreshToken);

    return sendSuccess(res, {
      accessToken: newAccessToken,
      expiresIn: 900,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        clinicId: user.clinicId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  clearRefreshTokenCookie(res);
  return sendSuccess(res, { message: 'Session logged out successfully' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  let uhid: string | undefined;
  if (req.user.patientProfileId) {
    const pt = await Patient.findById(req.user.patientProfileId).select('uhid');
    if (pt) uhid = pt.uhid;
  }

  return sendSuccess(res, {
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role,
      clinicId: req.user.clinicId,
      doctorProfileId: req.user.doctorProfileId,
      patientProfileId: req.user.patientProfileId,
      lastLoginAt: req.user.lastLoginAt,
      uhid
    }
  });
};

// Seed default accounts for initial testing
export const seedDefaultUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    const salt = await bcrypt.genSalt(12);

    const defaultAccounts = [
      {
        fullName: 'Dr. Owner (Clinic Admin)',
        phone: '9876543210',
        email: 'admin@cityhealthcare.in',
        password: 'Admin@123',
        role: 'ADMIN' as const
      },
      {
        fullName: 'Dr. Rajesh Sharma',
        phone: '9876543211',
        email: 'dr.sharma@cityhealthcare.in',
        password: 'Doctor@123',
        role: 'DOCTOR' as const
      },
      {
        fullName: 'Sunita Verma (Front-Desk)',
        phone: '9876543212',
        email: 'reception@cityhealthcare.in',
        password: 'Reception@123',
        role: 'RECEPTIONIST' as const
      },
      {
        fullName: 'Rahul Mehta (Patient)',
        phone: '9876543213',
        email: 'rahul.mehta@example.com',
        password: 'Patient@123',
        role: 'PATIENT' as const
      }
    ];

    const results = [];

    for (const acc of defaultAccounts) {
      let user = await User.findOne({ clinicId: clinic._id, phone: acc.phone });
      if (!user) {
        const passwordHash = await bcrypt.hash(acc.password, salt);
        user = await User.create({
          clinicId: clinic._id,
          fullName: acc.fullName,
          phone: acc.phone,
          email: acc.email,
          passwordHash,
          role: acc.role,
          status: 'ACTIVE'
        });

        // If patient, create linked patient record
        if (acc.role === 'PATIENT') {
          const uhid = await generateNextUHID(clinic.clinicPrefix);
          const patient = await Patient.create({
            clinicId: clinic._id,
            userId: user._id,
            uhid,
            fullName: acc.fullName,
            phone: acc.phone,
            email: acc.email,
            gender: 'MALE',
            age: 34,
            allergies: ['PENICILLIN'],
            chronicConditions: ['Hypertension'],
            consentGiven: true,
            consentDate: new Date()
          });
          user.patientProfileId = patient._id as any;
          await user.save();
        }
      }

      // Ensure DOCTOR profile and schedules exist
      if (acc.role === 'DOCTOR') {
        let doctor = await Doctor.findOne({ clinicId: clinic._id, userId: user._id });
        if (!doctor) {
          doctor = await Doctor.create({
            clinicId: clinic._id,
            userId: user._id,
            fullName: acc.fullName,
            phone: acc.phone,
            email: acc.email,
            medicalCouncilRegNo: 'MCI-2014-48291',
            department: 'General Medicine',
            specialization: 'Internal Medicine',
            qualifications: ['MBBS', 'MD (Internal Medicine)'],
            roomNumber: 'Room 101',
            consultationFee: 500,
            averageConsultationMinutes: 15,
            maxDailyPatients: 30,
            isAutoAllocatable: true,
            status: 'ACTIVE'
          });
          user.doctorProfileId = doctor._id as any;
          await user.save();

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
        }
      }
      results.push({
        role: acc.role,
        fullName: acc.fullName,
        phone: acc.phone,
        email: acc.email,
        password: acc.password
      });
    }

    return sendSuccess(res, {
      message: 'Default user accounts seeded successfully',
      clinic: {
        id: clinic._id,
        name: clinic.clinicName
      },
      accounts: results
    });
  } catch (error) {
    next(error);
  }
};

