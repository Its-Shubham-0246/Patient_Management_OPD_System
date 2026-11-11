import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    age: '',
    password: '',
    consentGiven: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUHID, setSuccessUHID] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || undefined,
      gender: formData.gender,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      password: formData.password,
      consentGiven: formData.consentGiven
    };

    const result = await register(payload);
    setIsLoading(false);

    if (result.success && result.uhid) {
      setSuccessUHID(result.uhid);
    } else {
      setError(result.error || 'Registration failed. Please check the provided information.');
    }
  };

  const handleProceedToPortal = () => {
    navigate('/portal/dashboard');
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
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

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
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
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

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-semibold bg-navy-900 hover:bg-navy-800"
              isLoading={isLoading}
            >
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

      {/* Success Modal Showing Allocated UHID */}
      <Modal
        isOpen={!!successUHID}
        onClose={handleProceedToPortal}
        title="Registration Successful!"
        description="Your patient identity has been securely created in the clinic master index"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
              Allocated Patient UHID
            </span>
            <div className="text-2xl font-black font-mono text-navy-900 tracking-tight mt-1">
              {successUHID}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Please quote this UHID when checking in at the front-desk reception counter.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={handleProceedToPortal} className="w-full gap-2">
              <span>Go to Patient Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
