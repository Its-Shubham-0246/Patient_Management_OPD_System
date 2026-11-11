import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Patient, generateNextUHID } from '../models/Patient.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Query & List
export const getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, bloodGroup, gender, page = '1', limit = '50' } = req.query;
    const clinic = await getOrCreateClinic();
    const filter: any = { clinicId: clinic._id };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (gender) filter.gender = gender;

    if (q) {
      const searchRegex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { uhid: searchRegex },
        { phone: searchRegex },
        { fullName: searchRegex }
      ];
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Patient.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      patients,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

// Quick Debounced Search (Alt+C)
export const searchPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return sendSuccess(res, []);
    }

    const clinic = await getOrCreateClinic();
    const regex = new RegExp(query, 'i');

    const results = await Patient.find({
      clinicId: clinic._id,
      $or: [
        { uhid: regex },
        { phone: regex },
        { fullName: regex }
      ]
    })
      .select('uhid fullName phone gender age bloodGroup allergies chronicConditions')
      .limit(20)
      .lean();

    return sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
};

// Fetch Single Patient
export const getPatientById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let patient;

    if (id.startsWith('OPD-')) {
      patient = await Patient.findOne({ uhid: id });
    } else {
      patient = await Patient.findById(id);
    }

    if (!patient) {
      return next(new AppError('Patient record not found', 404));
    }

    // Role Guard: Patient can only view their own profile
    if (
      req.user?.role === 'PATIENT' &&
      req.user.patientProfileId?.toString() !== patient._id.toString()
    ) {
      return next(new AppError('Access denied: You can only view your own medical record.', 403));
    }

    return sendSuccess(res, patient);
  } catch (error) {
    next(error);
  }
};

// Validation Schema for Registration
const CreatePatientSchema = z.object({
  fullName: z.string().min(2).trim(),
  phone: z.string().min(10).max(15).trim(),
  email: z.string().email().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  age: z.coerce.number().min(0).max(130).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional()
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phone: z.string().optional()
    })
    .optional()
});

export const createPatient = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = CreatePatientSchema.parse(req.body);
    const clinic = await getOrCreateClinic();

    // Check if a patient with exact phone already exists (reception warning or duplicate notice)
    const existing = await Patient.findOne({
      clinicId: clinic._id,
      phone: validated.phone,
      fullName: new RegExp(`^${validated.fullName.trim()}$`, 'i')
    });

    if (existing) {
      return next(
        new AppError(
          `A patient record with name "${existing.fullName}" and phone ${existing.phone} is already registered under UHID ${existing.uhid}.`,
          409
        )
      );
    }

    // Generate UHID
    const uhid = await generateNextUHID(clinic.clinicPrefix);

    const patient = await Patient.create({
      clinicId: clinic._id,
      uhid,
      fullName: validated.fullName,
      phone: validated.phone,
      email: validated.email || undefined,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      age: validated.age,
      gender: validated.gender,
      bloodGroup: validated.bloodGroup,
      allergies: validated.allergies,
      chronicConditions: validated.chronicConditions,
      address: validated.address,
      emergencyContact: validated.emergencyContact,
      consentGiven: true,
      consentDate: new Date()
    });

    return sendSuccess(res, patient, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);

    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // Role check for patient self-edit
    if (
      req.user?.role === 'PATIENT' &&
      req.user.patientProfileId?.toString() !== patient._id.toString()
    ) {
      return next(new AppError('Access denied: You can only edit your own details.', 403));
    }

    const allowed = [
      'fullName',
      'email',
      'dateOfBirth',
      'age',
      'gender',
      'bloodGroup',
      'allergies',
      'chronicConditions',
      'address',
      'emergencyContact'
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        (patient as any)[field] = req.body[field];
      }
    });

    await patient.save();
    return sendSuccess(res, patient);
  } catch (error) {
    next(error);
  }
};

// Add Medical Document
export const addPatientDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, docType, fileUrl, notes } = req.body;

    if (!title || !fileUrl) {
      return next(new AppError('Document title and file URL are required', 400));
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    patient.documents.push({
      title,
      docType: docType || 'LAB_REPORT',
      fileUrl,
      uploadedAt: new Date(),
      notes
    });

    await patient.save();
    return sendSuccess(res, patient.documents, 201);
  } catch (error) {
    next(error);
  }
};

// Add Chronic Condition / History Entry
export const addChronicCondition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { condition, diagnosedYear, medications, notes } = req.body;

    if (!condition) {
      return next(new AppError('Medical condition name is required', 400));
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    patient.medicalHistory.push({
      condition,
      diagnosedYear: diagnosedYear ? Number(diagnosedYear) : undefined,
      medications,
      notes
    });

    if (!patient.chronicConditions.includes(condition)) {
      patient.chronicConditions.push(condition);
    }

    await patient.save();
    return sendSuccess(res, patient.medicalHistory, 201);
  } catch (error) {
    next(error);
  }
};

// Aggregate Longitudinal Medical History
export const getPatientMedicalHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      return next(new AppError('Patient record not found', 404));
    }

    return sendSuccess(res, {
      uhid: patient.uhid,
      fullName: patient.fullName,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      medicalHistory: patient.medicalHistory,
      documents: patient.documents
    });
  } catch (error) {
    next(error);
  }
};

