import { Request, Response, NextFunction } from 'express';
import { Prescription, IPrescription } from '../models/Prescription.js';
import { Visit } from '../models/Visit.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

// Auto-generate unique Prescription Number: RX-YYMM-XXXXX
const generatePrescriptionNumber = async (clinicId: any): Promise<string> => {
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `RX-${yearShort}${month}-`;

  const count = await Prescription.countDocuments({
    clinicId,
    prescriptionNumber: { $regex: `^${prefix}` }
  });

  const nextSeq = String(count + 1).padStart(5, '0');
  return `${prefix}${nextSeq}`;
};

// Common Medication Formulary Catalog for OPD Autocomplete
export const COMMON_MEDICATIONS = [
  { name: 'Paracetamol', dosage: '650mg', form: 'Tablet', frequency: '1-0-1', duration: '3 days', instructions: 'After food for fever/body ache' },
  { name: 'Amoxicillin + Potassium Clavulanate (Augmentin)', dosage: '625mg', form: 'Tablet', frequency: '1-0-1', duration: '5 days', instructions: 'After food with full glass of water' },
  { name: 'Pantoprazole', dosage: '40mg', form: 'Tablet', frequency: '1-0-0', duration: '7 days', instructions: 'Empty stomach in morning' },
  { name: 'Cetirizine', dosage: '10mg', form: 'Tablet', frequency: '0-0-1', duration: '5 days', instructions: 'At bedtime' },
  { name: 'Azithromycin', dosage: '500mg', form: 'Tablet', frequency: '1-0-0', duration: '3 days', instructions: '1 hour before or 2 hours after food' },
  { name: 'Metformin', dosage: '500mg', form: 'Tablet', frequency: '1-0-1', duration: '30 days', instructions: 'With or immediately after meals' },
  { name: 'Telmisartan', dosage: '40mg', form: 'Tablet', frequency: '1-0-0', duration: '30 days', instructions: 'Morning after breakfast' },
  { name: 'Amlodipine', dosage: '5mg', form: 'Tablet', frequency: '1-0-0', duration: '30 days', instructions: 'Morning daily' },
  { name: 'Aceclofenac + Paracetamol (Zerodol-P)', dosage: '100mg/325mg', form: 'Tablet', frequency: '1-0-1', duration: '3 days', instructions: 'After food SOS for pain' },
  { name: 'Dextromethorphan + Chlorpheniramine Syrup', dosage: '10ml', form: 'Syrup', frequency: '1-1-1', duration: '5 days', instructions: 'After food' },
  { name: 'Oral Rehydration Salts (ORS)', dosage: '1 sachet', form: 'Other', frequency: 'SOS', duration: '3 days', instructions: 'Dissolve in 1 litre boiled and cooled water' },
  { name: 'Vitamin D3 Cholecalciferol', dosage: '60000 IU', form: 'Capsule', frequency: 'Once Weekly', duration: '8 weeks', instructions: 'With warm milk on Sunday mornings' },
  { name: 'Vitamin B-Complex + Zinc (Becosules)', dosage: '1 cap', form: 'Capsule', frequency: '1-0-0', duration: '15 days', instructions: 'After lunch' },
  { name: 'Levocetirizine + Montelukast (Montair-LC)', dosage: '5mg/10mg', form: 'Tablet', frequency: '0-0-1', duration: '10 days', instructions: 'At night before sleep' },
  { name: 'Omeprazole', dosage: '20mg', form: 'Capsule', frequency: '1-0-0', duration: '14 days', instructions: '30 mins before breakfast' }
];

// Common ICD-10 Diagnosis Catalog for Quick Select
export const COMMON_ICD10 = [
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'R50.9', description: 'Fever, unspecified' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'R51', description: 'Headache' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'L20.9', description: 'Atopic dermatitis, unspecified' }
];

// Get Common Formulary Catalog
export const getFormularyCatalog = async (req: Request, res: Response) => {
  return sendSuccess(res, {
    medications: COMMON_MEDICATIONS,
    icd10: COMMON_ICD10
  });
};

