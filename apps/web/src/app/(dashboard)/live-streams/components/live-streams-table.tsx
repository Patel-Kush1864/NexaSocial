'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowUpDown, Video, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';

interface LiveStreamRow {
  id: string;
  title: string;
  status: string;
  platforms: { id: string; name: string; key: string }[];
  workspace: { id: string; name: string } | null;
  creator: { id: string; name: string; email: string } | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
  errors: { count: number; lastOccurredAt: string | null };
}

interface LiveStreamsTableProps {
  streams: LiveStreamRow[];
  isLoading: boolean;
  onSort: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onRowClick: (stream: LiveStreamRow) => void;
}

export function LiveStreamsTable({
  streams,
  isLoading,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
}: LiveStreamsTableProps) {

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'destructive';
      case 'SCHEDULED':
        return 'default';
      case 'ENDED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      case 'DRAFT':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getRelevantDate = (stream: LiveStreamRow) => {
    switch (stream.status) {
      case 'LIVE':
        return stream.startedAt ? (
          <div>
            Started
            <br />
            <span className="text-muted-foreground">{format(new Date(stream.startedAt), 'MMM d, yyyy HH:mm')}</span>
          </div>
        ) : 'N/A';
      case 'SCHEDULED':
        return stream.scheduledAt ? (
          <div>
            Scheduled
            <br />
            <span className="text-muted-foreground">{format(new Date(stream.scheduledAt), 'MMM d, yyyy HH:mm')}</span>
          </div>
        ) : 'N/A';
      case 'ENDED':
        return stream.endedAt ? (
          <div>
            Ended
            <br />
            <span className="text-muted-foreground">{format(new Date(stream.endedAt), 'MMM d, yyyy HH:mm')}</span>
          </div>
        ) : 'N/A';
      default:
        return stream.createdAt ? (
          <div>
            Created
            <br />
            <span className="text-muted-foreground">{format(new Date(stream.createdAt), 'MMM d, yyyy')}</span>
          </div>
        ) : 'N/A';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead 
              label="Stream" 
              sortKey="title" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort} 
            />
            <TableHead>Platform</TableHead>
            <SortableTableHead 
              label="Workspace" 
              sortKey="workspace" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort} 
            />
            <TableHead>Creator</TableHead>
            <SortableTableHead 
              label="Status" 
              sortKey="status" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort} 
            />
            <TableHead>Date</TableHead>
            <TableHead>Errors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Loading streams...
              </TableCell>
            </TableRow>
          ) : streams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No live streams match your filters.
              </TableCell>
            </TableRow>
          ) : (
            streams.map((stream) => (
              <TableRow
                key={stream.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(stream)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{stream.title}</span>
                      <span className="text-xs text-muted-foreground">ID: {stream.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {stream.platforms.length > 0 ? (
                      stream.platforms.map((p) => (
                        <Badge key={p.id} variant="secondary" className="flex gap-1 items-center">
                          {p.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {stream.workspace ? (
                    <span className="font-medium">{stream.workspace.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell>
                  {stream.creator ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{stream.creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{stream.creator.name}</span>
                        <span className="text-xs text-muted-foreground">{stream.creator.email}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(stream.status)}>
                    {stream.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {getRelevantDate(stream)}
                </TableCell>
                <TableCell>
                  {stream.errors.count > 0 ? (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{stream.errors.count}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
