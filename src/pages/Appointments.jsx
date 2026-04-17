import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";

const DOCTORS   = ["General Physician", "Cardiologist", "Dermatologist", "Orthopedic", "Neurologist", "Pediatrician", "ENT Specialist"];
const STATUSES  = ["Scheduled", "Completed", "Cancelled"];
const STATUS_STYLES = {
  Scheduled:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Completed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Cancelled:  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const EMPTY_FORM = {
  patient: "", doctor: "", date: new Date().toISOString().slice(0, 10), time: "09:00", notes: "",
};

function timeLabel(t) {
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

export default function Appointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [showForm,     setShowForm]     = useState(false);
  const [filter,       setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");

  const load = () => setAppointments(JSON.parse(localStorage.getItem("appointments")) || []);

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const save = (list) => {
    localStorage.setItem("appointments", JSON.stringify(list));
    setAppointments(list);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAdd = e => {
    e.preventDefault();
    const newAppt = { id: Date.now(), status: "Scheduled", ...form };
    save([...appointments, newAppt]);
    toast(`Appointment booked for ${form.patient}!`, "success");
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    save(appointments.map(a => a.id === id ? { ...a, status } : a));
    toast(`Appointment marked as ${status}.`, status === "Completed" ? "success" : "warning");
  };

  const deleteAppt = id => {
    save(appointments.filter(a => a.id !== id));
    toast("Appointment removed.", "info");
  };

  const today = new Date().toISOString().slice(0, 10);

  const filtered = appointments
    .filter(a =>
      (filter === "All" || a.status === filter) &&
      (a.patient?.toLowerCase().includes(search.toLowerCase()) ||
       a.doctor?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const todayCount = appointments.filter(a => a.date === today).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {todayCount > 0 ? `${todayCount} appointment${todayCount > 1 ? "s" : ""} today` : "No appointments today"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition-all hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
        >
          {showForm ? "✕ Cancel" : "📅 Book Appointment"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",     value: appointments.length,                                         color: "text-indigo-600  dark:text-indigo-400",  bg: "bg-indigo-50  dark:bg-indigo-900/20"  },
          { label: "Today",     value: todayCount,                                                  color: "text-amber-600   dark:text-amber-400",   bg: "bg-amber-50   dark:bg-amber-900/20"   },
          { label: "Completed", value: appointments.filter(a => a.status === "Completed").length,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-slate-200 dark:border-slate-800`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Booking form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-slide-up">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full" /> Book New Appointment
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "patient", label: "Patient Name", type: "text", placeholder: "e.g. Anita Desai" },
              { name: "time",    label: "Time",         type: "time", placeholder: "" },
              { name: "date",    label: "Date",         type: "date", placeholder: "" },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{f.label} <span className="text-rose-400">*</span></label>
                <input
                  type={f.type} name={f.name} required
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Doctor <span className="text-rose-400">*</span></label>
              <select
                name="doctor" required value={form.doctor}
                onChange={e => setForm({ ...form, doctor: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select Doctor</option>
                {DOCTORS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
              <input
                name="notes" type="text" placeholder="Reason for visit, symptoms..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">
                📅 Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or doctor..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-5xl">📅</span>
          <p className="font-semibold">{appointments.length === 0 ? "No appointments yet" : "No matches"}</p>
          <p className="text-sm">Book an appointment using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => (
            <div
              key={a.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-all animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Time pill */}
              <div className="w-20 shrink-0 text-center">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-3 py-2">
                  <p className="text-xs text-indigo-400 font-semibold uppercase">{a.date === today ? "Today" : a.date}</p>
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-200">{timeLabel(a.time)}</p>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{a.patient}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">👨‍⚕️ {a.doctor}</p>
                {a.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">📝 {a.notes}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0 flex-wrap">
                {a.status === "Scheduled" && (
                  <button
                    onClick={() => updateStatus(a.id, "Completed")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all"
                  >✓ Done</button>
                )}
                {a.status === "Scheduled" && (
                  <button
                    onClick={() => updateStatus(a.id, "Cancelled")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-all"
                  >✕ Cancel</button>
                )}
                <button
                  onClick={() => deleteAppt(a.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
