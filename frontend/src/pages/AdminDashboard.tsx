import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  CreditCard,
  Clock,
  TrendingUp,
  Stethoscope,
  Settings,
  PlusCircle,
  Sparkles,
  RefreshCw,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { getDashboardStats, DashboardStatsResponse } from '../services/appointmentService';
import { QuickBookingModal } from '../components/dashboard/QuickBookingModal';
import { QuickPatientModal } from '../components/dashboard/QuickPatientModal';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch operational stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy-900" />
            Admin Operational Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient throughput, consulting room capacity, and live clinical metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={loading}
            className="text-xs gap-1 border-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPatientModalOpen(true)}
            className="text-xs gap-1 border-slate-300"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>New Patient</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBookingModalOpen(true)}
            className="text-xs gap-1 bg-navy-900"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Quick Booking</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/settings')}
            className="text-xs gap-1"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert type="error" title="Data Sync Error">
          {errorMsg}
        </Alert>
      )}

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500">Loading operational telemetry...</span>
        </div>
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bookings Today"
              value={String(stats?.kpi.todayTotalAppointments || 0)}
              subtitle={`Across ${stats?.kpi.activeDoctorsCount || 0} active doctors`}
              icon={<Calendar className="h-4 w-4" />}
              trend={{ value: 'Today', isPositive: true }}
            />
            <StatCard
              title="Checked-In (OPD Queue)"
              value={String(stats?.kpi.todayCheckedIn || 0)}
              subtitle={`${stats?.kpi.todayWaitingLounge || 0} currently in waiting lounge`}
              icon={<Users className="h-4 w-4" />}
              trend={{ value: `${stats?.kpi.todayCompleted || 0} Completed`, isPositive: true }}
            />
            <StatCard
              title="Registered Patients"
              value={String(stats?.kpi.totalPatients || 0)}
              subtitle={`+${stats?.kpi.newPatientsToday || 0} registered today`}
              icon={<Users className="h-4 w-4" />}
              trend={{ value: 'Master EMR', isPositive: true }}
            />
            <StatCard
              title="Estimated Consultation Value"
              value={`₹ ${(stats?.kpi.estimatedRevenue || 0).toLocaleString('en-IN')}`}
              subtitle="Daily OPD consultation fees"
              icon={<CreditCard className="h-4 w-4" />}
              trend={{ value: 'Gross Fees', isPositive: true }}
            />
          </div>

          {/* Live Active Consulting Rooms Monitor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-navy-900" />
                  <span>Attending Physicians & Consulting Room Telemetry</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live status of attending clinicians, consulting rooms, and waiting queues
                </p>
              </div>
              <Badge variant="success" size="sm" className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Roster</span>
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Physician</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Bookings Today</TableHead>
                    <TableHead>Waiting in Queue</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Auto-Allocation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!stats?.doctorWorkload || stats.doctorWorkload.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-slate-400">
                        No doctors currently configured. Navigate to Doctor Directory to add clinicians.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.doctorWorkload.map((doc) => (
                      <TableRow key={doc._id}>
                        <TableCell className="font-bold text-navy-950">
                          {doc.fullName}
                          <div className="text-[10px] text-slate-400 font-normal">{doc.specialization}</div>
                        </TableCell>
                        <TableCell>{doc.department}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-navy-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {doc.roomNumber}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">₹{doc.consultationFee}</TableCell>
                        <TableCell className="font-semibold text-navy-950">{doc.todayTotalBookings}</TableCell>
                        <TableCell>
                          <Badge variant={doc.todayWaiting > 0 ? 'warning' : 'outline'}>
                            {doc.todayWaiting} waiting
                          </Badge>
                        </TableCell>
                        <TableCell className="text-emerald-700 font-medium">{doc.todayCompleted}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            Enabled ($W_i$)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">{doc.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Today's Appointments Quick View */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-navy-900" />
                  <span>Today's Outpatient Appointments ({stats?.todayAppointments?.length || 0})</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Chronological list of patient consultations scheduled for today</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/reception/dashboard')}>
                View Ingress Console
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Attending Doctor</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!stats?.todayAppointments || stats.todayAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                        No appointments booked for today yet. Use "Quick Booking" to schedule a patient.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.todayAppointments.map((appt) => (
                      <TableRow key={appt._id}>
                        <TableCell className="font-mono font-bold text-navy-950">{appt.timeSlot}</TableCell>
                        <TableCell>
                          {appt.tokenNumber ? (
                            <span className="font-mono font-bold text-medical-800 bg-medical-50 border border-medical-200 px-2 py-0.5 rounded text-xs">
                              #{appt.tokenNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-navy-950">{appt.patient?.fullName || 'Walk-In Patient'}</div>
                          <div className="text-[10px] text-slate-400">{appt.patient?.uhid} · {appt.patient?.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{appt.doctor?.fullName}</div>
                          <div className="text-[10px] text-slate-400">{appt.doctor?.roomNumber}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {appt.bookingChannel.replace('RECEPTIONIST_', '').replace('ONLINE_', '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              appt.status === 'CHECKED_IN'
                                ? 'warning'
                                : appt.status === 'COMPLETED'
                                ? 'success'
                                : appt.status === 'danger'
                                ? 'danger'
                                : 'default'
                            }
                          >
                            {appt.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Quick Patient Registration Modal */}
      <QuickPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        onBookAppointment={(pt) => {
          setIsBookingModalOpen(true);
        }}
      />
    </div>
  );
};
