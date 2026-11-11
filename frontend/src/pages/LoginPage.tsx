import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope, UserCheck, Users, Lock, Phone, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT'>('ADMIN');
  const [identifier, setIdentifier] = useState('9876543210');
  const [password, setPassword] = useState('Admin@123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Phase 1 navigation mock with role redirection
    setTimeout(() => {
      setIsLoading(false);
      switch (role) {
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
    }, 600);
  };

  const roles = [
    { id: 'ADMIN', label: 'Admin', icon: ShieldCheck },
    { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
    { id: 'RECEPTIONIST', label: 'Reception', icon: UserCheck },
    { id: 'PATIENT', label: 'Patient', icon: Users },
  ] as const;

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-6 px-4">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white font-bold text-xl shadow-xs">
            +
          </div>
          <CardTitle className="text-xl font-bold mt-2">Sign In to Smart OPD</CardTitle>
          <CardDescription className="text-xs">
            Select your clinical role and enter your authorized credentials
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-navy-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Mobile Number or Email"
              type="text"
              placeholder="e.g. 9876543210 or admin@clinic.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" className="w-full h-11 text-sm font-semibold" isLoading={isLoading}>
              <span>Authenticate as {role}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            <span>New patient seeking consultation? </span>
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