// Create or Save Prescription (Draft or Final)
export const savePrescription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const {
      vitals,
      chiefComplaints,
      clinicalObservations,
      diagnosis,
      icd10Codes,
      medicines,
      labTests,
      advice,
      dietaryRestrictions,
      followUpDays,
      followUpDate,
      isFinalized
    } = req.body;

    const clinic = await getOrCreateClinic();

    // Find visit
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return next(new AppError('Visit record not found', 404));
    }

    // Doctor profile
    let doctor: any;
    if (req.user?.doctorProfileId) {
      doctor = await Doctor.findById(req.user.doctorProfileId);
    } else {
      doctor = await Doctor.findById(visit.doctorId);
    }

    // Auto-calculate BMI if weight and height provided
    const calculatedVitals = { ...(vitals || {}) };
    if (calculatedVitals.weightKg && calculatedVitals.heightCm && calculatedVitals.heightCm > 0) {
      const heightM = calculatedVitals.heightCm / 100;
      calculatedVitals.bmi = +(calculatedVitals.weightKg / (heightM * heightM)).toFixed(1);
    }

    // Check if prescription already exists for this visit
    let prescription = await Prescription.findOne({ visitId: visit._id });

    if (prescription && prescription.isFinalized && !isFinalized) {
      return next(new AppError('Prescription is already finalized and cannot be converted back to draft', 400));
    }

    let calculatedFollowUpDate = followUpDate;
    if (!calculatedFollowUpDate && followUpDays && Number(followUpDays) > 0) {
      const target = new Date();
      target.setDate(target.getDate() + Number(followUpDays));
      calculatedFollowUpDate = target;
    }

    if (!prescription) {
      const prescriptionNumber = await generatePrescriptionNumber(clinic._id);
      prescription = new Prescription({
        prescriptionNumber,
        clinicId: clinic._id,
        visitId: visit._id,
        patientId: visit.patientId,
        doctorId: doctor ? doctor._id : visit.doctorId,
        prescriptionDate: new Date()
      });
    }

    // Update prescription fields
    prescription.vitals = calculatedVitals;
    prescription.chiefComplaints = chiefComplaints || [];
    prescription.clinicalObservations = clinicalObservations;
    prescription.diagnosis = diagnosis || [];
    prescription.icd10Codes = icd10Codes || [];
    prescription.medicines = medicines || [];
    prescription.labTests = labTests || [];
    prescription.advice = advice;
    prescription.dietaryRestrictions = dietaryRestrictions;
    prescription.followUpDays = followUpDays;
    prescription.followUpDate = calculatedFollowUpDate;

    if (doctor?.medicalRegistrationNumber) {
      prescription.doctorRegNumber = doctor.medicalRegistrationNumber;
    }

    if (isFinalized) {
      prescription.isFinalized = true;
      prescription.finalizedAt = new Date();
      prescription.digitalSignature = `Electronically signed by ${doctor?.fullName || 'Attending Physician'} (${doctor?.medicalRegistrationNumber || 'NMC-REG'}) on ${new Date().toLocaleString('en-IN')}`;
    }

    await prescription.save();

    // Update Visit state
    visit.vitals = calculatedVitals;
    visit.prescriptionId = prescription._id;
    if (chiefComplaints && chiefComplaints.length > 0) {
      visit.chiefComplaint = chiefComplaints.join(', ');
    }
    if (diagnosis && diagnosis.length > 0) {
      visit.diagnosis = diagnosis;
    }
    if (icd10Codes && icd10Codes.length > 0) {
      visit.icdCodes = icd10Codes.map((c: any) => c.code);
    }
    if (advice) {
      visit.treatmentPlan = advice;
    }
    if (followUpDays || calculatedFollowUpDate) {
      visit.followUpRequired = true;
    }

    if (isFinalized) {
      visit.status = 'COMPLETED';
      visit.consultationEndTime = new Date();

      // Also complete Queue Entry
      await QueueEntry.findOneAndUpdate(
        { visitId: visit._id },
        { status: 'COMPLETED' }
      );

      // Also complete Appointment if present
      if (visit.appointmentId) {
        await Appointment.findByIdAndUpdate(visit.appointmentId, { status: 'COMPLETED' });
      }

      // Socket.IO event to update live boards
      const io = req.app.get('io');
      if (io) {
        io.emit('queue:updated', { doctorId: visit.doctorId, status: 'COMPLETED' });
        io.emit('consultation:completed', {
          visitId: visit._id,
          prescriptionId: prescription._id,
          patientId: visit.patientId
        });
      }
    }

    await visit.save();

    const populated = await Prescription.findById(prescription._id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies chronicConditions')
      .populate('doctorId', 'fullName specialization medicalRegistrationNumber department qualification roomNumber')
      .populate('clinicId', 'clinicName address phone email logo')
      .populate('visitId');

    // Trigger Notification if finalized
    if (isFinalized && populated) {
      try {
        const patientObj: any = populated.patientId;
        const doctorObj: any = populated.doctorId;
        const clinicObj: any = populated.clinicId;
        const io = req.app.get('io');
        NotificationService.notifyPrescriptionReady({
          clinicId: clinicObj?._id || clinic._id,
          patientId: patientObj?._id,
          patientName: patientObj?.fullName || 'Patient',
          doctorName: doctorObj?.fullName || 'Doctor',
          clinicName: clinicObj?.clinicName || 'City Health Care Clinic',
          visitRef: (visit._id as any).toString().slice(-6).toUpperCase(),
          prescriptionId: prescription._id,
          phone: patientObj?.phone,
          email: patientObj?.email,
          io
        }).catch((err) => console.error('[Prescription Notification Error]', err));
      } catch (notifErr) {
        console.error('[Prescription Notification Failed]', notifErr);
      }
    }

    return sendSuccess(res, populated, isFinalized ? 200 : 201);
  } catch (error) {
    next(error);
  }
};

