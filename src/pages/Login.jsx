import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 700)); // simulated delay
    const user = JSON.parse(localStorage.getItem("user"));
    console.log(user.email);
    console.log(user.password);
    if (user && user.email === form.email && user.password === form.password) {
      localStorage.setItem("auth", "true");
      window.dispatchEvent(new Event("storage"));
      toast("Welcome back, " + (user.name || "Admin") + "! 👋", "success");
      navigate("/");
    } else {
      toast("Invalid email or password. Please try again.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-900 p-12 relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/3 w-52 h-52 bg-cyan-600/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "5s" }} />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">🏥</div>
            <div>
              <p className="text-white font-bold text-xl">OPD Portal</p>
              <p className="text-indigo-300 text-sm">Patient Management System</p>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Streamlined.<br />Smart.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">
              Healthcare.
            </span>
          </h1>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-xs">
            Manage OPD patients, appointments, discharges, and reports — all in one powerful dashboard.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Patients/Day", value: "120+" },
            { label: "Doctors", value: "24" },
            { label: "Uptime", value: "99.9%" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🏥</span>
            <span className="text-white font-bold text-lg">OPD Portal</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-8">Welcome back — enter your credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                name="email" type="email" required autoComplete="email"
                placeholder="you@hospital.com"
                onChange={handleChange}
                className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPwd ? "text" : "password"} required
                  placeholder="••••••••"
                  onChange={handleChange}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-lg transition-colors"
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>

          <p className="text-center text-xs text-slate-600 mt-8">
            📞 +91 9876543210 &nbsp;|&nbsp; ✉️ support@opd.in
          </p>
        </div>
      </div>
    </div>
  );
}