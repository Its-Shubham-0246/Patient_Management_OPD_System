import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListOrdered,
  Clock,
  User,
  Users,
  Bell,
  CheckCircle,
  PlayCircle,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Tv,
  RefreshCw,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import {
  getDoctorQueue,
  callNextToken,
  startConsultation,
  completeConsultation,
  skipToken,
  recallToken,
  markEmergency,
  QueueEntryData
} from '../../services/queueService';
import { getDoctors, DoctorData } from '../../services/clinicService';
import { QuickBookingModal } from '../../components/dashboard/QuickBookingModal';

export const LiveQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [queue, setQueue] = useState<QueueEntryData[]>([]);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 10000); // 10s auto refresh polling
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors({ status: 'ACTIVE' });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors');
    }
  };

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      const data = await getDoctorQueue(selectedDoctorId);
      setQueue(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  // Queue actions
  const handleCallNext = async (entry: QueueEntryData) => {
    try {
      setActionLoadingId(entry._id);
      setErrorMsg(null);
      const updated = await callNextToken(entry._id);
      setQueue((prev) => prev.map((q) => (q._id === entry._id ? updated : q)));
      setSuccessMsg(`Token #${entry.tokenNumber} called to ${entry.doctorId?.roomNumber}! Audio chime broadcast.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to call token');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartConsultation = async (entry: QueueEntryData) => {
    try {
      setActionLoadingId(entry._id);
      const updated = await startConsultation(entry._id);
      setQueue((prev) => prev.map((q) => (q._id === entry._id ? updated : q)));
      setSuccessMsg(`Token #${entry.tokenNumber} in consultation.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to start consultation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteConsultation = async (entry: QueueEntryData) => {
    try {
      setActionLoadingId(entry._id);
      const updated = await completeConsultation(entry._id);
      setQueue((prev) => prev.map((q) => (q._id === entry._id ? updated : q)));
      setSuccessMsg(`Token #${entry.tokenNumber} consultation completed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to complete consultation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSkip = async (entry: QueueEntryData) => {
    try {
      setActionLoadingId(entry._id);
      const updated = await skipToken(entry._id);
      setQueue((prev) => prev.map((q) => (q._id === entry._id ? updated : q)));
      setSuccessMsg(`Token #${entry.tokenNumber} marked as skipped.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to skip token');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRecall = async (entry: QueueEntryData) => {
    try {
      setActionLoadingId(entry._id);
      const updated = await recallToken(entry._id);
      setQueue((prev) => prev.map((q) => (q._id === entry._id ? updated : q)));
      setSuccessMsg(`Token #${entry.tokenNumber} recalled to active queue.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to recall token');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEmergency = async (entry: QueueEntryData) => {
    try {
      setActionLoadingId(entry._id);
      const updated = await markEmergency(entry._id);
      setQueue((prev) => prev.map((q) => (q._id === entry._id ? updated : q)));
      setSuccessMsg(`Token #${entry.tokenNumber} elevated to EMERGENCY priority.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Failed to elevate to emergency');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats calculation
  const totalIngress = queue.length;
  const waitingCount = queue.filter((q) => q.status === 'WAITING').length;
  const inConsultCount = queue.filter((q) => q.status === 'IN_CONSULTATION' || q.status === 'CALLED').length;
  const completedCount = queue.filter((q) => q.status === 'COMPLETED').length;
  const skippedCount = queue.filter((q) => q.status === 'SKIPPED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-medical-600" />
            Live OPD Queue Operations Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient queue management, sequential token calling, waiting time calculation, and triage status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/display/waiting-room', '_blank')}
            className="text-xs gap-1.5"
          >
            <Tv className="w-4 h-4 text-blue-600" />
            <span>Open 4K Waiting TV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsBookingModalOpen(true)}
            className="text-xs gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Walk-In Ingress</span>
          </Button>
        </div>
      </div>

      {successMsg && <Alert type="success" title="Queue Event">{successMsg}</Alert>}
      {errorMsg && <Alert type="error" title="Queue Error">{errorMsg}</Alert>}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Ingress</span>
          <span className="text-2xl font-bold text-navy-950">{totalIngress}</span>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block uppercase">Waiting in Lounge</span>
          <span className="text-2xl font-bold text-amber-950">{waitingCount}</span>
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 block uppercase">In Consultation / Called</span>
          <span className="text-2xl font-bold text-blue-950">{inConsultCount}</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block uppercase">Completed</span>
          <span className="text-2xl font-bold text-emerald-950">{completedCount}</span>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">Skipped</span>
          <span className="text-2xl font-bold text-slate-700">{skippedCount}</span>
        </div>
      </div>

      {/* Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-700 shrink-0">Attending Clinician:</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500 text-slate-800 font-medium w-full sm:w-64"
          >
            <option value="ALL">All Active Consulting Rooms</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.fullName} ({d.roomNumber}) · {d.department}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Live Auto-Sync (10s)</span>
          <Button variant="ghost" size="sm" onClick={fetchQueueData} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex justify-between items-center">
          <CardTitle className="text-sm font-semibold text-navy-900">
            Active Token Queue ({queue.length})
          </CardTitle>
          <span className="text-[11px] text-slate-400">
            Priority Order: Emergency (1) &gt; FIFO Tokens (100)
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading && queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <Spinner size="lg" />
              <span className="text-xs text-slate-500">Loading live queue...</span>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs space-y-2">
              <p>No patients currently in queue for this clinician.</p>
              <Button size="sm" variant="outline" onClick={() => setIsBookingModalOpen(true)}>
                Check In Walk-In Patient
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Patient Information</th>
                    <th className="py-3 px-4">Consulting Room</th>
                    <th className="py-3 px-4">Est. Wait</th>
                    <th className="py-3 px-4">Queue Status</th>
                    <th className="py-3 px-4 text-right">Triage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((entry) => {
                    const isCalling = entry.status === 'CALLED';
                    const isInConsult = entry.status === 'IN_CONSULTATION';
                    return (
                      <tr
                        key={entry._id}
                        className={`transition-colors ${
                          entry.isEmergency
                            ? 'bg-red-50/70 hover:bg-red-50'
                            : isCalling
                            ? 'bg-amber-50/80 hover:bg-amber-50 animate-pulse'
                            : isInConsult
                            ? 'bg-blue-50/50 hover:bg-blue-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-extrabold text-sm px-2.5 py-1 rounded border ${
                                entry.isEmergency
                                  ? 'bg-red-600 text-white border-red-700'
                                  : isCalling
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : isInConsult
                                  ? 'bg-blue-600 text-white border-blue-700'
                                  : 'bg-medical-50 text-medical-800 border-medical-200'
                              }`}
                            >
                              #{entry.tokenNumber}
                            </span>
                            {entry.isEmergency && (
                              <Badge variant="danger" className="text-[9px]">
                                EMERGENCY
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div
                            onClick={() => entry.patientId?._id && navigate(`/patients/${entry.patientId._id}`)}
                            className="font-bold text-navy-950 hover:text-medical-700 cursor-pointer flex items-center gap-1.5"
                          >
                            {entry.patientId?.fullName || 'Walk-In'}
                            {entry.patientId?.allergies && entry.patientId.allergies.length > 0 && (
                              <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 font-bold px-1 rounded">
                                ALLERGY
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {entry.patientId?.uhid} · {entry.patientId?.phone}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{entry.doctorId?.fullName}</div>
                          <div className="text-[10px] text-slate-500">
                            {entry.doctorId?.roomNumber} · {entry.doctorId?.department}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {entry.status === 'WAITING' ? (
                            <span className="font-semibold text-slate-700">
                              ~{entry.estimatedWaitMinutes || 0} mins
                            </span>
                          ) : entry.status === 'CALLED' ? (
                            <span className="font-bold text-amber-700 flex items-center gap-1">
                              <Bell className="w-3 h-3 animate-bounce" /> Now Calling
                            </span>
                          ) : entry.status === 'IN_CONSULTATION' ? (
                            <span className="font-bold text-blue-700">In Room</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              entry.status === 'CALLED'
                                ? 'warning'
                                : entry.status === 'IN_CONSULTATION'
                                ? 'info'
                                : entry.status === 'COMPLETED'
                                ? 'success'
                                : entry.status === 'SKIPPED'
                                ? 'outline'
                                : 'default'
                            }
                          >
                            {entry.status}
                          </Badge>
                          {entry.callCount > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              (Called {entry.callCount}x)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5">
                          {actionLoadingId === entry._id ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              {entry.status === 'WAITING' && (
                                <button
                                  type="button"
                                  onClick={() => handleCallNext(entry)}
                                  className="font-semibold text-xs text-white bg-amber-600 hover:bg-amber-500 px-2.5 py-1 rounded shadow-xs inline-flex items-center gap-1"
                                >
                                  <Bell className="w-3 h-3" /> Call
                                </button>
                              )}

                              {entry.status === 'CALLED' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartConsultation(entry)}
                                    className="font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded shadow-xs inline-flex items-center gap-1"
                                  >
                                    <PlayCircle className="w-3 h-3" /> Start Consult
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSkip(entry)}
                                    className="font-semibold text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                                  >
                                    Skip
                                  </button>
                                </>
                              )}

                              {entry.status === 'IN_CONSULTATION' && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteConsultation(entry)}
                                  className="font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded shadow-xs inline-flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Complete
                                </button>
                              )}

                              {entry.status === 'SKIPPED' && (
                                <button
                                  type="button"
                                  onClick={() => handleRecall(entry)}
                                  className="font-semibold text-xs text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 inline-flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" /> Recall
                                </button>
                              )}

                              {!entry.isEmergency && entry.status === 'WAITING' && (
                                <button
                                  type="button"
                                  onClick={() => handleEmergency(entry)}
                                  className="font-semibold text-[11px] text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded hover:bg-red-50"
                                  title="Elevate to Emergency (Top of Queue)"
                                >
                                  Emergency
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchQueueData}
      />
    </div>
  );
};

