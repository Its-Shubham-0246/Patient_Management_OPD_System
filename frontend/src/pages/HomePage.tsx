import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  Tv,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const HomePage: React.FC = () => {
  const clinicName = import.meta.env.VITE_DEFAULT_CLINIC_NAME || 'City Health Care Clinic';

  const portals = [
    {
      title: 'Clinic Admin Portal',
      description: 'Manage clinic profiles, doctor schedules, staff accounts, financial ledgers, and audit logs.',
      icon: ShieldCheck,
      badge: 'Executive',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      to: '/admin/dashboard',
      cta: 'Open Admin Cockpit'
    },
    {
      title: 'Doctor Workspace',
      description: 'Consultation room console, live queue calls, patient longitudinal EMR, and digital vector prescriptions.',
      icon: Stethoscope,
      badge: 'Clinician',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      to: '/doctor/workspace',
      cta: 'Enter Consultation Room'
    },
    {
      title: 'Front-Desk Reception',
      description: 'High-speed patient lookup (Alt+C), physical OPD check-in, walk-in token issuance, and cashier POS.',
      icon: UserCheck,
      badge: 'Front-Desk',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      to: '/reception/dashboard',
      cta: 'Open Reception Console'
    },
    {
      title: 'Patient Self-Service Portal',
      description: 'Book online appointments, track live OPD token position, download prescriptions, and view lab reports.',
      icon: Users,
      badge: 'Patient',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      to: '/portal/dashboard',
      cta: 'Open Patient Portal'
    }
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white p-6 md:p-10 shadow-lg border border-navy-950">
        <div className="max-w-3xl space-y-3">
          <Badge variant="outline" size="sm" className="bg-white/10 text-white border-white/20 gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Single-Clinic Outpatient Management System</span>
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            {clinicName}
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Engineered for high-volume outpatient care with intelligent doctor auto-allocation, real-time live queue management, DPDP Act compliance, and seamless cashier billing.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link to="/display/waiting-room" target="_blank">
              <Button variant="secondary" className="gap-2 bg-blue-600 hover:bg-blue-500 shadow-md">
                <Tv className="h-4 w-4" />
                <span>Launch Waiting Room TV (4K Display)</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <span>Sign In with Account</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Role Portal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <Card key={portal.title} className="hover:border-navy-900 transition-all hover:shadow-md flex flex-col justify-between">
              <div>
                <CardHeader className="flex-row items-center justify-between pb-3 border-b-0">
                  <div className={`p-2.5 rounded-lg border ${portal.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" size="sm" className="font-semibold">
                    {portal.badge}
                  </Badge>
                </CardHeader>
                <div className="px-5 pt-1 pb-4">
                  <CardTitle className="text-base font-bold text-slate-900">{portal.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {portal.description}
                  </CardDescription>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                <Link to={portal.to} className="w-full">
                  <Button variant="primary" size="sm" className="w-full justify-between group">
                    <span>{portal.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* System Highlights Banner */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">100% Configurable Identity</div>
            <p className="text-slate-500 mt-0.5">Zero hardcoded clinic names, fees, or doctor credentials.</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">Separate Encounter Lifecycle</div>
            <p className="text-slate-500 mt-0.5">Appointments reserve slots; physical check-in allocates daily tokens.</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">DPDP Act 2023 Compliant</div>
            <p className="text-slate-500 mt-0.5">Bilingual consent notices and privacy-masked waiting displays.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
