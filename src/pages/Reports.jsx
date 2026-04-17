import { useEffect, useState } from "react";

function exportCSV(data) {
  if (data.length === 0) return;
  const headers = ["Name", "Age", "Disease", "Doctor", "Admitted", "Discharged", "Status", "Notes"];
  const rows = data.map(p => [
    p.name, p.age, p.disease, p.doctor,
    p.date || "", p.dischargeDate || "",
    p.status || "Discharged",
    (p.dischargeNotes || "").replace(/,/g, ";"),
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `discharged-patients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [data,   setData]   = useState([]);
  const [search, setSearch] = useState("");

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
    p.disease?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Discharged Patients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition-all hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Discharged", value: data.length, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { label: "This Month",       value: data.filter(p => p.dischargeDate?.startsWith(new Date().toISOString().slice(0,7))).length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Recovery Rate",    value: "100%",      color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-slate-200 dark:border-slate-800`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, disease, or doctor..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Table / Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-5xl">🚪</span>
          <p className="font-semibold">{data.length === 0 ? "No discharges yet" : "No matches found"}</p>
          <p className="text-sm">{data.length === 0 ? "Discharged patients will appear here." : "Try a different search term."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {["Patient", "Disease", "Doctor", "Admitted", "Discharged", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p, i) => {
                  const initials = p.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={p.id + (p.dischargeDate || i)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{initials}</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.blood || "—"} · Age {p.age}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.disease}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.doctor}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{p.date || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{p.dischargeDate || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                          ✓ {p.status || "Discharged"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((p, i) => (
              <div key={p.id + i} className="p-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white font-bold flex items-center justify-center shrink-0">
                  {p.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.disease} · {p.dischargeDate || ""}</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">✓ Done</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}