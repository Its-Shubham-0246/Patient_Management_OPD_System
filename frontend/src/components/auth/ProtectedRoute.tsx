import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-3">
        <Spinner size="lg" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Verifying Clinical Credentials...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const getRolePath = () => {
      switch (user.role) {
        case 'DOCTOR':
          return '/doctor/workspace';
        case 'RECEPTIONIST':
          return '/reception/dashboard';
        case 'PATIENT':
          return '/portal/dashboard';
        case 'ADMIN':
        default:
          return '/admin/dashboard';
      }
    };

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted by Role Policy</h2>
        <p className="text-xs text-slate-500 max-w-md mt-1">
          Your current account role (<strong className="text-slate-800">{user.role}</strong>) does not have authorization to view this medical module.
        </p>
        <div className="mt-5">
          <Link to={getRolePath()}>
            <Button variant="primary" size="sm" className="gap-2">
              <span>Go to your {user.role.toLowerCase()} dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

