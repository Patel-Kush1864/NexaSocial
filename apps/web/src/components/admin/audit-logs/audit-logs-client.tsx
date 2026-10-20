'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RotateCcw, ShieldAlert, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { useAuditLogs, AuditLog } from '@/hooks/use-audit';
import { Badge } from '@/components/ui/badge';
import { AuditLogDetailsDrawer } from './audit-log-details-drawer';

const MODULES = [
  'SYSTEM',
  'Users',
  'Workspaces',
  'Plans',
  'Subscriptions',
  'Payments',
  'Reports',
  'Social Platforms',
  'Settings',
];

export function AuditLogsClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useAuditLogs({
    page,
    limit: 15,
    search: search || undefined,
    module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
    action: actionFilter !== 'ALL' ? actionFilter : undefined,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setSearch('');
    setModuleFilter('ALL');
    setActionFilter('ALL');
    setPage(1);
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={moduleFilter} onValueChange={(val) => setModuleFilter(val || 'ALL')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Modules</SelectItem>
              {MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefetching}
            title="Refresh"
          >
            <RotateCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mb-2 text-destructive" />
                    <p>Failed to load audit logs. Please ensure you have permission.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-muted-foreground">No audit logs found.</p>
                  {(search || moduleFilter !== 'ALL' || actionFilter !== 'ALL') && (
                    <Button variant="link" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((log: AuditLog) => (
                <TableRow 
                  key={log.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLogId(log.id)}
                >
                  <TableCell className="whitespace-nowrap">
                    {log.createdAt && !isNaN(new Date(log.createdAt).getTime())
                      ? format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {log.adminUser ? (
                      <div>
                        <p className="font-medium">{log.adminUser.firstName} {log.adminUser.lastName}</p>
                        <p className="text-xs text-muted-foreground">{log.adminUser.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">System / Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell>
                    {log.targetName || (log.targetType ? `${log.targetType} #${log.targetId}` : '-')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages || isLoading}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      <AuditLogDetailsDrawer 
        logId={selectedLogId} 
        open={!!selectedLogId}
        onOpenChange={(open) => {
          if (!open) setSelectedLogId(null);
        }}
      />
    </div>
  );
}
