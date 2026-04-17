import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";

export default function LeavePatient() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [patient,  setPatient]  = useState(null);
  const [notes,    setNotes]    = useState("");
  const [confirm,  setConfirm]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const api   = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const local = JSON.parse(localStorage.getItem("patients"))    || [];
    const found = [...api, ...local].find(p => p.id === Number(id));
    setPatient(found || null);
  }, [id]);

  const handleDischarge = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    let api       = JSON.parse(localStorage.getItem("apiPatients")) || [];
    let local     = JSON.parse(localStorage.getItem("patients"))    || [];
    let discharged = JSON.parse(localStorage.getItem("discharged")) || [];

    let p = null;
    if (api.find(x => x.id === Number(id))) {
      p   = api.find(x => x.id === Number(id));
      api = api.filter(x => x.id !== Number(id));
      localStorage.setItem("apiPatients", JSON.stringify(api));
    } else if (local.find(x => x.id === Number(id))) {
      p     = local.find(x => x.id === Number(id));
      local = local.filter(x => x.id !== Number(id));
      localStorage.setItem("patients", JSON.stringify(local));
    }

    if (!p) { toast("Patient not found.", "error"); setLoading(false); return; }

    discharged.push({
      ...p,
      status:        "Discharged",
      dischargeDate: new Date().toISOString().slice(0, 10),
      dischargeNotes: notes,
    });
    localStorage.setItem("discharged", JSON.stringify(discharged));
    window.dispatchEvent(new Event("storage"));

    toast(`${p.name} discharged successfully.`, "success");
    navigate("/discharged");
  };

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <span className="text-5xl">🔍</span>
        <p className="font-semibold">Patient not found</p>
        <button onClick={() => navigate("/")} className="text-indigo-500 hover:underline text-sm">Back to patients</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Discharge Patient</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review the details before confirming discharge</p>
      </div>

      {/* Patient summary card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-extrabold">
            {patient.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{patient.name}</p>
            <p className="text-sm text-slate-500">{patient.disease} · {patient.doctor}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { k: "Age",      v: `${patient.age} yrs` },
            { k: "Blood",    v: patient.blood || "—" },
            { k: "Contact",  v: patient.contact },
            { k: "Admitted", v: patient.date || "—" },
          ].map(({ k, v }) => (
            <div key={k} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{k}</p>
              <p className="text-slate-800 dark:text-white font-semibold mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Discharge date + notes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Discharge Date</label>
          <input
            type="date" value={new Date().toISOString().slice(0, 10)} readOnly
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Discharge Notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Treatment outcome, follow-up instructions..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
          />
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
        <span className="text-xl shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">This action cannot be undone</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">The patient will be moved to discharged records. Check the checkbox below to confirm.</p>
        </div>
      </div>

      {/* Confirm checkbox */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)}
          className="w-4 h-4 rounded accent-indigo-600" />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          I confirm the discharge of <strong>{patient.name}</strong> today.
        </span>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
          Cancel
        </button>
        <button
          onClick={handleDischarge}
          disabled={!confirm || loading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Processing...
            </span>
          ) : "🚪 Confirm Discharge"}
        </button>
      </div>
    </div>
  );
}