import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Stethoscope, UserCheck, Users, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, seedDemoUsers } = useAuth();

  const [role, setRole] = useState<UserRole>('ADMIN');
  const [identifier, setIdentifier] = useState('9876543210');
  const [password, setPassword] = useState('Admin@123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Demo accounts preset mapping
  const demoAccounts: Record<UserRole, { phone: string; pass: string; label: string }> = {
    ADMIN: { phone: '9876543210', pass: 'Admin@123', label: 'Admin (Dr. Owner)' },
    DOCTOR: { phone: '9876543211', pass: 'Doctor@123', label: 'Doctor (Dr. Sharma)' },
    RECEPTIONIST: { phone: '9876543212', pass: 'Reception@123', label: 'Receptionist (Sunita V.)' },
    PATIENT: { phone: '9876543213', pass: 'Patient@123', label: 'Patient (Rahul Mehta)' }
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIdentifier(demoAccounts[selectedRole].phone);
    setPassword(demoAccounts[selectedRole].pass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await login(identifier, password);
    setIsLoading(false);

    if (result.success && result.user) {
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (result.user.role) {
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
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickSeed = async () => {
    setIsSeeding(true);
    const ok = await seedDemoUsers();
    setIsSeeding(false);
    if (ok) {
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-6 px-4">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white font-bold text-xl shadow-xs">
            +
          </div>
          <CardTitle className="text-xl font-bold mt-2">Sign In to Smart OPD</CardTitle>
          <CardDescription className="text-xs">
            Enter your authorized clinical credentials to access your workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Demo Pre-fill Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Quick-Fill Demo Role
              </label>
              <button
                type="button"
                onClick={handleQuickSeed}
                disabled={isSeeding}
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                title="Populate database with default accounts if empty"
              >
                <Sparkles className="h-3 w-3" />
                <span>{isSeeding ? 'Seeding...' : 'Seed Database'}</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
              {(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] as const).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`py-1.5 px-1 rounded text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {seedSuccess && (
            <Alert type="success">
              Demo accounts initialized in MongoDB! Click any role button above to log in.
            </Alert>
          )}

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Registered Mobile Number or Email"
              type="text"
              placeholder="e.g. 9876543210 or admin@cityhealthcare.in"
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

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-semibold bg-navy-900 hover:bg-navy-800"
              isLoading={isLoading}
            >
              <span>Authenticate & Enter Workspace</span>
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
