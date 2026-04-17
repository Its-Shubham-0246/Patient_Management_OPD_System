import { useNavigate, useLocation } from "react-router-dom";

const routeLabels = {
  "/":             "All Patients",
  "/dashboard":    "Dashboard",
  "/add":          "Add Patient",
  "/discharged":   "Discharged",
  "/reports":      "Reports",
  "/activity":     "Activity",
  "/about":        "About",
  "/contact":      "Contact",
  "/appointments": "Appointments",
};

export default function Header() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const currentLabel =
    routeLabels[location.pathname] ||
    (location.pathname.startsWith("/patient/") ? "Patient Details"   :
     location.pathname.startsWith("/leave/")   ? "Discharge Patient" : "");

  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-indigo-500 dark:text-indigo-400 font-semibold hover:underline"
        >
          Home
        </button>
        {currentLabel && (
          <>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">{currentLabel}</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          📅 {now}
        </span>
      </div>
    </header>
  );
}