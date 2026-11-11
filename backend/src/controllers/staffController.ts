import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';

export const getAllStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await User.find({ role: { $in: ['RECEPTIONIST', 'ADMIN'] } })
      .select('-passwordHash')
      .sort({ role: 1, fullName: 1 });
    return sendSuccess(res, staff);
  } catch (error) {
    next(error);
  }
};

const CreateStaffSchema = z.object({
  fullName: z.string().min(2).trim(),
  phone: z.string().min(10).max(15).trim(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  role: z.enum(['RECEPTIONIST', 'ADMIN']).default('RECEPTIONIST')
});

export const createStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateStaffSchema.parse(req.body);
    const clinic = await getOrCreateClinic();

    const existingUser = await User.findOne({ clinicId: clinic._id, phone: validated.phone });
    if (existingUser) {
      return next(new AppError('A user account with this phone number already exists.', 409));
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await User.create({
      clinicId: clinic._id,
      fullName: validated.fullName,
      phone: validated.phone,
      email: validated.email || undefined,
      passwordHash,
      role: validated.role,
      status: 'ACTIVE'
    });

    return sendSuccess(
      res,
      {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('Staff user not found', 404));
    }

    const { fullName, email, status } = req.body;
    if (fullName) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (status) user.status = status;

    await user.save();
    return sendSuccess(res, {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    next(error);
  }
};

