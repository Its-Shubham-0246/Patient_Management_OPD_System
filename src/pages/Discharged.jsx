import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Discharged() {
  const [data,   setData]   = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const load = () => {
    const d = JSON.parse(localStorage.getItem("discharged")) || [];
    setData([...d].reverse());
  };

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const filtered = data.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.disease?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Discharged Patients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => navigate("/reports")}
          className="self-start inline-flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          📈 View Full Reports
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or disease..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-5xl">🚪</span>
          <p className="font-semibold">{data.length === 0 ? "No discharged patients yet" : "No matches found"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <div
              key={p.id + i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all animate-fade-in card-hover"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white font-bold flex items-center justify-center shrink-0">
                  {p.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">Age {p.age} · {p.blood || "—"}</p>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-full shrink-0">✓ Done</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span>🦠</span><span>{p.disease}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span>👨‍⚕️</span><span>{p.doctor}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span>📅</span><span>Discharged: {p.dischargeDate || "—"}</span>
                </div>
                {p.dischargeNotes && (
                  <div className="flex items-start gap-2 text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>📝</span><span className="text-xs leading-relaxed truncate">{p.dischargeNotes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}