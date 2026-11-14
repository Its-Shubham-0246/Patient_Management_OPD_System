import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Activity,
  Globe,
  LogOut,
  Tv,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  Info,
  Check,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { checkHealth } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  INotification
} from '../../services/notificationService';

export interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
  onQuickSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickSearchClick
}) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Notification state
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<INotification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth()
      .then((res) => {
        setApiOnline(res?.success || false);
      })
      .catch(() => setApiOnline(false));
  }, []);

  // Fetch unread count & recent notifications
  const fetchNotificationData = async () => {
    if (!isAuthenticated) return;
    try {
      const [count, listRes] = await Promise.all([
        getUnreadCount(),
        getNotifications({ limit: 5 })
      ]);
      setUnreadCount(count);
      setRecentNotifications(listRes?.notifications || []);
    } catch (err) {
      // Silently catch in header
    }
  };

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(fetchNotificationData, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle clicking outside of notification popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: INotification) => {
    try {
      if (!notif.isRead) {
        await markAsRead(notif._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
      setIsDropdownOpen(false);
      if (notif.actionUrl) {
        navigate(notif.actionUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'QUEUE':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'PRESCRIPTION':
        return <FileText className="h-4 w-4 text-emerald-500" />;
      case 'BILLING':
        return <CreditCard className="h-4 w-4 text-indigo-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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

      {/* Right: Actions, Backend Health Indicator, Language, Notifications, User Session */}
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

        {/* Notifications Bell with Popover Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              if (!isDropdownOpen) fetchNotificationData();
            }}
            className="relative p-2 h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center focus:outline-none"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {recentNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No notifications yet
                  </div>
                ) : (
                  recentNotifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                        !notif.isRead ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p
                            className={`text-xs truncate ${
                              !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.channel && notif.channel !== 'IN_APP' && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {notif.channel}
                            </span>
                          </div>
                        )}
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer View All */}
              <div className="border-t border-slate-100 p-2.5 bg-slate-50 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors w-full py-1"
                >
                  <span>View all in Notification Center</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

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
