import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import {
  NotificationService,
  DLT_SMS_TEMPLATES,
  generateHealthcareEmailHtml
} from '../services/notificationService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getOrCreateClinic } from './authController.js';

/**
 * List notifications with pagination, filters, and unread count
 */
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = req.user;

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { clinicId: clinic._id };

    // Apply role-based filtering
    if (user) {
      if (user.role === 'PATIENT') {
        filter.$or = [
          { recipientUserId: user._id },
          { recipientRole: 'PATIENT' },
          { recipientRole: 'ALL' }
        ];
      } else if (user.role === 'DOCTOR') {
        filter.$or = [
          { recipientUserId: user._id },
          { recipientRole: 'DOCTOR' },
          { recipientRole: 'ALL' }
        ];
      } else {
        // ADMIN / RECEPTIONIST can see all clinic notifications or filter by role
        if (req.query.recipientRole) {
          filter.recipientRole = req.query.recipientRole;
        }
      }
    }

    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.channel) {
      filter.channel = req.query.channel;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recipientUserId', 'fullName email role phone')
        .populate('recipientPatientId', 'fullName uhid phone')
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        ...filter,
        isRead: false
      })
    ]);

    return sendSuccess(res, {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get unread notification count for the active user / role
 */
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = req.user;

    const filter: any = {
      clinicId: clinic._id,
      isRead: false
    };

    if (user) {
      if (user.role === 'PATIENT') {
        filter.$or = [
          { recipientUserId: user._id },
          { recipientRole: 'PATIENT' },
          { recipientRole: 'ALL' }
        ];
      } else if (user.role === 'DOCTOR') {
        filter.$or = [
          { recipientUserId: user._id },
          { recipientRole: 'DOCTOR' },
          { recipientRole: 'ALL' }
        ];
      }
    }

    const count = await Notification.countDocuments(filter);
    return sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    return sendSuccess(res, notification, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all notifications as read for current user / clinic scope
 */
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clinic = await getOrCreateClinic();
    const user = req.user;

    const filter: any = {
      clinicId: clinic._id,
      isRead: false
    };

    if (user) {
      if (user.role === 'PATIENT') {
        filter.$or = [
          { recipientUserId: user._id },
          { recipientRole: 'PATIENT' },
          { recipientRole: 'ALL' }
        ];
      } else if (user.role === 'DOCTOR') {
        filter.$or = [
          { recipientUserId: user._id },
          { recipientRole: 'DOCTOR' },
          { recipientRole: 'ALL' }
        ];
      }
    }

    const result = await Notification.updateMany(filter, {
      isRead: true,
      readAt: new Date()
    });

    return sendSuccess(res, { updatedCount: result.modifiedCount }, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a custom notification or alert
 */
export const createNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clinic = await getOrCreateClinic();
    const {
      title,
      message,
      type = 'SYSTEM',
      event = 'SYSTEM_ALERT',
      channel = 'IN_APP',
      recipientRole = 'ALL',
      recipientUserId,
      recipientPatientId,
      actionUrl,
      metadata = {},
      email,
      phone
    } = req.body;

    if (!title || !message) {
      return next(new AppError('Title and message are required', 400));
    }

    const io = req.app.get('io');

    const notification = await NotificationService.send({
      clinicId: clinic._id,
      recipientUserId,
      recipientPatientId,
      recipientRole,
      type,
      event,
      channel,
      title,
      message,
      actionUrl,
      metadata,
      email,
      phone,
      io
    });

    return sendSuccess(res, notification, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get registered TRAI DLT templates and schemas
 */
export const getDltTemplates = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const templates = Object.entries(DLT_SMS_TEMPLATES).map(([key, def]) => ({
      key,
      templateId: def.templateId,
      header: def.header,
      title: def.title,
      templatePattern: def.templatePattern
    }));

    return sendSuccess(res, { templates });
  } catch (err) {
    next(err);
  }
};

/**
 * Test or preview template rendering (SMS + Email)
 */
export const testTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clinic = await getOrCreateClinic();
    const {
      templateKey = 'APPT_CONFIRMED',
      variables = {},
      dispatch = false,
      testEmail,
      testPhone
    } = req.body;

    const templateDef = DLT_SMS_TEMPLATES[templateKey];
    if (!templateDef) {
      return next(new AppError(`Unknown template key: ${templateKey}`, 400));
    }

    // Merge default test values
    const data = {
      patientName: 'Rahul Mehta',
      doctorName: 'A. Sharma',
      clinicName: clinic.clinicName || 'City Health Care Clinic',
      date: '2026-11-15',
      time: '10:30 AM',
      appointmentRef: 'APT-2026-99',
      roomNumber: '102',
      tokenNumber: 5,
      waitTime: 15,
      invoiceNumber: 'INV-2026-10',
      amount: '850.00',
      status: 'PAID',
      visitRef: 'VST-2026-01',
      dueDate: '2026-11-22',
      queueUrl: 'smartopd.in/q/5',
      portalUrl: 'smartopd.in/p/99',
      rxUrl: 'smartopd.in/rx/1',
      ...variables
    };

    const renderedSms = templateDef.render(data);
    const charCount = renderedSms.length;
    const gsmSegments = Math.ceil(charCount / 160) || 1;

    const renderedEmailHtml = generateHealthcareEmailHtml({
      to: testEmail || 'patient@example.com',
      subject: `[TEST] ${templateDef.title} - ${clinic.clinicName}`,
      clinicName: clinic.clinicName,
      patientName: data.patientName,
      heading: templateDef.title,
      bodyHtml: `<p>${renderedSms}</p>`,
      actionText: 'View Details',
      actionUrl: 'http://localhost:5173'
    });

    let dispatchResult: any = null;

    if (dispatch) {
      const io = req.app.get('io');
      dispatchResult = await NotificationService.send({
        clinicId: clinic._id,
        recipientRole: 'ADMIN',
        type: 'SYSTEM',
        event: templateKey as any,
        channel: testPhone || testEmail ? 'MULTI' : 'IN_APP',
        title: `[TEST PREVIEW] ${templateDef.title}`,
        message: renderedSms,
        metadata: data,
        email: testEmail,
        phone: testPhone,
        emailSubject: `[TEST] ${templateDef.title}`,
        emailHeading: templateDef.title,
        emailHtml: renderedEmailHtml,
        io
      });
    }

    return sendSuccess(res, {
      templateKey,
      dltTemplateId: templateDef.templateId,
      dltHeader: templateDef.header,
      sms: {
        text: renderedSms,
        characterCount: charCount,
        gsmSegments,
        isCompliant: charCount <= 160
      },
      emailPreviewHtml: renderedEmailHtml,
      dispatchResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    return sendSuccess(res, { id }, 200);
  } catch (err) {
    next(err);
  }
};

