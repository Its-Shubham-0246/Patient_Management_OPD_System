import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  User,
  Stethoscope,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { getPatientActiveQueue, PatientActiveQueueResponse } from '../../services/queueService';
import { getPatients, PatientData } from '../../services/patientService';

export const LiveTokenTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resolvedPatientId, setResolvedPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [tokenStatus, setTokenStatus] = useState<PatientActiveQueueResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [lastCalledAlert, setLastCalledAlert] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play Web Audio API chime when token is CALLED
  const playChime = () => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Dual-tone chime: D5 (587.33 Hz) sliding to A5 (880 Hz)
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.35);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  };

  // Determine which patient to track
  useEffect(() => {
    const initPatient = async () => {
      try {
        if (user?.patientProfileId) {
          setResolvedPatientId(user.patientProfileId);
        } else {
          // If staff/admin previewing, pick first patient
          const res = await getPatients({ limit: 1 });
          if (res?.patients?.length > 0) {
            setResolvedPatientId(res.patients[0]._id);
            setPatientData(res.patients[0]);
          }
        }
      } catch (err) {
        console.error('Failed to resolve patient:', err);
      }
    };
    initPatient();
  }, [user]);

  // Fetch live token status
  const fetchTokenStatus = async () => {
    if (!resolvedPatientId) return;
    try {
      const res = await getPatientActiveQueue(resolvedPatientId);
      setTokenStatus(res);

      if (res?.entry?.patientId) {
        setPatientData(res.entry.patientId as any);
      }

      // Check if newly called
      if (res?.entry?.status === 'CALLED' && !lastCalledAlert) {
        setLastCalledAlert(true);
        playChime();
      } else if (res?.entry?.status !== 'CALLED') {
        setLastCalledAlert(false);
      }
    } catch (err) {
      console.error('Failed to fetch active token status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resolvedPatientId) return;
    setLoading(true);
    fetchTokenStatus();
    const interval = setInterval(fetchTokenStatus, 8000); // Live poll every 8 seconds
    return () => clearInterval(interval);
  }, [resolvedPatientId]);

  const entry = tokenStatus?.entry;
  const doctor = entry?.doctorId;
  const isCalled = entry?.status === 'CALLED';
  const isInConsultation = entry?.status === 'IN_CONSULTATION';
  const isWaiting = entry?.status === 'WAITING';
  const isCompleted = entry?.status === 'COMPLETED';

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 px-2 sm:px-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/portal/dashboard')}
          className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portal</span>
        </Button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              isAudioEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
            title="Toggle Chime Sound"
          >
            {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline text-[11px] font-semibold">
              {isAudioEnabled ? 'Chime On' : 'Chime Off'}
            </span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTokenStatus}
            disabled={loading}
            className="p-1.5 text-xs text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading && !tokenStatus ? (
        <Card className="p-12 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-navy-900" />
          <p className="text-sm font-semibold text-slate-600">Connecting to live queue telemetry...</p>
        </Card>
      ) : !tokenStatus?.active || !entry ? (
        <Card className="p-8 text-center bg-white border-dashed border-slate-300 space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Active OPD Token Right Now</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              You are not currently checked into today's queue. Please arrive at the reception desk for token check-in, or schedule an appointment.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/portal/book')}
              className="text-xs bg-navy-900 text-white gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Consultation</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/portal/dashboard')}
              className="text-xs"
            >
              View Dashboard
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* URGENT Banner when CALLED */}
          {isCalled && (
            <div className="rounded-2xl border-2 border-red-500 bg-red-600 text-white p-5 text-center shadow-lg animate-bounce">
              <div className="inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider mb-1">
                <AlertCircle className="h-5 w-5" />
                <span>YOUR TOKEN HAS BEEN CALLED!</span>
              </div>
              <p className="text-xl font-black">
                PLEASE PROCEED TO ROOM #{doctor?.roomNumber || '1'} IMMEDIATELY
              </p>
            </div>
          )}

          {/* Main Live Token Glowing Card */}
          <div
            className={`rounded-3xl border-2 p-6 sm:p-8 text-center shadow-md transition-all ${
              isCalled
                ? 'border-red-500 bg-gradient-to-b from-red-50 to-white'
                : isInConsultation
                ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-white'
                : isCompleted
                ? 'border-emerald-500 bg-gradient-to-b from-emerald-50 to-white'
                : 'border-navy-900 bg-gradient-to-b from-slate-50 to-white'
            }`}
          >
            {/* Patient Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-4">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>{patientData?.fullName || 'Patient'}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-[11px]">{patientData?.uhid || 'OPD-XXXX'}</span>
            </div>

            {/* Huge Token Circle */}
            <div className="my-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Today's Queue Number
              </span>
              <div
                className={`inline-flex items-center justify-center h-28 w-28 sm:h-36 sm:w-36 rounded-full font-black text-4xl sm:text-5xl shadow-lg ring-8 transition-all ${
                  isCalled
                    ? 'bg-red-600 text-white ring-red-100 animate-pulse'
                    : isInConsultation
                    ? 'bg-blue-600 text-white ring-blue-100'
                    : isCompleted
                    ? 'bg-emerald-600 text-white ring-emerald-100'
                    : 'bg-navy-900 text-white ring-slate-100'
                }`}
              >
                #{entry.tokenNumber}
              </div>
            </div>

            {/* Status Pill */}
            <div className="mt-4">
              {isCalled ? (
                <Badge variant="danger" size="md" className="text-sm font-bold px-4 py-1.5 shadow-sm">
                  CALLED - PROCEED TO ROOM #{doctor?.roomNumber}
                </Badge>
              ) : isInConsultation ? (
                <Badge variant="info" size="md" className="text-sm font-bold px-4 py-1.5 bg-blue-600 text-white">
                  IN CONSULTATION WITH DOCTOR
                </Badge>
              ) : isCompleted ? (
                <Badge variant="success" size="md" className="text-sm font-bold px-4 py-1.5 bg-emerald-600 text-white">
                  CONSULTATION COMPLETED
                </Badge>
              ) : (
                <Badge variant="warning" size="md" className="text-sm font-bold px-4 py-1.5 bg-amber-500 text-white">
                  WAITING IN OPD QUEUE
                </Badge>
              )}
            </div>

            {/* Queue Position and Estimated Wait Metrics */}
            {isWaiting && (
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-200">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Queue Position</span>
                  <span className="text-lg font-black text-slate-900">
                    {tokenStatus.patientsAhead === 0 ? 'Next in Line!' : `${tokenStatus.patientsAhead} ahead`}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Estimated Wait</span>
                  <span className="text-lg font-black text-navy-900">
                    ~{tokenStatus.estimatedWaitMinutes} mins
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Attending Physician & Consulting Room Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Attending Doctor
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Dr. {doctor?.fullName || 'Physician'}
                </h4>
                <p className="text-xs text-slate-500">
                  {doctor?.specialization || 'General OPD'} · {doctor?.department || 'Outpatient'}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3 text-red-500" />
                <span>Consultation Room</span>
              </span>
              <span className="text-xl font-black text-navy-900">
                Room #{doctor?.roomNumber || '1'}
              </span>
            </div>
          </div>

          {/* Currently Serving in Clinic Info */}
          {tokenStatus.currentServingToken && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">
                  Doctor is currently seeing Token: <strong>#{tokenStatus.currentServingToken}</strong>
                </span>
              </div>
              <Badge variant="outline" size="sm" className="bg-white text-[10px]">
                {tokenStatus.currentServingStatus}
              </Badge>
            </div>
          )}

          {/* Patient Comfort & Helpful Advice Box */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-xs space-y-2 text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>While You Wait</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>Keep your mobile screen open on this page; an audio chime will sound when called.</li>
              <li>Have any previous lab reports or medication strips ready for the doctor.</li>
              <li>Free clinic Wi-Fi is available in the waiting lounge.</li>
            </ul>
          </div>

          {/* Statutory DPDP Compliance Note */}
          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Digital Personal Data Protection Act 2023 · Single Clinic Private Telemetry</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default LiveTokenTrackerPage;
