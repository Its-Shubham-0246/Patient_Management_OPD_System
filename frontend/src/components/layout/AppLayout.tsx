import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine active role from authenticated user or current path
  const getInitialRole = () => {
    if (user?.role) return user.role;
    if (location.pathname.startsWith('/doctor')) return 'DOCTOR';
    if (location.pathname.startsWith('/reception')) return 'RECEPTIONIST';
    if (location.pathname.startsWith('/portal')) return 'PATIENT';
    return 'ADMIN';
  };

  const [currentRole, setCurrentRole] = useState<string>(getInitialRole());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  // Synchronize role switch with route navigation
  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    switch (newRole) {
      case 'DOCTOR':
        navigate('/doctor/workspace');
        break;
      case 'RECEPTIONIST':
        navigate('/reception/dashboard');
        break;
      case 'PATIENT':
        navigate('/portal/dashboard');
        break;
      case 'ADMIN':
      default:
        navigate('/admin/dashboard');
        break;
    }
  };

  // Global Keyboard Shortcuts (Alt+C: Search, Alt+N: New Patient)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+C or ⌘K opens quick patient search
      if ((e.altKey && e.key.toLowerCase() === 'c') || (e.metaKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onQuickSearchClick={() => setIsSearchOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Role Sidebar */}
        <Sidebar currentRole={currentRole} />

        {/* Main Content Workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto space-y-4">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Patient Search Modal (Alt+C) */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
        }}
        title="Quick Patient Search (Alt+C)"
        description="Search active clinical records by Mobile Phone, UHID, or Full Name"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              autoFocus
              className="pl-9"
              placeholder="e.g. 9876543210 or OPD-2611-00042..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Matching Patient Records
              </div>
              <div className="bg-white p-3 rounded border border-slate-200 hover:border-navy-900 cursor-pointer transition-colors flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-slate-900">Rahul Mehta</div>
                  <div className="text-[11px] text-slate-500">UHID: OPD-2611-00042 · Phone: 9876543210</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  <span>Select</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Type at least 3 characters to search across 10,000+ patient records
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

