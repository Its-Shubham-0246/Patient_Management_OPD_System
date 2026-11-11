import React, { useState } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  Clock,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

export const AdminDashboard: React.FC = () => {
  const clinicName = import.meta.env.VITE_DEFAULT_CLINIC_NAME || 'City Health Care Clinic';

  const doctors = [
    { name: 'Dr. Rajesh Sharma', specialty: 'General Medicine', room: 'Room 1', waiting: 6, activeToken: '#14', status: 'ACTIVE' },
    { name: 'Dr. Sunil Mehta', specialty: 'General Medicine', room: 'Room 3', waiting: 3, activeToken: '#08', status: 'ACTIVE' },
    { name: 'Dr. Ananya Verma', specialty: 'Orthopedics', room: 'Room 2', waiting: 4, activeToken: '#09', status: 'ACTIVE' },
    { name: 'Dr. Priya Gupta', specialty: 'Gynecology', room: 'Room 4', waiting: 2, activeToken: '#06', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Operational Cockpit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time outpatient throughput, consulting rooms, and daily financial metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white border-slate-300">
            Today: {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Badge>
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Settings className="h-3.5 w-3.5" />
            <span>Clinic Settings</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings Today"
          value="48"
          subtitle="Across 4 active doctors"
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: '+12%', isPositive: true }}
        />
        <StatCard
          title="Checked-In (OPD Queue)"
          value="32"
          subtitle="15 currently waiting in lounge"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: '67% Ingress', isPositive: true }}
        />
        <StatCard
          title="Average Waiting Time"
          value="14 mins"
          subtitle="Optimal flow target: <20m"
          icon={<Clock className="h-4 w-4" />}
          trend={{ value: '-3 mins', isPositive: true }}
        />
        <StatCard
          title="Today's Collections"
          value="₹ 24,500"
          subtitle="UPI: ₹18,000 · Cash: ₹6,500"
          icon={<CreditCard className="h-4 w-4" />}
          trend={{ value: '41 Settled', isPositive: true }}
        />
      </div>

      {/* Live Active Consulting Rooms Monitor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-navy-900" />
              <span>Active Consultation Rooms & Live Queue Monitor</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of attending physicians and waiting room backlog</p>
          </div>
          <Badge variant="success" size="sm" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Physician</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Active Token</TableHead>
                <TableHead>Waiting in Lounge</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doc) => (
                <TableRow key={doc.name}>
                  <TableCell className="font-semibold text-slate-900">{doc.name}</TableCell>
                  <TableCell>{doc.specialty}</TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">{doc.room}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info" size="sm" className="font-bold">{doc.activeToken}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{doc.waiting} Patients</TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">{doc.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

