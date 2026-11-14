import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  CreditCard,
  Clock,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  analyticsService,
  OverviewAnalytics,
  AppointmentAnalytics,
  RevenueAnalytics,
  DoctorMetric,
  PatientAnalytics,
  QueueAnalytics
} from '../../services/analyticsService';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#10B981', // Emerald
  upi: '#6366F1', // Indigo
  card: '#3B82F6', // Blue
  netbanking: '#8B5CF6', // Purple
  other: '#94A3B8' // Slate
};

const GENDER_COLORS = ['#3B82F6', '#EC4899', '#10B981'];

export const AnalyticsDashboardPage: React.FC = () => {
  // Preset filter: 'today' | '7days' | '30days' | 'month' | 'custom'
  const [filterPreset, setFilterPreset] = useState<'today' | '7days' | '30days' | 'month' | 'custom'>('30days');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Loading & Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [appointments, setAppointments] = useState<AppointmentAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [doctors, setDoctors] = useState<DoctorMetric[]>([]);
  const [patients, setPatients] = useState<PatientAnalytics | null>(null);
  const [queue, setQueue] = useState<QueueAnalytics | null>(null);

  // Compute dates based on preset
  const getDateRange = () => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    if (filterPreset === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filterPreset === '7days') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filterPreset === '30days') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filterPreset === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filterPreset === 'custom') {
      return {
        from: customFrom || undefined,
        to: customTo || undefined
      };
    }

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10)
    };
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = getDateRange();

      const [ovRes, apptRes, revRes, docRes, patRes, qRes] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getAppointments(params),
        analyticsService.getRevenue(params),
        analyticsService.getDoctors(params),
        analyticsService.getPatients(params),
        analyticsService.getQueue(params)
      ]);

      setOverview(ovRes);
      setAppointments(apptRes);
      setRevenue(revRes);
      setDoctors(docRes);
      setPatients(patRes);
      setQueue(qRes);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load clinic analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterPreset !== 'custom') {
      fetchAnalytics();
    }
  }, [filterPreset]);

  // CSV Export
  const handleExportCSV = () => {
    if (!overview || !revenue || !appointments) return;

    const rows: string[][] = [
      ['Smart OPD Clinic Analytics Report'],
      ['Report Generated At', new Date().toLocaleString()],
      ['Filter Period', `${overview.period.from} to ${overview.period.to}`],
      [],
      ['EXECUTIVE KPIs'],
      ['Metric', 'Value'],
      ['Total Registered Patients', overview.totalPatients.toString()],
      ['New Patients in Period', overview.newPatients.toString()],
      ['Total Appointments', overview.totalAppointments.toString()],
      ['Completed Consultations', overview.completedConsultations.toString()],
      ['Cancellation Rate (%)', `${overview.cancellationRate}%`],
      ['Total Revenue Invoiced (INR)', `Rs. ${overview.totalRevenue}`],
      ['Total Revenue Collected (INR)', `Rs. ${overview.totalCollected}`],
      ['Outstanding Balance (INR)', `Rs. ${overview.outstandingBalance}`],
      ['Average OPD Wait Time (mins)', `${overview.averageWaitTimeMinutes} mins`],
      [],
      ['DOCTOR PRODUCTIVITY & ATTRIBUTION'],
      ['Doctor Name', 'Specialization', 'Total Appointments', 'Completed', 'Completion Rate (%)', 'Revenue Generated (INR)'],
      ...doctors.map((d) => [
        `Dr. ${d.name}`,
        d.specialization,
        d.totalAppointments.toString(),
        d.completedConsultations.toString(),
        `${d.completionRate}%`,
        `Rs. ${d.revenueGenerated}`
      ]),
      [],
      ['PAYMENT METHOD BREAKDOWN'],
      ['Method', 'Amount (INR)'],
      ...Object.entries(revenue.byMethod).map(([m, amt]) => [m.toUpperCase(), `Rs. ${amt}`]),
      [],
      ['DAILY REVENUE & APPOINTMENT TREND'],
      ['Date', 'Invoiced (INR)', 'Collected (INR)']
    ];

    if (revenue.byDay) {
      revenue.byDay.forEach((d) => {
        rows.push([d.date, d.invoiced.toString(), d.collected.toString()]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(item => `"${item}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_opd_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format INR currency
  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Prepare payment method pie data
  const paymentPieData = revenue?.byMethod
    ? Object.entries(revenue.byMethod)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.toUpperCase(),
          value
        }))
    : [];

  // Age Cohort Data
  const ageCohortData = patients?.byAgeGroup
    ? Object.entries(patients.byAgeGroup).map(([group, count]) => ({
        group,
        count
      }))
    : [];

  // Gender Pie Data
  const genderPieData = patients?.byGender
    ? Object.entries(patients.byGender)
        .filter(([_, count]) => count > 0)
        .map(([gender, count]) => ({
          name: gender,
          value: count
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header & Filtering Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-navy-50 text-navy-900 rounded-lg">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Clinic Analytics & Business Intelligence</h1>
              <p className="text-xs text-slate-500">
                Operational KPIs, financial revenue reconciliation, physician workloads, and patient demographic insights.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setFilterPreset('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterPreset === 'today'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterPreset('7days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterPreset === '7days'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setFilterPreset('30days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterPreset === '30days'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setFilterPreset('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterPreset === 'month'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilterPreset('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterPreset === 'custom'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            Refresh
          </Button>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || !overview}
            className="flex items-center gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Custom Date Range Bar (if selected) */}
      {filterPreset === 'custom' && (
        <Card className="p-3 bg-slate-50 border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Date Range:
            </span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
            />
            <Button size="sm" onClick={fetchAnalytics} disabled={loading || !customFrom || !customTo}>
              Apply Filter
            </Button>
          </div>
        </Card>
      )}

      {errorMsg && (
        <Alert type="error">
          {errorMsg}
        </Alert>
      )}

      {loading && !overview ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-500">Aggregating live clinic analytics & financials...</p>
        </div>
      ) : (
        <>
          {/* 1. Executive Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Clinic Revenue"
              value={formatINR(overview?.totalRevenue || 0)}
              subtitle={`Collected: ${formatINR(overview?.totalCollected || 0)}`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Outstanding Dues"
              value={formatINR(overview?.outstandingBalance || 0)}
              subtitle={
                overview && overview.totalRevenue > 0
                  ? `${Math.round(((overview.totalCollected) / overview.totalRevenue) * 100)}% Collection Rate`
                  : '100% Settled'
              }
              icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              title="Total Appointments"
              value={overview?.totalAppointments || 0}
              subtitle={`${overview?.completedConsultations || 0} Completed (${overview?.cancellationRate || 0}% cancelled)`}
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Clinic Footfall"
              value={overview?.totalPatients || 0}
              subtitle={`+${overview?.newPatients || 0} new patients in period`}
              icon={<Users className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Average OPD Wait"
              value={`${overview?.averageWaitTimeMinutes || 15} mins`}
              subtitle={`Peak: ${queue?.peakHour || '10:00 - 11:00'}`}
              icon={<Clock className="w-5 h-5 text-teal-600" />}
            />
          </div>

          {/* 2. Visualizations Row 1: Revenue Trends & Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue & Collections Area Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Revenue & Collections Trend
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Comparison of total invoiced billings vs net cash/UPI collected
                  </p>
                </div>
                <Badge variant="success">Live Ledger</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full pt-4">
                  {revenue?.byDay && revenue.byDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenue.byDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          tickFormatter={(val) => val.slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [`₹${value}`, '']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Area
                          type="monotone"
                          dataKey="invoiced"
                          name="Invoiced"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorInvoiced)"
                        />
                        <Area
                          type="monotone"
                          dataKey="collected"
                          name="Collected"
                          stroke="#10B981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCollected)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No billing transactions found for selected range
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900">Payment Channels</CardTitle>
                <p className="text-xs text-slate-500">Settlement method breakdown</p>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full flex items-center justify-center">
                  {paymentPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {paymentPieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PAYMENT_COLORS[entry.name.toLowerCase()] || '#94A3B8'}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`₹${value}`, 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400">No payment records</div>
                  )}
                </div>

                {/* Legend list with INR values */}
                <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3">
                  {paymentPieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PAYMENT_COLORS[item.name.toLowerCase()] || '#94A3B8' }}
                        />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Visualizations Row 2: Appointment Volumes & OPD Queue Hourly Traffic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Appointments Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Daily Patient Appointments & Consultations
                </CardTitle>
                <p className="text-xs text-slate-500">Scheduled vs Completed Consultations</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full pt-2">
                  {appointments?.byDay && appointments.byDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointments.byDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          tickFormatter={(val) => val.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                        <Bar dataKey="count" name="Total Scheduled" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No appointment records for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Queue Hourly Throughput Bar Chart */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    OPD Queue Peak Hours & Ingress
                  </CardTitle>
                  <p className="text-xs text-slate-500">Hourly patient check-in frequency (08:00 - 20:00)</p>
                </div>
                {queue && (
                  <Badge variant="info" className="text-xs">
                    Peak: {queue.peakHour}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full pt-2">
                  {queue?.hourlyDistribution && queue.hourlyDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={queue.hourlyDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Tokens Issued" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No queue tokens logged
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. Doctor Performance & Revenue Attribution Table */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Doctor Productivity & Revenue Attribution
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Consultation throughput, completion metrics, and revenue generated by physician
                </p>
              </div>
              <Badge variant="outline" className="text-slate-600">
                {doctors.length} Active Physicians
              </Badge>
            </CardHeader>
            <CardContent>
              {doctors.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Physician</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Appointments</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Avg Duration</TableHead>
                        <TableHead className="text-right">Revenue Generated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors.map((doc) => (
                        <TableRow key={doc.doctorId} className="hover:bg-slate-50">
                          <TableCell className="font-semibold text-slate-900">
                            Dr. {doc.name}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{doc.specialization}</TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded font-medium text-slate-700">
                              {doc.roomNumber || 'Room 1'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">{doc.totalAppointments}</TableCell>
                          <TableCell className="font-medium text-emerald-700">{doc.completedConsultations}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800">{doc.completionRate}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(doc.completionRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {doc.averageConsultationMinutes} mins
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            {formatINR(doc.revenueGenerated)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No doctor roster records found</div>
              )}
            </CardContent>
          </Card>

          {/* 5. Patient Demographics & Health Cohorts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Age Cohorts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">Patient Age Demographics</CardTitle>
                <p className="text-xs text-slate-500">Distribution across age groups</p>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageCohortData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis dataKey="group" type="category" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Patients" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gender Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">Gender Ratio</CardTitle>
                <p className="text-xs text-slate-500">Registered patient cohorts</p>
              </CardHeader>
              <CardContent>
                <div className="h-36 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                      >
                        {genderPieData.map((_, index) => (
                          <Cell key={`gender-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex items-center justify-around border-t border-slate-100 pt-3">
                  {genderPieData.map((g, idx) => (
                    <div key={g.name} className="text-center">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">{g.name}</span>
                      <p className="text-sm font-bold text-slate-900">{g.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Allergies & Chronic Conditions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">Clinical Risk Cohorts</CardTitle>
                <p className="text-xs text-slate-500">Top flagged chronic conditions & allergies</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Chronic Conditions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {patients?.topChronicConditions && patients.topChronicConditions.length > 0 ? (
                      patients.topChronicConditions.map((c) => (
                        <span
                          key={c.condition}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          {c.condition} ({c.count})
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None logged</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Flagged Allergies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {patients?.topAllergies && patients.topAllergies.length > 0 ? (
                      patients.topAllergies.map((a) => (
                        <span
                          key={a.name}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200"
                        >
                          {a.name} ({a.count})
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None logged</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