// Get Prescription by ID
export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id)
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies chronicConditions address')
      .populate('doctorId', 'fullName specialization medicalRegistrationNumber department qualification roomNumber')
      .populate('clinicId', 'clinicName address phone email logo')
      .populate('visitId');

    if (!prescription) {
      return next(new AppError('Prescription not found', 404));
    }

    return sendSuccess(res, prescription);
  } catch (error) {
    next(error);
  }
};

// Get Prescription by Visit ID
export const getPrescriptionByVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;
    const prescription = await Prescription.findOne({ visitId })
      .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies chronicConditions address')
      .populate('doctorId', 'fullName specialization medicalRegistrationNumber department qualification roomNumber')
      .populate('clinicId', 'clinicName address phone email logo')
      .populate('visitId');

    return sendSuccess(res, prescription);
  } catch (error) {
    next(error);
  }
};

// Get Patient Prescription History (Longitudinal EMR)
export const getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const prescriptions = await Prescription.find({ patientId, isFinalized: true })
      .populate('doctorId', 'fullName specialization medicalRegistrationNumber department')
      .populate('clinicId', 'clinicName')
      .sort({ prescriptionDate: -1 })
      .lean();

    return sendSuccess(res, prescriptions);
  } catch (error) {
    next(error);
  }
};

// Get Today's Completed Consultations for Doctor
export const getDoctorTodayPrescriptions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.doctorProfileId || req.query.doctorId;
    if (!doctorId) {
      return next(new AppError('Doctor ID required', 400));
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const prescriptions = await Prescription.find({
      doctorId,
      prescriptionDate: { $gte: start, $lte: end }
    })
      .populate('patientId', 'fullName uhid phone gender age')
      .sort({ prescriptionDate: -1 })
      .lean();

    return sendSuccess(res, prescriptions);
  } catch (error) {
    next(error);
  }
};

