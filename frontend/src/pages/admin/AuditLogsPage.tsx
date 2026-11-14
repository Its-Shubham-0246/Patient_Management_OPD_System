import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileCheck2,
  Clock,
  User,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';
import { aiService, AuditLogItem } from '../../services/aiService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchLogs = async (p = 1) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await aiService.getAuditLogs({ page: p, limit: 30 });
      setLogs(res.logs);
      setTotalPages(res.pages);
      setTotalRecords(res.total);
      setPage(res.page);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch compliance audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const filteredLogs = filterAction === 'ALL'
    ? logs
    : logs.filter((l) => l.action === filterAction);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AI_SOAP_SUMMARY_GENERATED':
        return <Badge variant="info">AI SOAP DRAFT</Badge>;
      case 'AI_DRAFT_ACCEPTED':
        return <Badge variant="success">DOCTOR APPROVED</Badge>;
      case 'AI_DRAFT_DISCARDED':
        return <Badge variant="outline" className="text-slate-500">DISCARDED</Badge>;
      case 'AI_DRUG_CHECK_PERFORMED':
        return <Badge variant="warning">DRUG SAFETY CHECK</Badge>;
      case 'AI_HISTORY_SUMMARIZED':
        return <Badge variant="info">EMR SUMMARY</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-900 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Compliance & AI Governance Audit Logs</h1>
            <p className="text-xs text-slate-500">
              Immutable medico-legal records under DPDP Act 2023 · Human-in-the-Loop review trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="AI_SOAP_SUMMARY_GENERATED">SOAP Generated</option>
            <option value="AI_DRAFT_ACCEPTED">Doctor Approved</option>
            <option value="AI_DRAFT_DISCARDED">Discarded</option>
            <option value="AI_DRUG_CHECK_PERFORMED">Drug Safety Checks</option>
            <option value="AI_HISTORY_SUMMARIZED">EMR Summaries</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert type="error">{errorMsg}</Alert>
      )}

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs uppercase font-bold text-slate-400">Total Audit Events</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalRecords}</div>
          <span className="text-xs text-slate-500">3-year statutory DPDP retention</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs uppercase font-bold text-slate-400">Governed AI Actions</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">100% HITL</div>
          <span className="text-xs text-slate-500">Zero autonomous diagnosis</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs uppercase font-bold text-slate-400">De-Identification</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">ACTIVE</div>
          <span className="text-xs text-slate-500">PII stripped at proxy layer</span>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900">
            Audit Trail Ledger
          </CardTitle>
          <span className="text-xs text-slate-500">
            Page {page} of {Math.max(1, totalPages)}
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-2">
              <Spinner size="lg" />
              <span className="text-xs text-slate-500">Loading audit log entries...</span>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Patient / UHID</TableHead>
                    <TableHead>Audit Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-slate-50 text-xs">
                      <TableCell className="font-mono text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {log.actorUserId?.fullName || 'System Staff'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {log.actorRole}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.patientId ? (
                          <span className="font-medium text-slate-800">
                            {log.patientId.fullName} ({log.patientId.uhid})
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono text-[11px] max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              No compliance audit events recorded matching current filter.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
