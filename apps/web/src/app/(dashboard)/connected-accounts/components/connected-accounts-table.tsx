'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, Link2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';

interface ConnectedAccount {
  id: string;
  platform: {
    id: string;
    name: string;
    key: string;
  };
  account: {
    name: string;
    username?: string;
    avatar?: string;
  };
  workspace: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  status: string;
  connectedAt: string;
  lastSync: string | null;
  errors: {
    count: number;
    lastOccurredAt: string | null;
  };
}

interface ConnectedAccountsTableProps {
  data: ConnectedAccount[];
  isLoading: boolean;
  onRowClick: (account: ConnectedAccount) => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function ConnectedAccountsTable({ data, isLoading, onRowClick, onSort, sortBy, sortOrder }: ConnectedAccountsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <SortableTableHead 
                label="Account" 
                sortKey="name" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <TableHead>Workspace / Owner</TableHead>
              <SortableTableHead 
                label="Status" 
                sortKey="status" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <SortableTableHead 
                label="Connection" 
                sortKey="createdAt" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <TableHead>Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No connected accounts match your criteria.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
      case 'ACTIVE':
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'TOKEN_EXPIRED':
      case 'EXPIRED':
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Disconnected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <SortableTableHead 
              label="Account" 
              sortKey="name" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead>Workspace / Owner</TableHead>
            <SortableTableHead 
              label="Status" 
              sortKey="status" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <SortableTableHead 
              label="Connection" 
              sortKey="createdAt" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead>Errors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((account) => (
            <TableRow 
              key={account.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(account)}
            >
              <TableCell className="font-medium">
                {account.platform.name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={account.account.avatar} alt={account.account.name} />
                    <AvatarFallback>{account.account.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{account.account.name}</span>
                    {account.account.username && (
                      <span className="text-xs text-muted-foreground">{account.account.username}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{account.workspace?.name || 'No Workspace'}</span>
                  <span className="text-xs text-muted-foreground">
                    {account.owner ? account.owner.name : 'Unknown Owner'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(account.status)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    {format(new Date(account.connectedAt), 'MMM d, yyyy')}
                  </span>
                  {account.lastSync ? (
                    <span className="text-xs mt-0.5">
                      Sync: {formatDistanceToNow(new Date(account.lastSync), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-xs mt-0.5">Sync: Not available</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {account.errors.count > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-destructive">{account.errors.count} errors</span>
                    {account.errors.lastOccurredAt && (
                      <span className="text-xs text-muted-foreground">
                        Last: {formatDistanceToNow(new Date(account.errors.lastOccurredAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">0</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
