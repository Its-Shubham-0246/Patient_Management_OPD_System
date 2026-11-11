import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Activity,
  Globe,
  User as UserIcon,
  LogOut,
  Tv,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { checkHealth } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
  onQuickSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'ADMIN',
  onRoleChange,
  onQuickSearchClick
}) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth()
      .then((res) => {
        setApiOnline(res?.success || false);
      })
      .catch(() => setApiOnline(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const clinicName = import.meta.env.VITE_DEFAULT_CLINIC_NAME || 'City Health Care Clinic';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm">
      {/* Left: Clinic Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white font-bold text-lg shadow-sm">
            +
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              {clinicName}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Smart OPD Management System</p>
          </div>
        </Link>
      </div>

      {/* Center: Global Quick Patient Search Button (Alt+C / ⌘K) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onQuickSearchClick}
          className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-400 hover:bg-white transition-colors shadow-inner"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search Patient by Phone, UHID, or Name...</span>
          </span>
          <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 font-semibold border border-slate-300">
            Alt+C
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Backend Health Indicator, Language, User Session */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Backend API Health Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          {apiOnline === null ? (
            <Badge variant="outline" size="sm" className="gap-1">
              <Activity className="h-3 w-3 animate-pulse text-slate-400" />
              <span>Probing API</span>
            </Badge>
          ) : apiOnline ? (
            <Badge variant="success" size="sm" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>API Live</span>
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" className="gap-1">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <span>API Offline</span>
            </Badge>
          )}
        </div>

        {/* 4K Waiting Room Display Shortcut */}
        <Link to="/display/waiting-room" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs gap-1.5">
            <Tv className="h-3.5 w-3.5 text-blue-600" />
            <span>Waiting TV</span>
          </Button>
        </Link>

        {/* Bilingual Language Switcher */}
        <button
          onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          title="Toggle Language (English / हिंदी)"
        >
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <span>{lang === 'EN' ? 'हिंदी' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9 rounded-full text-slate-600">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"></span>
        </Button>

        {/* User Profile & Auth Controls */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {user.fullName}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                {user.role}
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.fullName.charAt(0)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-slate-600 hover:text-red-600 p-2"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <Button variant="primary" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};


