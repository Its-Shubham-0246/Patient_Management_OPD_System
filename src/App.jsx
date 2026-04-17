import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useDarkMode } from "./hooks/useDarkMode";

import { ToastProvider } from "./components/Toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import About        from "./pages/About";
import Contact      from "./pages/Contact";
import Home         from "./pages/Home";
import Dashboard    from "./pages/Dashboard";
import AddPatient   from "./pages/AddPatient";
import PatientDetails from "./pages/PatientDetails";
import LeavePatient from "./pages/LeavePatient";
import Discharged   from "./pages/Discharged";
import Reports      from "./pages/Reports";
import Activity     from "./pages/Activity";
import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import Appointments from "./pages/Appointments";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { path: "/dashboard", icon: "📊", label: "Dashboard" },
      { path: "/activity",  icon: "🕒", label: "Activity"  },
    ],
  },
  {
    label: "Patients",
    items: [
      { path: "/",            icon: "🧑‍⚕️", label: "All Patients"   },
      { path: "/add",         icon: "➕",   label: "Add Patient"    },
      { path: "/discharged",  icon: "🚪",   label: "Discharged"     },
      { path: "/appointments",icon: "📅",   label: "Appointments"   },
    ],
  },
  {
    label: "Reports",
    items: [
      { path: "/reports", icon: "📈", label: "Reports" },
      { path: "/about",   icon: "ℹ️",  label: "About"   },
      { path: "/contact", icon: "📞", label: "Contact"  },
    ],
  },
];

function Sidebar({ dark, toggleDark }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const userName  = user?.name || "Admin";
  const initials  = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const logout = () => {
    localStorage.removeItem("auth");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full border-r border-slate-800 shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          🏥
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">OPD Portal</p>
          <p className="text-slate-500 text-xs">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left
                        ${isActive
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Dark / Light mode toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={toggleDark}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-full group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors duration-200"
        >
          {/* Label */}
          <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
            {dark ? "Light Mode" : "Dark Mode"}
          </span>

          {/* Pill track */}
          <div
            className={`relative flex items-center w-12 h-6 rounded-full transition-colors duration-300 ${
              dark ? "bg-indigo-600" : "bg-slate-600"
            }`}
          >
            {/* Icons inside track */}
            <span className="absolute left-1 text-[11px] select-none">🌙</span>
            <span className="absolute right-1 text-[11px] select-none">☀️</span>

            {/* Sliding thumb */}
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                dark ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      </div>

      {/* User profile */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-all cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email || "admin@opd.in"}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-slate-500 hover:text-rose-400 transition-colors text-sm"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}

function Layout() {
  const location  = useLocation();
  const [dark, toggleDark] = useDarkMode();

  const hideLayout = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      {!hideLayout && <Sidebar dark={dark} toggleDark={toggleDark} />}

      <div className="flex-1 flex flex-col min-w-0">
        {!hideLayout && <Header />}

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 min-h-full flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/login"   element={<Login />} />
                <Route path="/signup"  element={<Signup />} />
                <Route path="/about"   element={<ProtectedRoute><About /></ProtectedRoute>} />
                <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
                <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/"             element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/add"          element={<ProtectedRoute><AddPatient /></ProtectedRoute>} />
                <Route path="/patient/:id"  element={<ProtectedRoute><PatientDetails /></ProtectedRoute>} />
                <Route path="/leave/:id"    element={<ProtectedRoute><LeavePatient /></ProtectedRoute>} />
                <Route path="/discharged"   element={<ProtectedRoute><Discharged /></ProtectedRoute>} />
                <Route path="/reports"      element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/activity"     element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
              </Routes>
            </div>
            {!hideLayout && <Footer />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ToastProvider>
  );
}