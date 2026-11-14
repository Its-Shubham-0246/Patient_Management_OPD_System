import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  QrCode,
  Lock,
  Calendar,
  X,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  Receipt,
  Building,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  getDailyCollectionReport,
  voidInvoice,
  InvoiceData,
  InvoiceItem,
  DailyCollectionReport,
  PaymentData
} from '../../services/billingService';
import { searchPatients, PatientData } from '../../services/patientService';
import { getDoctors, DoctorData } from '../../services/clinicService';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

const COMMON_BILLING_PRESETS = [
  { description: 'General Physician Consultation', category: 'consultation' as const, unitPrice: 500 },
  { description: 'Specialist Consultation', category: 'consultation' as const, unitPrice: 800 },
  { description: 'Follow-Up Consultation (Within 7 Days)', category: 'consultation' as const, unitPrice: 300 },
  { description: '12-Lead Electrocardiogram (ECG)', category: 'procedure' as const, unitPrice: 350 },
  { description: 'Minor Wound Dressing & Bandage', category: 'procedure' as const, unitPrice: 250 },
  { description: 'Intramuscular (IM) Injection Administration', category: 'procedure' as const, unitPrice: 100 },
  { description: 'Random Blood Sugar (Glucometer Test)', category: 'lab' as const, unitPrice: 80 },
  { description: 'Nebulization Session (Single Dose)', category: 'procedure' as const, unitPrice: 200 },
  { description: 'New Patient Registration Fee', category: 'registration' as const, unitPrice: 100 }
];

