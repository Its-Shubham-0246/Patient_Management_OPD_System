import { useEffect, useState } from "react";

const CATEGORIES = ["All", "Admission", "Discharge", "System"];

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const d    = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function TimelineEvent({ event }) {
  const dotColor   = event.type === "admission" ? "bg-indigo-500" : event.type === "discharge" ? "bg-rose-500" : "bg-slate-400";
  const labelColor = event.type === "admission"
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    : event.type === "discharge"
    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor} mt-1.5 shrink-0 ring-4 ring-white dark:ring-slate-900`} />
        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {event.icon} {event.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${labelColor}`}>
              {event.label}
            </span>
            <span className="text-xs text-slate-400">{timeAgo(event.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Activity() {
  const [patients,   setPatients]   = useState([]);
  const [discharged, setDischarged] = useState([]);
  const [filter,     setFilter]     = useState("All");

  const loadData = () => {
    setPatients(JSON.parse(localStorage.getItem("patients"))    || []);
    setDischarged(JSON.parse(localStorage.getItem("discharged")) || []);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const events = [
    ...patients.map(p => ({
      id:       p.id + "-add",
      type:     "admission",
      icon:     "➕",
      name:     p.name,
      subtitle: `${p.disease} · ${p.doctor}`,
      label:    "Admitted",
      date:     p.date,
      category: "Admission",
    })),
    ...discharged.map(p => ({
      id:       p.id + "-dis",
      type:     "discharge",
      icon:     "🚪",
      name:     p.name,
      subtitle: `${p.disease}${p.dischargeNotes ? " · " + p.dischargeNotes : ""}`,
      label:    "Discharged",
      date:     p.dischargeDate || p.date,
      category: "Discharge",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = filter === "All" ? events : events.filter(e => e.category === filter);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Activity Timeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{events.length} total event{events.length !== 1 ? "s" : ""}</p>
        </div>
        {/* Stats pills */}
        <div className="flex gap-2">
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1.5 rounded-full">
            ➕ {patients.length} Admissions
          </span>
          <span className="text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-3 py-1.5 rounded-full">
            🚪 {discharged.length} Discharges
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                filter === c
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <span className="text-5xl">📋</span>
            <p className="font-semibold">No activity yet</p>
            <p className="text-sm">Events will appear here as patients are added or discharged.</p>
          </div>
        ) : (
          <div>
            {filtered.map((ev, i) => (
              <div key={ev.id} style={{ animationDelay: `${i * 40}ms` }}>
                <TimelineEvent event={ev} />
              </div>
            ))}
            {/* End dot */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
              <p className="text-xs text-slate-400 pb-2">End of activity log</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}