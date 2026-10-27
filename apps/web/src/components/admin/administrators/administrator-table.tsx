'use client';

import { formatDateSafe } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';

interface AdministratorTableProps {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  onSelectAdmin: (id: string) => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function AdministratorTable({ data, isLoading, isError, onSelectAdmin, onSort, sortBy, sortOrder }: AdministratorTableProps) {
  const getRoleBadge = (roleName: string) => {
    if (roleName === 'SUPER_ADMIN') {
      return <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20">SUPER ADMIN</Badge>;
    }
    return <Badge variant="outline">ADMIN</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">ACTIVE</Badge>;
      case 'SUSPENDED': return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20">SUSPENDED</Badge>;
      case 'INACTIVE': return <Badge variant="secondary">INACTIVE</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead 
                label="Administrator" 
                sortKey="name" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <SortableTableHead 
                label="Role" 
                sortKey="role" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <SortableTableHead 
                label="Status" 
                sortKey="status" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <SortableTableHead 
                label="Created" 
                sortKey="createdAt" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Failed to load administrators.
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No administrators found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(admin.role?.name)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(admin.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateSafe(admin.createdAt || admin.created_at, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onSelectAdmin(admin.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
