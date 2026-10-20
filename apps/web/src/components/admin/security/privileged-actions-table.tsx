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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RotateCcw, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { usePrivilegedActions } from '@/hooks/use-security';
import { AuditLog } from '@/hooks/use-audit';
import { Badge } from '@/components/ui/badge';
import { AuditLogDetailsDrawer } from '@/components/admin/audit-logs/audit-log-details-drawer';

export function PrivilegedActionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = usePrivilegedActions({
    page,
    limit: 15,
    search: search || undefined,
  });

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search privileged actions..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
          <RotateCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Failed to load privileged actions.
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No privileged actions found.
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
                    {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </TableCell>
                  <TableCell>
                    {log.adminUser ? (
                      <div>
                        <p className="font-medium">{log.adminUser.firstName} {log.adminUser.lastName}</p>
                        <p className="text-xs text-muted-foreground">{log.adminUser.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs text-purple-500 border-purple-500/20 bg-purple-500/10">
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
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
            onClick={() => setPage(p => Math.max(data.totalPages, p + 1))}
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
