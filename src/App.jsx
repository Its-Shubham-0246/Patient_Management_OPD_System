import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AddPatient from "./pages/AddPatient";
import PatientDetails from "./pages/PatientDetails";
import LeavePatient from "./pages/LeavePatient";
import Discharged from "./pages/Discharged";
import Reports from "./pages/Reports";
import Activity from "./pages/Activity";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const hideLayout =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 dark:text-white">

      {!hideLayout && (
        <div className="w-64 bg-slate-900 text-white p-5 h-full overflow-y-auto">

          <h2 className="text-xl font-bold mb-6">OPD Panel</h2>

          <ul className="space-y-3">

            <li onClick={() => navigate("/dashboard")} className="p-2 hover:bg-slate-700 cursor-pointer">📊 Dashboard</li>
            <li onClick={() => navigate("/")} className="p-2 hover:bg-slate-700 cursor-pointer">🔍 Patients</li>
            <li onClick={() => navigate("/reports")} className="p-2 hover:bg-slate-700 cursor-pointer">📈 Reports</li>
            <li onClick={() => navigate("/activity")} className="p-2 hover:bg-slate-700 cursor-pointer">🕒 Activity</li>

            <li
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-slate-700 cursor-pointer"
            >
              {darkMode ? "☀️ Day Mode" : "🌙 Night Mode"}
            </li>

          </ul>
        </div>
      )}


      <div className="flex-1 flex flex-col">

        {!hideLayout && <Header />}

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/add" element={<ProtectedRoute><AddPatient /></ProtectedRoute>} />
              <Route path="/patient/:id" element={<ProtectedRoute><PatientDetails /></ProtectedRoute>} />
              <Route path="/leave/:id" element={<ProtectedRoute><LeavePatient /></ProtectedRoute>} />
              <Route path="/discharged" element={<ProtectedRoute><Discharged /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
            </Routes>
          </div>

          {!hideLayout && <Footer />}
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}