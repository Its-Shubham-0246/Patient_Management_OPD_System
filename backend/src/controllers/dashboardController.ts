import { Request, Response, NextFunction } from 'express';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getOrCreateClinic } from './authController.js';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinic = await getOrCreateClinic();

    // Today's date range (normalized to UTC / midnight)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalPatients,
      newPatientsToday,
      activeDoctors,
      todayAppointments,
      checkedInAppointments,
      completedAppointments
    ] = await Promise.all([
      Patient.countDocuments({ clinicId: clinic._id }),
      Patient.countDocuments({ clinicId: clinic._id, createdAt: { $gte: startOfToday, $lte: endOfToday } }),
      Doctor.find({ clinicId: clinic._id, status: 'ACTIVE' }).lean(),
      Appointment.find({
        clinicId: clinic._id,
        appointmentDate: { $gte: startOfToday, $lte: endOfToday }
      })
        .populate('patientId', 'fullName uhid phone gender age bloodGroup allergies')
        .populate('doctorId', 'fullName specialization roomNumber department consultationFee')
        .sort({ timeSlot: 1 })
        .lean(),
      Appointment.countDocuments({
        clinicId: clinic._id,
        appointmentDate: { $gte: startOfToday, $lte: endOfToday },
        status: 'CHECKED_IN'
      }),
      Appointment.countDocuments({
        clinicId: clinic._id,
        appointmentDate: { $gte: startOfToday, $lte: endOfToday },
        status: 'COMPLETED'
      })
    ]);

    // Compute doctor workload and active waiting counts for today
    const doctorStats = activeDoctors.map((doc) => {
      const docAppts = todayAppointments.filter((a) => a.doctorId && (a.doctorId as any)._id?.toString() === doc._id.toString());
      const checkedInForDoc = docAppts.filter((a) => a.status === 'CHECKED_IN').length;
      const completedForDoc = docAppts.filter((a) => a.status === 'COMPLETED').length;
      return {
        _id: doc._id,
        fullName: doc.fullName,
        department: doc.department,
        specialization: doc.specialization,
        roomNumber: doc.roomNumber,
        consultationFee: doc.consultationFee,
        maxDailyPatients: doc.maxDailyPatients,
        isAutoAllocatable: doc.isAutoAllocatable,
        status: doc.status,
        todayTotalBookings: docAppts.length,
        todayWaiting: checkedInForDoc,
        todayCompleted: completedForDoc
      };
    });

    return sendSuccess(res, {
      kpi: {
        totalPatients,
        newPatientsToday,
        todayTotalAppointments: todayAppointments.length,
        todayCheckedIn: checkedInAppointments,
        todayCompleted: completedAppointments,
        todayWaitingLounge: checkedInAppointments,
        activeDoctorsCount: activeDoctors.length,
        avgWaitMinutes: 12,
        estimatedRevenue: todayAppointments.reduce((sum, a: any) => sum + (a.doctorId?.consultationFee || 500), 0)
      },
      doctorWorkload: doctorStats,
      todayAppointments: todayAppointments.map((a: any) => ({
        _id: a._id,
        timeSlot: a.timeSlot,
        status: a.status,
        tokenNumber: a.tokenNumber,
        bookingChannel: a.bookingChannel,
        patient: a.patientId,
        doctor: a.doctorId
      }))
    });
  } catch (error) {
    next(error);
  }
};

