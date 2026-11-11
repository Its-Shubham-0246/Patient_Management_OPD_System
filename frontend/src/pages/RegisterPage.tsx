import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE',
    age: '',
    password: '',
    consentGiven: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/portal/dashboard');
    }, 600);
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-6 px-4">
      <Card className="w-full max-w-lg shadow-md border-slate-200">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold">Patient Registration</CardTitle>
          <CardDescription className="text-xs">
            Create your digital patient profile and receive your Unique Hospital ID (UHID)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name (As per Aadhar / ID)"
              placeholder="e.g. Rahul Sharma"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="10-digit Mobile"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />

              <Input
                label="Age (Years)"
                type="number"
                placeholder="e.g. 34"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <Input
              label="Account Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            {/* DPDP Act 2023 Digital Consent Notice */}
            <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3.5 space-y-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-900 focus:ring-navy-900"
                  checked={formData.consentGiven}
                  onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                  required
                />
                <label htmlFor="consent" className="text-[11px] text-slate-700 leading-relaxed cursor-pointer">
                  <span className="font-semibold text-navy-900">DPDP Act 2023 Digital Consent: </span>
                  I consent to the collection and processing of my demographic and medical data strictly for outpatient healthcare delivery, digital prescriptions, and appointment management.
                </label>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full h-11 text-sm font-semibold" isLoading={isLoading}>
              Complete Registration & Issue UHID
            </Button>
          </form>

          <div className="text-center pt-4 text-xs text-slate-500 border-t border-slate-100 mt-4">
            <span>Already have an account or UHID? </span>
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
