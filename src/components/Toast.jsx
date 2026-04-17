import { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const variants = {
  success: { border: "border-emerald-500/40", bg: "bg-emerald-950/95", icon: "✅", bar: "bg-emerald-400" },
  error:   { border: "border-rose-500/40",    bg: "bg-rose-950/95",    icon: "❌", bar: "bg-rose-400"    },
  warning: { border: "border-amber-500/40",   bg: "bg-amber-950/95",   icon: "⚠️", bar: "bg-amber-400"  },
  info:    { border: "border-blue-500/40",    bg: "bg-blue-950/95",    icon: "ℹ️", bar: "bg-blue-400"   },
};

function ToastItem({ toast, onRemove }) {
  const v = variants[toast.type] || variants.success;
  return (
    <div className={`pointer-events-auto animate-toast-in relative overflow-hidden flex items-start gap-3 min-w-[300px] max-w-sm px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl text-white ${v.bg} ${v.border}`}>
      <span className="text-base mt-0.5 shrink-0">{v.icon}</span>
      <p className="text-sm leading-snug flex-1 font-medium">{toast.msg}</p>
      <button onClick={() => onRemove(toast.id)} className="text-white/40 hover:text-white text-xl leading-none shrink-0 transition-colors">×</button>
      <div className="absolute bottom-0 left-0 h-0.5 rounded-full animate-progress" style={{ backgroundColor: v.bar.replace("bg-", ""), background: "currentColor" }}>
        <div className={`h-0.5 animate-progress ${v.bar}`} />
      </div>
    </div>
  );
}

export const useToast = () => useContext(ToastCtx);
