'use client';

import { useState } from 'react';
import { formatDateSafe } from '@/lib/utils';
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
import { Search, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAdminLogins, SecurityEvent } from '@/hooks/use-security';
import { Badge } from '@/components/ui/badge';
import { SecurityEventDetailsDrawer } from './security-event-details-drawer';

export function AdminLoginsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useAdminLogins({
    page,
    limit: 15,
    search: search || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search admin logins..."
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
              <TableHead>Admin Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>User Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Failed to load admin logins.
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No admin logins found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((evt) => (
                <TableRow 
                  key={evt.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEvent(evt)}
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDateSafe(evt.createdAt || (evt as any).created_at, 'dd MMM yyyy, hh:mm a')}
                  </TableCell>
                  <TableCell className="font-medium">{evt.userEmail || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {evt.metadata?.role || 'UNKNOWN'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{evt.ipAddress || 'Unknown IP'}</TableCell>
                  <TableCell className="truncate max-w-[200px] text-xs text-muted-foreground">
                    {evt.userAgent || '-'}
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

      <SecurityEventDetailsDrawer 
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}
