import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Tv, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const WaitingRoomDisplay: React.FC = () => {
  const clinicName = import.meta.env.VITE_DEFAULT_CLINIC_NAME || 'City Health Care Clinic';
  const [time, setTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const [callingToken, setCallingToken] = useState({
    token: 14,
    doctor: 'Dr. Rajesh Sharma',
    department: 'General Medicine',
    room: 'ROOM 1',
    maskedName: 'RAHUL M.'
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const playChime = () => {
    if (isMuted) return;
    try {
      // Synthesize clean dual-tone electronic chime
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start(audioCtx.currentTime + 0.15);
      osc1.stop(audioCtx.currentTime + 0.8);
      osc2.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('AudioContext not allowed without prior user interaction');
    }
  };

  const upcomingRooms = [
    { room: 'ROOM 1', doc: 'Dr. Sharma', dept: 'Gen. Medicine', nextTokens: ['#15 Priya S.', '#16 Amit K.'] },
    { room: 'ROOM 2', doc: 'Dr. Verma', dept: 'Orthopedics', nextTokens: ['#09 Geeta B.', '#10 Rajesh M.'] },
    { room: 'ROOM 3', doc: 'Dr. Mehta', dept: 'Gen. Medicine', nextTokens: ['#04 Vikram R.', '#05 Meena S.'] },
    { room: 'ROOM 4', doc: 'Dr. Gupta', dept: 'Gynecology', nextTokens: ['#07 Sunita P.', '#08 Kiran D.'] },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* 4K Top Navigation Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-2xl shadow-lg">
            +
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">{clinicName}</h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Live OPD Consultation Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-amber-400">
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

      {/* Main Calling Spotlight */}
      <main className="flex-1 flex flex-col p-8 space-y-6">
        <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-3 py-1 animate-pulse">
              ● NOW CALLING
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="text-sm uppercase tracking-widest text-slate-400 font-bold">
              Please Proceed Immediately To:
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="text-6xl md:text-8xl font-black text-amber-400 tracking-tight font-mono drop-shadow-md">
                TOKEN #{callingToken.token}
              </div>
              <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                ➔ {callingToken.room}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-sm md:text-base text-slate-300 gap-2">
              <div>
                Physician: <strong className="text-white">{callingToken.doctor}</strong> ({callingToken.department})
              </div>
              <div className="font-mono text-xs text-slate-400">
                Patient: <strong className="text-slate-200">{callingToken.maskedName}</strong> (DPDP Masked)
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Room Upcoming Roster */}
        <div className="flex-1 flex flex-col space-y-3">
          <h2 className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Upcoming Tokens In Queue (Please Be Seated In The Lounge):
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {upcomingRooms.map((rm) => (
              <div
                key={rm.room}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-sm text-blue-400">{rm.room}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{rm.dept}</span>
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-2">{rm.doc}</div>

                  <div className="mt-3 space-y-1.5">
                    {rm.nextTokens.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-800/60 text-xs font-mono font-medium text-slate-200"
                      >
                        <span>{t}</span>
                        <span className="text-[10px] text-slate-400">Next</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/50 text-[10px] text-slate-500 text-center">
                  Live Queue Synchronized
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Screen Footer */}
      <footer className="px-8 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Real-time WebSocket Queue Gateway Active</span>
        </div>
        <div>Please report to reception if you miss 3 audible token calls</div>
      </footer>
    </div>
  );
};

