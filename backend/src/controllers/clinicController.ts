import { Request, Response, NextFunction } from 'express';
import { ClinicSetting } from '../models/ClinicSetting.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';

export const getClinicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    return sendSuccess(res, clinic);
  } catch (error) {
    next(error);
  }
};

export const updateClinicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();

    const allowedUpdates = [
      'clinicName',
      'clinicPrefix',
      'tagline',
      'logoUrl',
      'registrationNumber',
      'gstin',
      'contact',
      'operatingHours',
      'departments',
      'appointmentRules',
      'billingRules'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (clinic as any)[field] = req.body[field];
      }
    });

    await clinic.save();
    return sendSuccess(res, clinic);
  } catch (error) {
    next(error);
  }
};

export const getHolidays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();
    return sendSuccess(res, clinic.holidays || []);
  } catch (error) {
    next(error);
  }
};

export const addHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, reason, isRecurringYearly } = req.body;
    if (!date || !reason) {
      return next(new AppError('Date and reason are required to declare a clinic holiday.', 400));
    }

    const clinic = await getOrCreateClinic();
    clinic.holidays.push({
      date: new Date(date),
      reason,
      isRecurringYearly: !!isRecurringYearly
    });

    await clinic.save();
    return sendSuccess(res, clinic.holidays, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const clinic = await getOrCreateClinic();

    clinic.holidays = clinic.holidays.filter((h: any) => h._id.toString() !== id);
    await clinic.save();

    return sendSuccess(res, { message: 'Clinic holiday removed', holidays: clinic.holidays });
  } catch (error) {
    next(error);
  }
};

