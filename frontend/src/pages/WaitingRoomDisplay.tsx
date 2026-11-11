import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Tv, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getDisplayQueue, DisplayQueueResponse, RoomDisplayData } from '../services/queueService';

export const WaitingRoomDisplay: React.FC = () => {
  const [clinicName, setClinicName] = useState('City Health Care Clinic');
  const [time, setTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const [rooms, setRooms] = useState<RoomDisplayData[]>([]);
  const [lastCalledToken, setLastCalledToken] = useState<string | null>(null);

  const prevCalledRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchQueueDisplay();
    const interval = setInterval(fetchQueueDisplay, 3500); // 3.5s live polling
    return () => clearInterval(interval);
  }, []);

  const fetchQueueDisplay = async () => {
    try {
      const data = await getDisplayQueue();
      if (data) {
        if (data.clinicName) setClinicName(data.clinicName);
        setRooms(data.rooms || []);

        // Detect newly called token across rooms
        const calledTokens = data.rooms
          ?.filter((r) => r.currentServing?.status === 'CALLED')
          .map((r) => `${r.doctorId}:${r.currentServing?.tokenNumber}:${r.currentServing?.calledAt}`);

        const currentCalledHash = calledTokens?.join('|') || null;
        if (currentCalledHash && currentCalledHash !== prevCalledRef.current) {
          prevCalledRef.current = currentCalledHash;
          playChime();
        }
      }
    } catch (err) {
      console.error('Display sync failed', err);
    }
  };

  const playChime = () => {
    if (isMuted) return;
    try {
      // Dual-tone hospital chime (D5 -> A5)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start(audioCtx.currentTime + 0.15);
      osc1.stop(audioCtx.currentTime + 0.9);
      osc2.stop(audioCtx.currentTime + 0.9);
    } catch (e) {
      console.warn('AudioContext not allowed without prior user interaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* 4K Top Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-3xl shadow-lg">
            +
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">{clinicName}</h1>
            <p className="text-xs text-blue-400 font-bold tracking-wider uppercase">
              Live OPD Outpatient Queue & Consulting Rooms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-amber-400">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={playChime}
              className="text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700 gap-1.5"
            >
              <Volume2 className="h-4 w-4 text-emerald-400" />
              <span>Test Chime</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 h-9 w-9 text-slate-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid: Active Consultation Rooms */}
      <main className="flex-1 p-8 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <Tv className="w-16 h-16 text-slate-700 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-400">No Consultation Rooms In Session</h2>
            <p className="text-xs text-slate-600 max-w-md">
              Waiting for clinicians to begin morning or evening shifts. Queue entries will appear automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map((room) => {
              const serving = room.currentServing;
              const isCalling = serving?.status === 'CALLED';
              const isInConsult = serving?.status === 'IN_CONSULTATION';

              return (
                <div
                  key={room.doctorId}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all shadow-xl ${
                    serving?.isEmergency
                      ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500'
                      : isCalling
                      ? 'border-amber-400 bg-slate-900 ring-2 ring-amber-400 animate-pulse'
                      : 'border-slate-800 bg-slate-900/90'
                  }`}
                >
                  {/* Room & Doctor Header */}
                  <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase">
                        {room.roomNumber}
                      </span>
                      <h2 className="text-lg font-black text-white">{room.doctorName}</h2>
                      <div className="text-xs text-slate-400 font-medium">{room.department}</div>
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-bold">
                      {room.waitingCount} in line
                    </span>
                  </div>

                  {/* Active Serving Token Display */}
                  <div className="p-6 text-center space-y-3 flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {isCalling ? '🔔 NOW CALLING TO ROOM' : isInConsult ? 'IN CONSULTATION' : 'CONSULTATION ROOM OPEN'}
                    </span>

                    {serving ? (
                      <div className="space-y-1">
                        <div
                          className={`text-6xl font-black font-mono tracking-tight ${
                            serving.isEmergency
                              ? 'text-red-400'
                              : isCalling
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          #{serving.tokenNumber}
                        </div>
                        <div className="text-base font-bold text-slate-200 tracking-wide mt-1">
                          {serving.maskedName}
                        </div>
                        <div className="text-xs font-mono text-slate-500">{serving.uhid}</div>
                      </div>
                    ) : (
                      <div className="py-6 text-slate-600 font-medium text-sm">
                        Waiting for next patient...
                      </div>
                    )}
                  </div>

                  {/* Upcoming Tokens list */}
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Next in Queue:
                    </span>
                    {room.upcomingTokens.length === 0 ? (
                      <div className="text-[11px] text-slate-600 italic">No waiting patients in queue</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {room.upcomingTokens.map((u) => (
                          <span
                            key={u.tokenNumber}
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                              u.isEmergency
                                ? 'bg-red-950 text-red-300 border-red-700'
                                : 'bg-slate-800 text-slate-200 border-slate-700'
                            }`}
                          >
                            #{u.tokenNumber} {u.maskedName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4K Footer Announcement Ticker */}
      <footer className="px-8 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Please proceed to your assigned consulting room when your token number is chimed.</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          DPDP Act 2023 Digital Healthcare Platform · Audio Chime Active
        </div>
      </footer>
    </div>
  );
};
