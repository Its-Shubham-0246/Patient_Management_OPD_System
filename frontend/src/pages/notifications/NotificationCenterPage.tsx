import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Filter,
  RefreshCw,
  Search,
  Send,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  Info,
  Smartphone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  getNotifications,
  getDltTemplates,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  testTemplate,
  INotification,
  DltTemplateInfo
} from '../../services/notificationService';

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'APPOINTMENT' | 'QUEUE' | 'PRESCRIPTION' | 'BILLING' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // DLT Test Modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [dltTemplates, setDltTemplates] = useState<DltTemplateInfo[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('APPT_CONFIRMED');
  const [testPatientName, setTestPatientName] = useState<string>('Rahul Mehta');
  const [testDoctorName, setTestDoctorName] = useState<string>('A. Sharma');
  const [testDate, setTestDate] = useState<string>('2026-11-15');
  const [testTime, setTestTime] = useState<string>('10:30 AM');
  const [testToken, setTestToken] = useState<number>(4);
  const [testRoom, setTestRoom] = useState<string>('102');
  const [testAmount, setTestAmount] = useState<string>('750.00');
  const [testPhone, setTestPhone] = useState<string>('+91 98765 43210');
  const [testEmail, setTestEmail] = useState<string>('patient@example.com');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (activeTab === 'UNREAD') {
        params.isRead = false;
      } else if (activeTab !== 'ALL') {
        params.type = activeTab;
      }

      const res = await getNotifications(params);
      setNotifications(res?.notifications || []);
      setTotalCount(res?.total || 0);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  // Load DLT templates when modal opens
  useEffect(() => {
    if (isTestModalOpen && dltTemplates.length === 0) {
      getDltTemplates()
        .then((temps) => setDltTemplates(temps))
        .catch((e) => console.error(e));
    }
  }, [isTestModalOpen]);

  // Update preview when modal form changes
  const updateTemplatePreview = async (dispatch = false) => {
    try {
      if (dispatch) setIsDispatching(true);
      const res = await testTemplate({
        templateKey: selectedTemplateKey,
        variables: {
          patientName: testPatientName,
          doctorName: testDoctorName,
          date: testDate,
          time: testTime,
          tokenNumber: testToken,
          roomNumber: testRoom,
          amount: testAmount
        },
        dispatch,
        testPhone: dispatch ? testPhone : undefined,
        testEmail: dispatch ? testEmail : undefined
      });
      setPreviewResult(res);
      if (dispatch) {
        setDispatchStatus('Transmission successfully dispatched via simulated DLT gateway!');
        loadNotifications();
      }
    } catch (err: any) {
      console.error('Preview error', err);
      if (dispatch) setDispatchStatus('Dispatch failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    if (isTestModalOpen) {
      updateTemplatePreview(false);
    }
  }, [selectedTemplateKey, testPatientName, testDoctorName, testDate, testTime, testToken, testRoom, testAmount, isTestModalOpen]);

  // Actions
  const handleToggleRead = async (notif: INotification) => {
    try {
      if (!notif.isRead) {
        await markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered notifications by search
  const filteredNotifications = notifications.filter((notif) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      notif.title.toLowerCase().includes(q) ||
      notif.message.toLowerCase().includes(q) ||
      notif.type.toLowerCase().includes(q) ||
      notif.event?.toLowerCase().includes(q)
    );
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'QUEUE':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'PRESCRIPTION':
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case 'BILLING':
        return <CreditCard className="h-4 w-4 text-indigo-600" />;
      default:
        return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Notification Center & Telecommunications Hub
            </h1>
            <Badge variant="outline" size="sm" className="gap-1 border-blue-200 text-blue-700 bg-blue-50/50">
              <ShieldCheck className="h-3 w-3" />
              <span>TRAI DLT Compliant</span>
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Multi-channel patient messaging audit trail, DLT SMS verification, and clinical trigger logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All Read</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDispatchStatus(null);
              setIsTestModalOpen(true);
            }}
            className="gap-1.5 text-xs bg-navy-900 hover:bg-navy-800 text-white shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>DLT Sandbox & Test Dispatch</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Dispatched</span>
            <Bell className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</p>
          <span className="text-[11px] text-slate-400">Past 90-day retention</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unread Alerts</span>
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{unreadCount}</p>
          <span className="text-[11px] text-slate-400">Requiring acknowledgment</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">SMS Header</span>
            <Smartphone className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-700 tracking-wide">SMROPD</p>
          <span className="text-[11px] text-slate-400">TRAI Service Implicit</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email Transporter</span>
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-lg font-bold text-slate-800">SMTP Active</p>
          <span className="text-[11px] text-emerald-600 font-medium">99.8% Delivered</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'APPOINTMENT', label: 'Appointments' },
            { id: 'QUEUE', label: 'Live Queue' },
            { id: 'PRESCRIPTION', label: 'e-Prescriptions' },
            { id: 'BILLING', label: 'Billing' },
            { id: 'SYSTEM', label: 'System' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-navy-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-navy-900" />
          <p className="text-xs">Loading clinical notification logs...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No notifications found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No events match your selected category filter or search keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isExpanded = expandedLogId === notif._id;
            return (
              <div
                key={notif._id}
                className={`rounded-xl border transition-all ${
                  !notif.isRead
                    ? 'border-blue-200 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <Badge variant="danger" size="sm" className="text-[10px] py-0 px-1.5">
                            NEW
                          </Badge>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                        {notif.message}
                      </p>

                      {/* Channel and Delivery Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          <Smartphone className="h-3 w-3 text-slate-500" />
                          <span>Channel: {notif.channel}</span>
                        </span>

                        {notif.deliveryStatus === 'SENT' || notif.deliveryStatus === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            <span>Status: {notif.deliveryStatus}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            <span>Status: {notif.deliveryStatus}</span>
                          </span>
                        )}

                        {notif.event && (
                          <span className="text-slate-400 font-mono">
                            Event: {notif.event}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {notif.actionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(notif.actionUrl!)}
                          className="text-xs h-7 px-2.5 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRead(notif)}
                        className="text-xs h-7 px-2 text-slate-500 hover:text-slate-700"
                        title={notif.isRead ? 'Already Read' : 'Mark as Read'}
                      >
                        <CheckCheck className={`h-3.5 w-3.5 ${notif.isRead ? 'text-blue-600' : 'text-slate-400'}`} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notif._id)}
                        className="text-xs h-7 px-2 text-slate-400 hover:text-red-600"
                        title="Delete Alert"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Expand Delivery Details */}
                    {notif.deliveryLogs && notif.deliveryLogs.length > 0 && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : notif._id)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 mt-1"
                      >
                        <span>{isExpanded ? 'Hide Delivery Audit' : 'Audit Logs'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Delivery Audit Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 rounded-b-xl text-xs space-y-2">
                    <h5 className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                      Telecommunications Dispatch Audit Log (Indian DPDP Compliant)
                    </h5>
                    <div className="divide-y divide-slate-200/60 bg-white rounded-lg border border-slate-200 p-2 space-y-1">
                      {notif.deliveryLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{log.channel}</span>
                            <span className="text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.dltTemplateId && (
                              <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                DLT ID: {log.dltTemplateId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {log.messageId && (
                              <span className="text-slate-400 font-mono text-[10px]">
                                Msg ID: {log.messageId}
                              </span>
                            )}
                            <Badge
                              variant={log.status === 'FAILED' ? 'danger' : 'success'}
                              size="sm"
                              className="text-[10px] py-0"
                            >
                              {log.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DLT Testing & Dispatch Sandbox Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    TRAI DLT Template Sandbox & Test Dispatch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify registered Indian telecom templates and 160-character GSM compliance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Template Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Select Registered DLT Template
                </label>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-navy-900 focus:outline-none"
                >
                  <option value="APPT_CONFIRMED">APPT_CONFIRMED (Appointment Confirmation - DLT #1107168923450012)</option>
                  <option value="CHECKIN_TOKEN_ISSUED">CHECKIN_TOKEN_ISSUED (OPD Token Issued - DLT #1107168923450013)</option>
                  <option value="QUEUE_NEXT_CALLED">QUEUE_NEXT_CALLED (Urgent Token Called - DLT #1107168923450014)</option>
                  <option value="FOLLOWUP_REMINDER">FOLLOWUP_REMINDER (Follow-up Reminder - DLT #1107168923450015)</option>
                  <option value="DOCTOR_LEAVE_NOTICE">DOCTOR_LEAVE_NOTICE (Doctor Leave Cancellation - DLT #1107168923450016)</option>
                  <option value="INVOICE_GENERATED">INVOICE_GENERATED (Billing Receipt Notice - DLT #1107168923450017)</option>
                  <option value="PRESCRIPTION_READY">PRESCRIPTION_READY (Digital Rx Ready - DLT #1107168923450018)</option>
                </select>
              </div>

              {/* Variable Fields Grid */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Template Variables (In-Memory Merge)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={testPatientName}
                      onChange={(e) => setTestPatientName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={testDoctorName}
                      onChange={(e) => setTestDoctorName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Date</label>
                    <input
                      type="text"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Time Slot / Room</label>
                    <input
                      type="text"
                      value={testTime}
                      onChange={(e) => setTestTime(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Token Number</label>
                    <input
                      type="number"
                      value={testToken}
                      onChange={(e) => setTestToken(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Amount (₹)</label>
                    <input
                      type="text"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Live Rendered SMS Preview & Compliance Counter */}
              {previewResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Live TRAI DLT GSM Preview
                    </span>
                    <span className="text-xs font-semibold">
                      Length:{' '}
                      <strong className={previewResult.sms?.isCompliant ? 'text-emerald-600' : 'text-amber-600'}>
                        {previewResult.sms?.characterCount}
                      </strong>
                      /160 chars ({previewResult.sms?.gsmSegments} GSM segment)
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-slate-900 text-slate-100 p-4 font-mono text-xs leading-relaxed shadow-inner">
                    <div className="text-[10px] text-blue-400 font-bold mb-1">
                      HEADER: {previewResult.dltHeader} | DLT TEMPLATE ID: {previewResult.dltTemplateId}
                    </div>
                    <div>{previewResult.sms?.text}</div>
                  </div>
                </div>
              )}

              {/* Destination Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Test Phone (SMS Gateway)</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Test Email (SMTP Transporter)</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Dispatch Status Alert */}
              {dispatchStatus && (
                <div className={`p-3 rounded-lg text-xs font-medium ${
                  dispatchStatus.includes('failed')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {dispatchStatus}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <span className="text-[11px] text-slate-400">
                DPDP Act 2023: Simulated outbound gateway transmission.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTestModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateTemplatePreview(true)}
                  disabled={isDispatching}
                  className="gap-1.5 text-xs bg-navy-900 hover:bg-navy-800 text-white"
                >
                  <Send className={`h-3 w-3 ${isDispatching ? 'animate-spin' : ''}`} />
                  <span>{isDispatching ? 'Dispatching...' : 'Dispatch Live Test'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationCenterPage;

