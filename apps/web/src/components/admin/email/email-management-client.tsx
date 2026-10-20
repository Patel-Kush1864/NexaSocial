/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  EmailStatusResult,
  EmailStatsResult,
  EmailLogItem,
} from '@/services/admin.service';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  ShieldCheck,
  Search,
  RotateCw,
  Eye,
  Check,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function EmailManagementClient() {
  // State
  const [status, setStatus] = useState<EmailStatusResult | null>(null);
  const [stats, setStats] = useState<EmailStatsResult | null>(null);
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [searchRecipient, setSearchRecipient] = useState<string>('');

  // Loading flags
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Modals
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch status & stats
  const fetchStatusAndStats = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const [statusRes, statsRes] = await Promise.all([
        adminService.getEmailStatus(),
        adminService.getEmailStats(),
      ]);
      setStatus(statusRes);
      setStats(statsRes);
    } catch (err: any) {
      toast.error('Failed to load email server status: ' + (err.message || 'Error'));
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await adminService.getEmailLogs({
        page,
        limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        eventType: eventFilter !== 'ALL' ? eventFilter : undefined,
        recipient: searchRecipient.trim() || undefined,
      });
      setLogs(res.logs || []);
      setTotalLogs(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error('Failed to fetch email logs: ' + (err.message || 'Error'));
    } finally {
      setLoadingLogs(false);
    }
  }, [page, limit, statusFilter, eventFilter, searchRecipient]);

  useEffect(() => {
    fetchStatusAndStats();
  }, [fetchStatusAndStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Actions
  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error('Please enter a recipient email address');
      return;
    }
    setSendingTest(true);
    try {
      const res = await adminService.sendTestEmail(testEmailAddress.trim());
      if (res.success) {
        toast.success(`Test email sent to ${testEmailAddress}! Check your inbox.`);
        setTestModalOpen(false);
        setTestEmailAddress('');
        fetchStatusAndStats();
        fetchLogs();
      } else {
        toast.error(res.message || 'Failed to send test email');
      }
    } catch (err: any) {
      toast.error('Failed to send test email: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingTest(false);
    }
  };

  const handleRetryEmail = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await adminService.retryEmail(id);
      if (res.success) {
        toast.success('Email re-sent successfully!');
        if (selectedLog?.id === id) {
          setDetailsModalOpen(false);
        }
        fetchStatusAndStats();
        fetchLogs();
      } else {
        toast.error(res.message || 'Retry delivery failed');
      }
    } catch (err: any) {
      toast.error('Retry error: ' + (err.response?.data?.message || err.message));
    } finally {
      setRetryingId(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Actions ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-500" /> Email Notification System
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time SMTP transport health, automated event tracking, and delivery logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStatusAndStats();
              fetchLogs();
            }}
            disabled={loadingStatus || loadingLogs}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus || loadingLogs ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setTestModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test Email
          </Button>
        </div>
      </div>

      {/* ── Server Status & Health ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Connection Card */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>SMTP Connection</span>
              <Server className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status?.isConnected ? (
                <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Connected & Ready
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-500 font-medium text-sm">
                  <XCircle className="w-4 h-4" /> {status?.error ? 'Connection Failed' : 'Verifying...'}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              <div>Host: <span className="font-mono text-foreground">{status?.host || 'smtp.gmail.com'}</span></div>
              <div>Port: <span className="font-mono text-foreground">{status?.port || 587}</span> (TLS)</div>
              <div>User: <span className="font-mono text-foreground truncate block">{status?.user || 'nexasocial101@gmail.com'}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Total & Delivery Rate */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Total Dispatched</span>
              <Layers className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.total ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-normal">
                {stats?.rate ?? 100}% Delivery Rate
              </Badge>
              <span className="text-xs text-muted-foreground">
                {stats?.sent ?? 0} delivered
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Failed & Retries */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Failed Deliveries</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tracking-tight ${(stats?.failed || 0) > 0 ? 'text-rose-500' : 'text-foreground'}`}>
              {stats?.failed ?? 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {(stats?.failed || 0) > 0 ? (
                <span className="text-rose-400">Retryable with 1-click</span>
              ) : (
                <span>Zero delivery errors</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skipped / Idempotent */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Duplicate Prevented</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-indigo-400">
              {stats?.skipped ?? 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Idempotency checks & Unsubscribes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Active Architecture Badges ───────────────────────────── */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-medium text-foreground">Configured Reminders:</span>
          <span className="text-muted-foreground">Subscription Expiry (7d, 3d, 1d) &bull; Scheduled Livestreams &bull; Payment Receipts</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
            BullMQ Queue Active
          </Badge>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Idempotency Guard Enabled
          </Badge>
          <Badge variant="outline" className="border-border text-muted-foreground">
            Zero-Token Logging Policy
          </Badge>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Email Delivery Logs</CardTitle>
              <CardDescription className="text-xs">
                History of automated emails dispatched across all domain events.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search Recipient */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search recipient..."
                  value={searchRecipient}
                  onChange={(e) => setSearchRecipient(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Delivered (SENT)</option>
                <option value="FAILED">Failed</option>
                <option value="SKIPPED">Skipped (Duplicate)</option>
                <option value="PENDING">Pending</option>
              </select>

              {/* Event Type Filter */}
              <select
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px]"
              >
                <option value="ALL">All Event Types</option>
                <option value="user.registered">user.registered</option>
                <option value="user.email_verification">user.email_verification</option>
                <option value="user.password_reset">user.password_reset</option>
                <option value="user.password_changed">user.password_changed</option>
                <option value="subscription.activated">subscription.activated</option>
                <option value="subscription.expiring_soon">subscription.expiring_soon</option>
                <option value="subscription.cancelled">subscription.cancelled</option>
                <option value="payment.succeeded">payment.succeeded</option>
                <option value="payment.failed">payment.failed</option>
                <option value="livestream.scheduled">livestream.scheduled</option>
                <option value="livestream.started">livestream.started</option>
                <option value="social.connected">social.connected</option>
                <option value="workspace.invitation_created">workspace.invitation_created</option>
                <option value="admin.test">admin.test</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[110px] text-xs">Status</TableHead>
                  <TableHead className="text-xs">Recipient</TableHead>
                  <TableHead className="text-xs">Event Type</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Sent / Logged At</TableHead>
                  <TableHead className="w-[90px] text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading email records...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                      No email events found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const statusBadge = {
                      SENT: (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[11px] font-normal gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Delivered
                        </Badge>
                      ),
                      FAILED: (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-[11px] font-normal gap-1">
                          <XCircle className="w-3 h-3" /> Failed
                        </Badge>
                      ),
                      SKIPPED: (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[11px] font-normal gap-1">
                          <AlertTriangle className="w-3 h-3" /> Skipped
                        </Badge>
                      ),
                      PENDING: (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[11px] font-normal gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </Badge>
                      ),
                    }[log.status] || <Badge variant="outline">{log.status}</Badge>;

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/20">
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs text-foreground font-medium truncate max-w-[200px]" title={log.recipient}>
                            {log.recipient}
                          </div>
                          {log.userId && (
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                              UID: {log.userId.slice(0, 8)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 font-normal">
                            {log.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <div className="text-xs truncate text-foreground" title={log.subject}>
                            {log.subject}
                          </div>
                          {log.idempotencyKey && (
                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                              <span>key: {log.idempotencyKey.slice(0, 16)}...</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.sentAt ? (
                            new Date(log.sentAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            new Date(log.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailsModalOpen(true);
                              }}
                              title="View event details"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            {log.status === 'FAILED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                onClick={() => handleRetryEmail(log.id)}
                                disabled={retryingId === log.id}
                                title="Retry delivery"
                              >
                                <RotateCw className={`w-3.5 h-3.5 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div>
              Showing {logs.length} of {totalLogs} total events
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loadingLogs}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loadingLogs}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Test Email Dialog ────────────────────────────────────── */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Send className="w-4 h-4 text-indigo-500" /> Send Test Verification Email
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dispatches a branded NexaSocial test template using the configured SMTP server (Gmail 587) to verify real-time email delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Recipient Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g. admin@nexasocial.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="text-xs"
                autoFocus
              />
            </div>
            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/60">
              This will record an <code className="text-indigo-400 font-mono">admin.test</code> entry in the audit log and confirm transport latency.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestModalOpen(false)}
              disabled={sendingTest}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {sendingTest ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" /> Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Log Details Modal ────────────────────────────────────── */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Mail className="w-4 h-4 text-indigo-500" /> Email Event Log Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Full execution record, delivery metadata, and idempotency status.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Event Type</span>
                  <span className="font-mono font-medium text-foreground">{selectedLog.eventType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Delivery Status</span>
                  <span className="font-semibold">{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recipient</span>
                  <span className="font-mono text-foreground">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Retry Count</span>
                  <span className="text-foreground">{selectedLog.retryCount} of 3 attempts</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Subject</span>
                  <span className="font-medium text-foreground">{selectedLog.subject}</span>
                </div>
              </div>

              {selectedLog.idempotencyKey && (
                <div className="bg-muted/20 p-2.5 rounded border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Idempotency Key</span>
                    <span className="font-mono text-[11px] text-foreground">{selectedLog.idempotencyKey}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCopy(selectedLog.idempotencyKey!)}
                  >
                    {copiedKey === selectedLog.idempotencyKey ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded text-rose-400">
                  <span className="font-semibold block text-[11px] mb-0.5">Error Message:</span>
                  <p className="font-mono text-[11px] break-all">{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">Attached Metadata (Sanitized)</span>
                  <pre className="bg-muted/40 p-2.5 rounded border border-border/60 text-[11px] font-mono overflow-x-auto max-h-36">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selectedLog?.status === 'FAILED' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => selectedLog && handleRetryEmail(selectedLog.id)}
                disabled={retryingId === selectedLog?.id}
                className="text-xs gap-1.5"
              >
                <RotateCw className={`w-3 h-3 ${retryingId === selectedLog?.id ? 'animate-spin' : ''}`} />
                Retry Email Now
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
