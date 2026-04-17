import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MAX_CAPACITY = 100;

const COLORS = [
  "from-indigo-500 to-indigo-700",
  "from-emerald-500 to-emerald-700",
  "from-violet-500 to-violet-700",
  "from-rose-500 to-rose-700",
];

function StatCard({ icon, label, value, gradient, sub, delay = 0 }) {
  return (
    <div
      className={`card-hover bg-gradient-to-br ${gradient} text-white p-5 rounded-2xl shadow-lg animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold bg-white/20 rounded-full px-2.5 py-0.5">{label}</span>
      </div>
      <p className="text-4xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-xs mt-1 text-white/70">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[60%]">{label}</span>
        <span className="text-slate-500 dark:text-slate-400 font-semibold">{value}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [patients,   setPatients]   = useState([]);
  const [discharged, setDischarged] = useState([]);
  const navigate = useNavigate();

  const loadData = () => {
    const api   = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const local = JSON.parse(localStorage.getItem("patients"))    || [];
    const dis   = JSON.parse(localStorage.getItem("discharged"))  || [];
    setPatients([...api, ...local]);
    setDischarged(dis);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const total     = patients.length;
  const available = MAX_CAPACITY - total;
  const pct       = Math.min(Math.round((total / MAX_CAPACITY) * 100), 100);

  // Disease breakdown
  const diseaseMap = {};
  patients.forEach(p => { diseaseMap[p.disease] = (diseaseMap[p.disease] || 0) + 1; });
  const topDisease = Object.entries(diseaseMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Doctor workload
  const doctorMap = {};
  patients.forEach(p => { doctorMap[p.doctor] = (doctorMap[p.doctor] || 0) + 1; });
  const topDoctors = Object.entries(doctorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentLocal = JSON.parse(localStorage.getItem("patients")) || [];
  const recentAdded = [...recentLocal].reverse().slice(0, 5);
  const recentDis   = [...discharged].reverse().slice(0, 5);

  const barColor = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/add")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow transition-all hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
          >
            ➕ Add Patient
          </button>
          <button
            onClick={() => navigate("/appointments")}
            className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            📅 Appointments
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <StatCard icon="🧑‍⚕️" label="Total Patients"  gradient="from-indigo-500 to-indigo-700" value={total}              sub="Active in OPD"        delay={0}   />
        <StatCard icon="✅"    label="Discharged"       gradient="from-emerald-500 to-emerald-700" value={discharged.length} sub="Successfully treated" delay={70}  />
        <StatCard icon="🛏️"    label="Available Slots"  gradient="from-violet-500 to-violet-700"   value={available}        sub={`of ${MAX_CAPACITY} total`} delay={140} />
        <StatCard icon="📊"    label="Occupancy"
          gradient={pct >= 90 ? "from-rose-500 to-rose-700" : "from-amber-500 to-amber-600"}
          value={`${pct}%`}
          sub={pct >= 90 ? "⚠️ Critical" : pct >= 70 ? "🟡 High" : "🟢 Normal"}
          delay={210}
        />
      </div>

      {/* OPD Capacity bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 animate-fade-in">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">OPD Bed Capacity</h2>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${available > 0
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}>
            {available > 0 ? "🟢 OPD Active" : "🔴 OPD Full"}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>{total} occupied</span>
          <span>{available} available of {MAX_CAPACITY}</span>
        </div>
        {available < 10 && available > 0 && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
            ⚠️ Only {available} slots remaining — OPD is almost full!
          </p>
        )}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Disease breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">🦠 Top Diseases</h2>
          {topDisease.length === 0
            ? <p className="text-sm text-slate-400">No data yet</p>
            : <div className="space-y-3">
                {topDisease.map(([d, c]) => (
                  <MiniBar key={d} label={d} value={c} max={total} color="bg-indigo-500" />
                ))}
              </div>
          }
        </div>

        {/* Doctor workload */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">👨‍⚕️ Doctor Workload</h2>
          {topDoctors.length === 0
            ? <p className="text-sm text-slate-400">No data yet</p>
            : <div className="space-y-3">
                {topDoctors.map(([d, c]) => (
                  <MiniBar key={d} label={d} value={c} max={total} color="bg-violet-500" />
                ))}
              </div>
          }
        </div>

      </div>

      {/* Recent activity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recently added */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">🕐 Recently Added</h2>
          {recentAdded.length === 0
            ? <p className="text-sm text-slate-400">No patients added yet</p>
            : <ul className="space-y-3">
                {recentAdded.map(p => (
                  <li key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 py-1.5 transition-all" onClick={() => navigate(`/patient/${p.id}`)}>
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-bold flex items-center justify-center shrink-0">
                      {p.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.disease} · {p.doctor}</p>
                    </div>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full shrink-0">Active</span>
                  </li>
                ))}
              </ul>
          }
        </div>

        {/* Recently discharged */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">✅ Recently Discharged</h2>
          {recentDis.length === 0
            ? <p className="text-sm text-slate-400">No discharges yet</p>
            : <ul className="space-y-3">
                {recentDis.map(p => (
                  <li key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center justify-center shrink-0">
                      {p.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.dischargeDate || p.date} · {p.disease}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold shrink-0">Done</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );
}