export const BillingLedgerPage: React.FC = () => {
  const { user } = useAuth();

  // Invoices & Telemetry
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [report, setReport] = useState<DailyCollectionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // Doctors & Patients for Create Modal
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PatientData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Create Invoice Form State
  const [lineItems, setLineItems] = useState<
    Array<{ description: string; category: any; quantity: number; unitPrice: number; discount: number; tax: number; total: number }>
  >([
    { description: 'General Physician Consultation', category: 'consultation', quantity: 1, unitPrice: 500, discount: 0, tax: 0, total: 500 }
  ]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Payment Settlement Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'netbanking'>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Initial Invoices & Daily Telemetry
  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [invs, rep, docs] = await Promise.all([
        getInvoices({ status: statusFilter !== 'all' ? statusFilter : undefined, q: searchQuery }),
        getDailyCollectionReport(),
        getDoctors()
      ]);
      setInvoices(invs);
      setReport(rep);
      setDoctors(docs);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load billing ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [statusFilter]);

  // Debounced Search Patients
  useEffect(() => {
    if (!patientSearchQuery.trim() || patientSearchQuery.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchPatients(patientSearchQuery);
        setPatientSearchResults(res);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearchQuery]);

  // Calculations for Create Invoice Modal
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const calculatedDiscount =
    discountPercent > 0
      ? +(subtotal * (discountPercent / 100)).toFixed(2)
      : Math.min(subtotal, discountAmount || 0);
  const taxable = Math.max(0, subtotal - calculatedDiscount);
  const calculatedTax = +(taxable * (taxPercent / 100)).toFixed(2);
  const grandTotal = +(taxable + calculatedTax).toFixed(2);

  // Add Item
  const handleAddItem = (preset?: typeof COMMON_BILLING_PRESETS[0]) => {
    const newItem = {
      description: preset?.description || '',
      category: preset?.category || 'consultation',
      quantity: 1,
      unitPrice: preset?.unitPrice || 0,
      discount: 0,
      tax: 0,
      total: preset?.unitPrice || 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    const qty = Number(updated[index].quantity) || 1;
    const price = Number(updated[index].unitPrice) || 0;
    updated[index].total = +(qty * price).toFixed(2);
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Submit Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please search and select a patient');
      return;
    }
    if (lineItems.length === 0) {
      alert('Invoice must have at least one line item');
      return;
    }
    if ((discountPercent > 0 || discountAmount > 0) && !adminPin) {
      alert('Admin Authorization PIN is required to approve discounts');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        doctorId: selectedDoctorId || undefined,
        items: lineItems,
        discountPercent,
        discountAmount,
        discountReason,
        adminPin: adminPin || undefined,
        taxPercent,
        notes
      };

      const newInv = await createInvoice(payload);
      setSuccessMsg(`Invoice #${newInv.invoiceNumber} created successfully!`);
      setCreateModalOpen(false);
      resetCreateForm();
      fetchBillingData();

      // Offer to settle immediately
      setSelectedInvoice(newInv);
      setPaymentAmount(newInv.balanceAmount);
      setCashTendered(newInv.balanceAmount);
      setSettleModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedPatient(null);
    setPatientSearchQuery('');
    setSelectedDoctorId('');
    setLineItems([
      { description: 'General Physician Consultation', category: 'consultation', quantity: 1, unitPrice: 500, discount: 0, tax: 0, total: 500 }
    ]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setDiscountReason('');
    setAdminPin('');
    setTaxPercent(0);
    setNotes('');
  };

  // Open Settle Modal
  const handleOpenSettle = (inv: InvoiceData) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceAmount);
    setCashTendered(inv.balanceAmount);
    setTransactionRef('');
    setSettleNotes('');
    setSettleModalOpen(true);
  };

  // Submit Payment Settlement
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }
    if (paymentAmount > selectedInvoice.balanceAmount + 0.01) {
      alert('Payment amount exceeds outstanding balance');
      return;
    }

    setSettling(true);
    try {
      const res = await recordPayment({
        invoiceId: selectedInvoice._id,
        amount: paymentAmount,
        method: paymentMethod,
        transactionRef: transactionRef || (paymentMethod === 'cash' ? 'CASH_DESK' : undefined),
        notes: settleNotes
      });

      setSuccessMsg(`Payment of ₹${paymentAmount} recorded! Receipt #${res.payment.receiptNumber}`);
      setSettleModalOpen(false);
      fetchBillingData();

      // Show printable receipt
      const fullInv = await getInvoiceById(selectedInvoice._id);
      setSelectedInvoice(fullInv);
      setPrintModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSettling(false);
    }
  };

  // Open Print Modal
  const handleOpenPrint = async (inv: InvoiceData) => {
    try {
      const full = await getInvoiceById(inv._id);
      setSelectedInvoice(full);
      setPrintModalOpen(true);
    } catch (e) {
      setSelectedInvoice(inv);
      setPrintModalOpen(true);
    }
  };

  // Void Invoice
  const handleVoidInvoice = async (inv: InvoiceData) => {
    const reason = prompt(`Enter reason for voiding invoice #${inv.invoiceNumber}:`);
    if (!reason) return;
    try {
      await voidInvoice(inv._id, reason);
      setSuccessMsg(`Invoice #${inv.invoiceNumber} has been voided.`);
      fetchBillingData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to void invoice');
    }
  };

  // Cash Change Calculation
  const cashChangeDue = Math.max(0, +(cashTendered - paymentAmount).toFixed(2));

  return (
    <div className="space-y-5">
      {/* Top Banner & Daily Telemetry */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Billing & Cashier Ledger</h1>
            <p className="text-xs text-gray-500">
              Outpatient consultation billing, instant UPI QR payments, discount authorization & daily settlement
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchBillingData} title="Refresh Ledger">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {user?.role !== 'PATIENT' && (
            <Button
              variant="primary"
              onClick={() => {
                resetCreateForm();
                setCreateModalOpen(true);
              }}
              className="flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMsg && <Alert type="success">{successMsg}</Alert>}
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}

      {/* Daily Collections KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Today Collections
              </span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                ₹{report.metrics.totalCollected.toLocaleString('en-IN')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gray-500">
                <span>Cash: ₹{report.methodBreakdown.cash}</span> •
                <span>UPI: ₹{report.methodBreakdown.upi}</span> •
                <span>Card: ₹{report.methodBreakdown.card}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Total Invoiced Today
              </span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                ₹{report.metrics.totalInvoiced.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-gray-400 mt-1 block">
                {report.metrics.invoicesCount} Invoices Issued
              </span>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Pending Receivables
              </span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                ₹{report.metrics.pendingReceivables.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-amber-600/80 mt-1 block">Outstanding today</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Settled Transactions
              </span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {report.metrics.transactionsCount}
              </p>
              <span className="text-[11px] text-gray-400 mt-1 block">Payments Recorded</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Ledger Table Card */}
      <Card>
        <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1">
            {['all', 'pending', 'partially_paid', 'paid', 'void'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Inv # or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBillingData()}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No invoices found matching current filter.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isPaid = inv.status === 'paid';
                    const isVoid = inv.status === 'void';
                    const hasBalance = inv.balanceAmount > 0 && !isVoid;

                    return (
                      <tr key={inv._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-primary-700 dark:text-primary-300">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {inv.patientId?.fullName}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {inv.patientId?.uhid} • {inv.patientId?.phone}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {inv.doctorId?.fullName || 'OPD Clinic Desk'}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">
                          ₹{inv.paidAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              hasBalance ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                            }`}
                          >
                            ₹{inv.balanceAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              isPaid
                                ? 'success'
                                : inv.status === 'partially_paid'
                                ? 'info'
                                : isVoid
                                ? 'default'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {inv.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {hasBalance && user?.role !== 'PATIENT' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenSettle(inv)}
                              className="text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                            >
                              Settle Bill
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPrint(inv)}
                            className="text-[11px] py-1 px-2"
                            title="Print Invoice & Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Print
                          </Button>

                          {!isPaid && !isVoid && user?.role === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleVoidInvoice(inv)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Void Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE INVOICE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-primary-600" />
                <span>Create New Outpatient Invoice</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Patient Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Select Patient *
                </label>
                {selectedPatient ? (
                  <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 rounded-lg border border-primary-200 dark:border-primary-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-primary-900 dark:text-primary-100">
                        {selectedPatient.fullName}
                      </span>
                      <span className="text-xs text-primary-600 dark:text-primary-400 ml-2 font-mono">
                        {selectedPatient.uhid} • Phone: {selectedPatient.phone}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedPatient(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type patient UHID, name, or phone number..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    />
                    {patientSearchResults.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {patientSearchResults.map((p) => (
                          <div
                            key={p._id}
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientSearchResults([]);
                              setPatientSearchQuery('');
                            }}
                            className="p-2.5 hover:bg-primary-50 dark:hover:bg-primary-950/40 cursor-pointer flex justify-between items-center text-xs"
                          >
                            <div>
                              <strong className="text-gray-900 dark:text-white">{p.fullName}</strong>
                              <span className="text-gray-400 ml-2 font-mono">{p.uhid}</span>
                            </div>
                            <span className="text-gray-500">{p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Attending Doctor */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Attending Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <option value="">General OPD Clinic (No Specific Clinician)</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fullName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_BILLING_PRESETS.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddItem(preset)}
                      className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600"
                    >
                      + {preset.description} (₹{preset.unitPrice})
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Itemized Charges</span>
                  <Button size="sm" variant="outline" type="button" onClick={() => handleAddItem()}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-2 bg-gray-50 dark:bg-gray-700/40 rounded border border-gray-200 dark:border-gray-600 items-center text-xs"
                    >
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Rate (₹)"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Admin PIN Authorization */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Discount & Concession (Requires Admin PIN)</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent || ''}
                      onChange={(e) => {
                        setDiscountPercent(Number(e.target.value));
                        setDiscountAmount(0);
                      }}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">Discount ₹ (Fixed)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount || ''}
                      onChange={(e) => {
                        setDiscountAmount(Number(e.target.value));
                        setDiscountPercent(0);
                      }}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-700 font-bold">Admin PIN *</label>
                    <input
                      type="password"
                      placeholder="1234"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 rounded font-mono"
                    />
                  </div>
                </div>
                {(discountPercent > 0 || discountAmount > 0) && (
                  <input
                    type="text"
                    placeholder="Concession Reason (e.g. Senior Citizen, Staff Family, Courtesy)"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                  />
                )}
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- ₹{calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="text-primary-600 dark:text-primary-400">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Generating Invoice...' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT SETTLEMENT MODAL (CASH / UPI QR / CARD) */}
      {settleModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Settle Payment</h3>
                <span className="text-xs text-gray-500 font-mono">Invoice #{selectedInvoice.invoiceNumber}</span>
              </div>
              <button onClick={() => setSettleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Outstanding Balance Banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-semibold">
                  Outstanding Balance
                </span>
                <p className="text-xl font-black text-amber-700 dark:text-amber-300">
                  ₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <Badge variant="warning">Unsettled</Badge>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['upi', 'cash', 'card'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`text-xs py-2 px-2 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === m
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {m === 'upi' && <QrCode className="w-4 h-4" />}
                      {m === 'cash' && <DollarSign className="w-4 h-4" />}
                      {m === 'card' && <CreditCard className="w-4 h-4" />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount to Collect */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.balanceAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-base font-bold px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-primary-700 dark:text-primary-300"
                />
              </div>

              {/* Mode-Specific Controls */}
              {paymentMethod === 'upi' && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col items-center text-center space-y-2">
                  <div className="w-28 h-28 bg-white p-2 rounded-lg border border-gray-200 shadow-xs flex items-center justify-center">
                    {/* Simulated SVG QR Code */}
                    <QrCode className="w-24 h-24 text-gray-900" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                      Scan to Pay ₹{paymentAmount}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">UPI ID: smartopd@icici</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter UPI Reference / UTR Number *"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                  />
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium">Cash Tendered by Patient (₹)</label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      className="w-full text-sm font-bold px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-300">Change Due to Patient:</span>
                    <span className="text-emerald-600 font-black text-sm">₹{cashChangeDue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Card Auth / Approval Code (from POS Terminal)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AUTH-982341"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setSettleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={settling} className="bg-emerald-600 hover:bg-emerald-700">
                  {settling ? 'Recording...' : `Confirm Payment (₹${paymentAmount})`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL TAX INVOICE & THERMAL RECEIPT MODAL */}
      {printModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            {/* Header / Non-Print Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 print:hidden">
              <span className="text-sm font-bold text-gray-800">
                Official Clinical Invoice #{selectedInvoice.invoiceNumber}
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="primary" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" />
                  Print A4
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPrintModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            {/* A4 Printable Layout */}
            <div className="space-y-4 print:p-0">
              {/* Clinic Header */}
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-3">
                <div>
                  <h2 className="text-xl font-black text-emerald-800 uppercase tracking-wide">
                    {selectedInvoice.clinicId?.clinicName || 'Smart OPD Healthcare Center'}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {selectedInvoice.clinicId?.address?.line1 || 'Central Medical District, City Center'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Phone: {selectedInvoice.clinicId?.phone || '+91 98765 43210'} | GSTIN: 27AABCS1429B1Z
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={selectedInvoice.status === 'paid' ? 'success' : 'warning'}>
                    {selectedInvoice.status.toUpperCase()}
                  </Badge>
                  <p className="text-xs font-mono font-bold text-gray-800 mt-1">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-[11px] text-gray-500">
                    Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Demographics */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Billed To (Patient):</span>
                  <div className="font-bold text-gray-900 text-sm mt-0.5">{selectedInvoice.patientId?.fullName}</div>
                  <div className="text-gray-500">
                    UHID: <strong className="text-gray-800">{selectedInvoice.patientId?.uhid}</strong> • Phone:{' '}
                    {selectedInvoice.patientId?.phone}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Attending Physician:</span>
                  <div className="font-bold text-gray-900 text-sm mt-0.5">
                    {selectedInvoice.doctorId?.fullName || 'OPD Medical Officer'}
                  </div>
                  <div className="text-gray-500">
                    {selectedInvoice.doctorId?.specialization || 'Clinical Consultations'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-xs text-left border border-gray-200">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Service / Item Description</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 text-gray-400">{i + 1}</td>
                        <td className="p-2 font-semibold">{item.description}</td>
                        <td className="p-2 uppercase text-[10px] text-gray-500">{item.category}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({selectedInvoice.discountPercentage || 0}%):</span>
                      <span>- ₹{selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST / Taxes:</span>
                      <span>+ ₹{selectedInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300 text-gray-900">
                    <span>Grand Total:</span>
                    <span>₹{selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Total Paid:</span>
                    <span>₹{selectedInvoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-black">
                    <span>Balance Due:</span>
                    <span>₹{selectedInvoice.balanceAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History Receipts */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 uppercase mb-1">Payment Transactions:</h4>
                  <div className="space-y-1 text-xs">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p._id} className="p-1.5 bg-gray-50 rounded flex justify-between">
                        <span>
                          <strong className="text-emerald-700">Receipt #{p.receiptNumber}</strong> • Mode:{' '}
                          <strong className="uppercase">{p.method}</strong> • Ref: {p.transactionRef || 'N/A'}
                        </span>
                        <span className="font-bold">₹{p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-8 flex justify-between items-end border-t border-gray-200 text-xs">
                <div className="text-[10px] text-gray-400">
                  Computer generated official clinical receipt.
                  <br />
                  Governed under Indian Clinical Establishments Act.
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-emerald-800 font-bold mb-1">Authorized Signatory</div>
                  <div className="text-[10px] text-gray-500 border-t border-gray-300 pt-1">
                    Cashier / Accounts Desk
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
