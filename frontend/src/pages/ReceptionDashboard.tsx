import React, { useState } from 'react';
import {
  UserCheck,
  PlusCircle,
  Search,
  Printer,
  Sparkles,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

export const ReceptionDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState([
    { id: '1', time: '10:15 AM', name: 'Rahul Mehta', uhid: 'OPD-2611-00042', doctor: 'Dr. Sharma (Rm 1)', status: 'CHECKED_IN', token: 14 },
    { id: '2', time: '10:30 AM', name: 'Priya Singh', uhid: 'OPD-2611-00043', doctor: 'Dr. Sharma (Rm 1)', status: 'CONFIRMED', token: null },
    { id: '3', time: '10:45 AM', name: 'Amit Kumar', uhid: 'OPD-2611-00044', doctor: 'Dr. Sharma (Rm 1)', status: 'CONFIRMED', token: null },
    { id: '4', time: '10:30 AM', name: 'Suresh Patel', uhid: 'OPD-2611-00031', doctor: 'Dr. Verma (Rm 2)', status: 'IN_CONSULTATION', token: 8 },
  ]);

  const [lastAssignedToken, setLastAssignedToken] = useState<number | null>(14);

  const handleCheckIn = (id: string) => {
    const nextToken = (lastAssignedToken || 14) + 1;
    setLastAssignedToken(nextToken);
    setAppointments(
      appointments.map((apt) =>
        apt.id === id ? { ...apt, status: 'CHECKED_IN', token: nextToken } : apt
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Front-Desk Reception Console</h1>
          <p className="text-xs text-slate-500">Patient arrival check-in, token dispatching, walk-in allocation, and cashier billing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
            <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>New Patient Drawer (Alt+N)</span>
          </Button>
          <Button variant="primary" size="sm" className="text-xs gap-1.5 bg-navy-900">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Quick Walk-In Ingress</span>
          </Button>
        </div>
      </div>

      {/* Smart Specialist Doctor Auto-Allocation Ingress Banner */}
      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm" className="bg-blue-600 text-white border-transparent">
                Smart Doctor Allocation
              </Badge>
              <span className="text-xs font-bold text-slate-900">Optimal Specialist Recommendation</span>
            </div>
            <p className="text-xs text-slate-600">
              Department: <strong className="text-slate-800">General Medicine</strong> · Assigned: <strong className="text-slate-900">Dr. Rajesh Sharma (Room 1)</strong> · Lowest Workload: <strong className="text-emerald-700">0.34</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary" className="text-xs bg-blue-600 hover:bg-blue-500 shadow-xs">
              1-Click Auto-Allocate Walk-in
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              Override Options
            </Button>
          </div>
        </div>
      </div>

      {/* Appointment Ingress & Token Issuance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-navy-900" />
              <span>Today's Outpatient Arrival & Token Dispatch</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Physical check-in creates clinical visit and issues daily sequential token</p>
          </div>
          <Badge variant="default" size="sm">4 Pre-Booked Ingress</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token #</TableHead>
                <TableHead>Slot Time</TableHead>
                <TableHead>Patient Name & UHID</TableHead>
                <TableHead>Attending Doctor</TableHead>
                <TableHead>Ingress Status</TableHead>
                <TableHead className="text-right">Front-Desk Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    {apt.token ? (
                      <Badge variant="info" size="sm" className="font-bold">#{apt.token}</Badge>
                    ) : (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 text-xs">{apt.time}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-xs">{apt.name}</div>
                    <div className="text-[11px] text-slate-500">{apt.uhid}</div>
                  </TableCell>
                  <TableCell className="text-xs">{apt.doctor}</TableCell>
                  <TableCell>
                    {apt.status === 'CHECKED_IN' && <Badge variant="success" size="sm">CHECKED-IN</Badge>}
                    {apt.status === 'CONFIRMED' && <Badge variant="warning" size="sm">ARRIVED</Badge>}
                    {apt.status === 'IN_CONSULTATION' && <Badge variant="default" size="sm">IN-CONSULTATION</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {apt.status === 'CONFIRMED' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCheckIn(apt.id)}
                        className="text-xs bg-navy-900 hover:bg-navy-800"
                      >
                        Check-In & Issue Token
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs gap-1 border-slate-300">
                        <Printer className="h-3 w-3" />
                        <span>Print Slip (Alt+P)</span>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs gap-1 text-slate-600">
                      <CreditCard className="h-3 w-3" />
                      <span>Bill</span>
                    </Button>
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

