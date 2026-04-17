import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const PRIORITY_STYLES = {
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  High:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Medium:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Low:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function avatarColor(name = "") {
  const colors = ["from-indigo-500 to-indigo-700","from-violet-500 to-violet-700","from-emerald-500 to-emerald-700","from-rose-500 to-rose-700","from-amber-500 to-amber-700","from-cyan-500 to-cyan-700"];
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-lg w-7 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function PatientDetails() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const api   = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const local = JSON.parse(localStorage.getItem("patients"))    || [];
    const found = [...api, ...local].find(p => p.id === Number(id));
    setPatient(found);
  }, [id]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <span className="text-5xl">🔍</span>
        <p className="font-semibold">Patient not found</p>
        <button onClick={() => navigate("/")} className="text-indigo-500 hover:underline text-sm">Back to patients</button>
      </div>
    );
  }

  const initials  = patient.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const priorityCls = PRIORITY_STYLES[patient.priority] || PRIORITY_STYLES.Low;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-5">
      {/* Hero card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Top gradient banner */}
        <div className={`h-24 bg-gradient-to-r ${avatarColor(patient.name)}`} />

        {/* Avatar + name */}
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarColor(patient.name)} border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg`}>
              {initials}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">{patient.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{patient.gender || "—"} · Age {patient.age}</p>
            </div>
            <div className="ml-auto pb-1">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${priorityCls}`}>
                {patient.priority || "Low"} Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" /> Personal Info
          </h2>
          <InfoRow label="Contact"     value={patient.contact}    icon="📞" />
          <InfoRow label="Blood Group" value={patient.blood}      icon="🩸" />
          <InfoRow label="Gender"      value={patient.gender}     icon="👤" />
          <InfoRow label="Admitted"    value={patient.date}       icon="📅" />
        </div>

        {/* Medical */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-rose-500 rounded-full inline-block" /> Medical Info
          </h2>
          <InfoRow label="Diagnosis"   value={patient.disease}    icon="🦠" />
          <InfoRow label="Doctor"      value={patient.doctor}     icon="👨‍⚕️" />
          <InfoRow label="Priority"    value={patient.priority}   icon="⚡" />
          <InfoRow label="Patient ID"  value={`#${patient.id}`}   icon="🪪" />
        </div>
      </div>

      {/* Notes */}
      {patient.notes && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" /> Clinical Notes
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{patient.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={() => navigate(`/leave/${patient.id}`)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          🚪 Discharge Patient
        </button>
      </div>
    </div>
  );
}