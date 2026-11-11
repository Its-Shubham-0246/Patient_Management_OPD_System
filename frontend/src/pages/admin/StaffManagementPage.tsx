import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  UserX,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import {
  getStaff,
  createStaff,
  updateStaff,
  StaffData
} from '../../services/clinicService';

export const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newStaff, setNewStaff] = useState<{
    fullName: string;
    phone: string;
    email: string;
    password: string;
    role: 'RECEPTIONIST' | 'ADMIN';
  }>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaff();
      setStaffList(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load clinic staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      setErrorMsg(null);
      await createStaff(newStaff);
      setSuccessMsg(`Staff user ${newStaff.fullName} added successfully.`);
      setIsAddModalOpen(false);
      setNewStaff({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        role: 'RECEPTIONIST'
      });
      fetchStaff();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to add staff member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (staff: StaffData) => {
    try {
      const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateStaff(staff._id, { status: newStatus });
      setStaffList((prev) =>
        prev.map((s) => (s._id === staff._id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      setErrorMsg('Failed to update staff status');
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <Users className="w-6 h-6 text-medical-600" />
            Front-Desk & Administrative Staff
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage reception desk operators, cashier accounts, and clinic system administrators.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {successMsg && (
        <Alert type="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert type="error" title="Error">
          {errorMsg}
        </Alert>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search staff by full name, phone number, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <Spinner size="lg" />
              <span className="text-xs text-slate-500">Loading staff records...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No staff members found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => (
                    <tr key={staff._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy-950">{staff.fullName}</div>
                        <div className="text-[11px] text-slate-400">ID: {staff._id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={staff.role === 'ADMIN' ? 'warning' : 'info'}>
                          {staff.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{staff.phone}</span>
                        </div>
                        {staff.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{staff.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={staff.status === 'ACTIVE' ? 'success' : 'default'}>
                          {staff.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          className={`font-semibold text-xs px-2.5 py-1 rounded transition-colors ${
                            staff.status === 'ACTIVE'
                              ? 'text-red-700 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {staff.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Clinic Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Staff Full Name"
            required
            placeholder="e.g. Meena Sharma"
            value={newStaff.fullName}
            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
          />
          <Input
            label="Mobile Phone (Login ID)"
            required
            placeholder="e.g. 9876543220"
            value={newStaff.phone}
            onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
          />
          <Input
            label="Staff Official Email"
            type="email"
            placeholder="meena.reception@clinic.in"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
          />
          <Input
            label="Initial Password"
            type="password"
            required
            placeholder="Min 6 characters"
            value={newStaff.password}
            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
            <select
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
              className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-medical-500"
            >
              <option value="RECEPTIONIST">Receptionist / Front-Desk Cashier</option>
              <option value="ADMIN">Clinic System Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addLoading}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

