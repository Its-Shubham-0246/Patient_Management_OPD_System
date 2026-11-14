import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  Stethoscope,
  ListOrdered,
  PlusCircle,
  FolderOpen,
  UserCheck,
  Bell
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  currentRole: string;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, isCollapsed = false }) => {
  const getNavLinks = () => {
    switch (currentRole) {
      case 'DOCTOR':
        return [
          { to: '/doctor/workspace', label: 'Consultation Room', icon: Stethoscope },
          { to: '/doctor/appointments', label: "Today's Schedule", icon: Calendar },
          { to: '/doctor/patients', label: 'Patient Directory', icon: Users },
          { to: '/doctor/records', label: 'Medical Records & EMR', icon: FolderOpen },
          { to: '/notifications', label: 'Notification Center', icon: Bell },
        ];
      case 'RECEPTIONIST':
        return [
          { to: '/reception/dashboard', label: 'Ingress & Check-In', icon: UserCheck },
          { to: '/reception/queue', label: 'Live Token Queue', icon: ListOrdered },
          { to: '/reception/appointments', label: 'Appointment Booking', icon: Calendar },
          { to: '/reception/records', label: 'Diagnostic Vault', icon: FolderOpen },
          { to: '/reception/billing', label: 'Cashier & Settlement', icon: CreditCard },
          { to: '/reception/patients', label: 'Patient Directory', icon: Users },
          { to: '/notifications', label: 'Notification Center', icon: Bell },
        ];
      case 'PATIENT':
        return [
          { to: '/portal/dashboard', label: 'My Patient Portal', icon: LayoutDashboard },
          { to: '/portal/book', label: 'Book Consultation', icon: PlusCircle },
          { to: '/portal/token', label: 'Live Token Status', icon: Clock },
          { to: '/portal/prescriptions', label: 'My Prescriptions', icon: FileText },
          { to: '/portal/reports', label: 'Diagnostic Reports', icon: FolderOpen },
          { to: '/portal/invoices', label: 'Payment Receipts', icon: CreditCard },
          { to: '/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'ADMIN':
      default:
        return [
          { to: '/admin/dashboard', label: 'Operational Cockpit', icon: LayoutDashboard },
          { to: '/admin/consultation', label: 'Consultation Desk', icon: Stethoscope },
          { to: '/admin/doctors', label: 'Doctor Directory & Rosters', icon: Stethoscope },
          { to: '/admin/staff', label: 'Front-Desk Staff', icon: Users },
          { to: '/admin/appointments', label: 'Clinic Appointments', icon: Calendar },
          { to: '/admin/queue', label: 'OPD Queue Overview', icon: ListOrdered },
          { to: '/admin/billing', label: 'Billing & Cash Ledger', icon: CreditCard },
          { to: '/admin/analytics', label: 'Business Analytics', icon: BarChart3 },
          { to: '/admin/audit', label: 'Compliance Audit Logs', icon: Shield },
          { to: '/notifications', label: 'Notifications & DLT Hub', icon: Bell },
          { to: '/admin/settings', label: 'Clinic Configuration', icon: Settings },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 select-none shadow-xs',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Role Badge Indicator */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Portal</span>
            <div className="text-xs font-bold text-navy-900 tracking-wide mt-0.5">
              {currentRole} WORKSPACE
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-navy-900 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-500 font-medium">Smart OPD v1.0.0</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Single-Clinic Edition</div>
        </div>
      )}
    </aside>
  );
};

