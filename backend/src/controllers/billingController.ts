import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { Invoice, IInvoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Visit } from '../models/Visit.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { getOrCreateClinic } from './authController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

// Default Clinic Admin Discount Authorization PIN
const MASTER_ADMIN_DISCOUNT_PIN = process.env.ADMIN_DISCOUNT_PIN || '1234';

// Helper: Generate unique Invoice Number: INV-YYMM-XXXXX
const generateInvoiceNumber = async (clinicId: any): Promise<string> => {
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${yearShort}${month}-`;

  const count = await Invoice.countDocuments({
    clinicId,
    invoiceNumber: { $regex: `^${prefix}` }
  });

  const nextSeq = String(count + 1).padStart(5, '0');
  return `${prefix}${nextSeq}`;
};

// Helper: Generate unique Receipt Number: RCPT-YYMM-XXXXX
const generateReceiptNumber = async (clinicId: any): Promise<string> => {
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `RCPT-${yearShort}${month}-`;

  const count = await Payment.countDocuments({
    clinicId,
    receiptNumber: { $regex: `^${prefix}` }
  });

  const nextSeq = String(count + 1).padStart(5, '0');
  return `${prefix}${nextSeq}`;
};

// 1. Create Invoice
export const createInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      patientId,
      visitId,
      appointmentId,
      doctorId,
      items,
      discountPercent,
      discountAmount,
      discountReason,
      adminPin,
      taxPercent,
      notes,
      dueDate
    } = req.body;

    const clinic = await getOrCreateClinic();

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Invoice must contain at least one line item', 400));
    }

    // Verify Admin PIN if discount is requested
    const reqDiscountAmount = Number(discountAmount) || 0;
    const reqDiscountPercent = Number(discountPercent) || 0;
    let approvedBy = undefined;

    if (reqDiscountAmount > 0 || reqDiscountPercent > 0) {
      if (!adminPin || adminPin.trim() !== MASTER_ADMIN_DISCOUNT_PIN) {
        return next(
          new AppError('Admin PIN authorization failed. A valid Admin PIN is required to apply discounts.', 403)
        );
      }
      approvedBy = req.user?._id;
    }

    // Calculate line items
    let subtotal = 0;
    const computedItems = items.map((item: any) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unit = Math.max(0, Number(item.unitPrice) || 0);
      const itemDisc = Math.min(100, Math.max(0, Number(item.discount) || 0));
      const itemTax = Math.max(0, Number(item.tax) || 0);

      const base = qty * unit;
      const afterDisc = base * (1 - itemDisc / 100);
      const itemTotal = +(afterDisc * (1 + itemTax / 100)).toFixed(2);
      subtotal += base;

      return {
        description: item.description || 'Consultation Service',
        category: item.category || 'consultation',
        quantity: qty,
        unitPrice: unit,
        discount: itemDisc,
        tax: itemTax,
        total: itemTotal
      };
    });

    subtotal = +subtotal.toFixed(2);

    // Compute overall discount
    let totalDiscount = 0;
    if (reqDiscountPercent > 0) {
      totalDiscount = +(subtotal * (reqDiscountPercent / 100)).toFixed(2);
    } else if (reqDiscountAmount > 0) {
      totalDiscount = Math.min(subtotal, reqDiscountAmount);
    }

    // Compute overall tax
    const appliedTaxPercent = Number(taxPercent) || 0;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const taxTotal = +(taxableAmount * (appliedTaxPercent / 100)).toFixed(2);

    const grandTotal = +(taxableAmount + taxTotal).toFixed(2);
    const invoiceNumber = await generateInvoiceNumber(clinic._id);

    const invoice = await Invoice.create({
      clinicId: clinic._id,
      patientId: patient._id,
      visitId: visitId || undefined,
      appointmentId: appointmentId || undefined,
      doctorId: doctorId || undefined,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      status: 'pending',
      items: computedItems,
      subtotal,
      discountAmount: totalDiscount,
      discountPercentage: reqDiscountPercent,
      discountReason,
      discountApprovedBy: approvedBy,
      taxAmount: taxTotal,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      currency: 'INR',
      notes
    });

    // Link to Visit if provided
    if (visitId) {
      await Visit.findByIdAndUpdate(visitId, { invoiceId: invoice._id });
    }

    const populated = await Invoice.findById(invoice._id)
      .populate('patientId', 'fullName uhid phone gender age')
      .populate('doctorId', 'fullName specialization roomNumber')
      .populate('clinicId', 'clinicName address phone email logo');

    return sendSuccess(res, populated, 201);
  } catch (error) {
    next(error);
  }
};

// 2. Get Invoices List
export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId, status, from, to, q } = req.query;
    const clinic = await getOrCreateClinic();

    const filter: any = { clinicId: clinic._id };

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status && status !== 'all') filter.status = status;

    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(String(from));
      if (to) {
        const toDate = new Date(String(to));
        toDate.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = toDate;
      }
    }

    if (q) {
      filter.invoiceNumber = { $regex: String(q), $options: 'i' };
    }

    const invoices = await Invoice.find(filter)
      .populate('patientId', 'fullName uhid phone gender age')
      .populate('doctorId', 'fullName specialization')
      .sort({ invoiceDate: -1 })
      .lean();

    return sendSuccess(res, invoices);
  } catch (error) {
    next(error);
  }
};

// 3. Get Invoice by ID
export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('patientId', 'fullName uhid phone gender age address bloodGroup')
      .populate('doctorId', 'fullName specialization medicalRegistrationNumber roomNumber')
      .populate('clinicId', 'clinicName address phone email taxId logo')
      .populate('visitId')
      .lean();

    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    // Attach payments trail
    const payments = await Payment.find({ invoiceId: invoice._id })
      .populate('receivedBy', 'fullName role')
      .sort({ paymentDate: -1 })
      .lean();

    return sendSuccess(res, {
      ...invoice,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// 4. Record Payment against Invoice
export const recordPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, amount, method, transactionRef, notes, paymentDate } = req.body;
    const clinic = await getOrCreateClinic();

    if (!invoiceId || !amount || !method) {
      return next(new AppError('invoiceId, amount, and method are required', 400));
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(new AppError('Payment amount must be greater than 0', 400));
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    if (invoice.status === 'void' || invoice.status === 'refunded') {
      return next(new AppError(`Cannot record payment for a ${invoice.status} invoice`, 400));
    }

    if (invoice.balanceAmount <= 0) {
      return next(new AppError('Invoice is already fully paid', 400));
    }

    if (paymentAmount > invoice.balanceAmount + 0.01) {
      return next(
        new AppError(
          `Payment amount (₹${paymentAmount}) exceeds outstanding balance (₹${invoice.balanceAmount})`,
          400
        )
      );
    }

    const receiptNumber = await generateReceiptNumber(clinic._id);
    const transactionId = `TXN-${randomUUID().slice(0, 8).toUpperCase()}`;

    const payment = await Payment.create({
      clinicId: clinic._id,
      invoiceId: invoice._id,
      patientId: invoice.patientId,
      receiptNumber,
      transactionId,
      amount: paymentAmount,
      currency: invoice.currency || 'INR',
      method,
      status: 'success',
      transactionRef: transactionRef || (method === 'cash' ? 'CASH_DESK' : undefined),
      receivedBy: req.user?._id,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes
    });

    // Update Invoice balance and status
    invoice.paidAmount = +(invoice.paidAmount + paymentAmount).toFixed(2);
    invoice.balanceAmount = Math.max(0, +(invoice.grandTotal - invoice.paidAmount).toFixed(2));

    if (invoice.balanceAmount <= 0.01) {
      invoice.status = 'paid';
      invoice.balanceAmount = 0;
    } else {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    // Socket.IO real-time billing broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('billing:payment_recorded', {
        invoiceId: invoice._id,
        receiptNumber,
        amount: paymentAmount,
        status: invoice.status
      });
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('receivedBy', 'fullName role')
      .populate('patientId', 'fullName uhid phone');

    // Trigger Notification for Receipt
    try {
      const patientObj: any = populatedPayment?.patientId;
      NotificationService.notifyInvoiceGenerated({
        clinicId: clinic._id,
        patientId: patientObj?._id,
        patientName: patientObj?.fullName || 'Patient',
        clinicName: clinic.clinicName || 'City Health Care Clinic',
        invoiceNumber: invoice.invoiceNumber,
        amount: paymentAmount,
        status: invoice.status === 'paid' ? 'PAID' : 'PARTIALLY_PAID',
        phone: patientObj?.phone,
        email: patientObj?.email,
        io
      }).catch((err) => console.error('[Invoice Notification Error]', err));
    } catch (notifErr) {
      console.error('[Invoice Notification Failed]', notifErr);
    }

    return sendSuccess(
      res,
      {
        payment: populatedPayment,
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          grandTotal: invoice.grandTotal,
          paidAmount: invoice.paidAmount,
          balanceAmount: invoice.balanceAmount
        }
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// 5. Get Invoice Payments
export const getInvoicePayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetInvoiceId = req.params.invoiceId || req.params.id;
    const payments = await Payment.find({ invoiceId: targetInvoiceId })
      .populate('receivedBy', 'fullName role')
      .sort({ paymentDate: -1 })
      .lean();

    return sendSuccess(res, payments);
  } catch (error) {
    next(error);
  }
};

// 6. Apply Discount (Requires Admin PIN)
export const applyDiscount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { discountPercent, discountAmount, discountReason, adminPin } = req.body;

    if (!adminPin || adminPin.trim() !== MASTER_ADMIN_DISCOUNT_PIN) {
      return next(new AppError('Invalid Admin Authorization PIN', 403));
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    if (invoice.status === 'paid' || invoice.status === 'void') {
      return next(new AppError(`Cannot adjust discount on a ${invoice.status} invoice`, 400));
    }

    let calculatedDiscount = 0;
    const percent = Number(discountPercent) || 0;
    const fixedAmt = Number(discountAmount) || 0;

    if (percent > 0) {
      calculatedDiscount = +(invoice.subtotal * (percent / 100)).toFixed(2);
    } else if (fixedAmt > 0) {
      calculatedDiscount = Math.min(invoice.subtotal, fixedAmt);
    }

    invoice.discountPercentage = percent;
    invoice.discountAmount = calculatedDiscount;
    invoice.discountReason = discountReason || 'Admin Approved Discount';
    invoice.discountApprovedBy = req.user?._id;

    // Recalculate grand total
    const taxable = Math.max(0, invoice.subtotal - calculatedDiscount);
    invoice.grandTotal = +(taxable + invoice.taxAmount).toFixed(2);
    invoice.balanceAmount = Math.max(0, +(invoice.grandTotal - invoice.paidAmount).toFixed(2));

    if (invoice.balanceAmount <= 0.01) {
      invoice.status = 'paid';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'partially_paid';
    } else {
      invoice.status = 'pending';
    }

    await invoice.save();

    return sendSuccess(res, invoice);
  } catch (error) {
    next(error);
  }
};

// 7. Daily Collection Report
export const getDailyCollectionReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const clinic = await getOrCreateClinic();

    const targetDate = date ? new Date(String(date)) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // 1. Fetch payments collected today
    const payments = await Payment.find({
      clinicId: clinic._id,
      paymentDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'success'
    })
      .populate('receivedBy', 'fullName role')
      .populate('patientId', 'fullName uhid')
      .lean();

    // 2. Fetch invoices issued today
    const invoices = await Invoice.find({
      clinicId: clinic._id,
      invoiceDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    let totalCollected = 0;
    const methodBreakdown: Record<string, number> = {
      cash: 0,
      upi: 0,
      card: 0,
      netbanking: 0,
      other: 0
    };

    const cashierBreakdown: Record<string, number> = {};

    for (const p of payments) {
      totalCollected += p.amount;
      const m = p.method in methodBreakdown ? p.method : 'other';
      methodBreakdown[m] = +(methodBreakdown[m] + p.amount).toFixed(2);

      const cashierName = (p.receivedBy as any)?.fullName || 'Front Desk';
      cashierBreakdown[cashierName] = +((cashierBreakdown[cashierName] || 0) + p.amount).toFixed(2);
    }

    let totalInvoiced = 0;
    let pendingReceivables = 0;
    for (const inv of invoices) {
      if (inv.status !== 'void') {
        totalInvoiced += inv.grandTotal;
        pendingReceivables += inv.balanceAmount;
      }
    }

    return sendSuccess(res, {
      date: targetDate.toISOString().split('T')[0],
      clinicName: clinic.clinicName,
      metrics: {
        totalCollected: +totalCollected.toFixed(2),
        totalInvoiced: +totalInvoiced.toFixed(2),
        pendingReceivables: +pendingReceivables.toFixed(2),
        transactionsCount: payments.length,
        invoicesCount: invoices.length
      },
      methodBreakdown,
      cashierBreakdown,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// 8. Void Invoice
export const voidInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { voidReason } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    if (invoice.paidAmount > 0) {
      return next(
        new AppError('Cannot void an invoice that has payments recorded. Issue a refund or credit note.', 400)
      );
    }

    invoice.status = 'void';
    invoice.voidedBy = req.user?._id;
    invoice.voidReason = voidReason || 'Voided by administrative request';
    await invoice.save();

    return sendSuccess(res, { message: 'Invoice voided successfully', invoice });
  } catch (error) {
    next(error);
  }
};

