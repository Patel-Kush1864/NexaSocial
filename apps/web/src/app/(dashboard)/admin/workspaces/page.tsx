'use client';

import { useState } from 'react';
import { useAdminWorkspaces } from '@/hooks/use-admin';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
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
import { Search, Building2, MoreHorizontal, ArrowRight, Eye, ShieldAlert, Archive, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { AdminTableToolbar, FilterConfig } from '@/components/admin/shared/admin-table-toolbar';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('platform.workspaces.manage');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const { data, isLoading, updateStatus } = useAdminWorkspaces({ page, limit, search, status, plan, sortBy, sortOrder });

  const workspaces = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus });
      toast.success(`Workspace status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update workspace status');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspace Management"
        description="Monitor system-wide workspaces, usage, and subscription plans."
        badge={`${total} Total`}
      />

      <AdminTableToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={[
          { id: 'search', type: 'search' },
          {
            id: 'status',
            type: 'select',
            placeholder: 'All Statuses',
            options: [
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Archived', value: 'ARCHIVED' },
            ],
          },
          {
            id: 'plan',
            type: 'select',
            placeholder: 'All Plans',
            options: [
              { label: 'Starter Plan', value: 'Starter Plan' },
              { label: 'Pro Plan', value: 'Pro Plan' },
              { label: 'Enterprise Plan', value: 'Enterprise Plan' },
            ],
          },
        ]}
        filterValues={{ status, plan }}
        onFilterChange={(id, val) => {
          if (id === 'status') setStatus(val);
          if (id === 'plan') setPlan(val);
          setPage(1);
        }}
        onClearFilters={() => {
          setSearch('');
          setStatus('');
          setPlan('');
          setPage(1);
        }}
        searchPlaceholder="Search workspaces or owners..."
      />

      <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <SortableTableHead 
                label="Workspace" 
                sortKey="name" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={handleSort} 
              />
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <SortableTableHead 
                label="Created" 
                sortKey="createdAt" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={handleSort} 
              />
              <SortableTableHead 
                label="Status" 
                sortKey="status" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={handleSort} 
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <LoadingSpinner size="md" label="Loading workspaces..." />
                </TableCell>
              </TableRow>
            ) : workspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  No workspaces found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              workspaces.map((ws: any) => (
                <TableRow key={ws.id} className="hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => router.push(`/admin/workspaces/${ws.id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {ws.logo ? <img src={ws.logo} className="w-full h-full rounded-lg object-cover" alt="" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{ws.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{ws.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="text-sm font-medium">{ws.owner?.name}</div>
                    <div className="text-xs text-muted-foreground">{ws.owner?.email}</div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {ws.subscription ? (
                      <div>
                        <div className="text-sm font-medium">{ws.subscription.planName}</div>
                        <div className="text-xs text-muted-foreground">{ws.subscription.status}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Free</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                    {dayjs(ws.createdAt).format('MMM D, YYYY')}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge className={
                      ws.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      ws.status === 'SUSPENDED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                      'bg-secondary text-secondary-foreground'
                    }>
                      {ws.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/admin/workspaces/${ws.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuSeparator />
                            {ws.status !== 'ACTIVE' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ws.id, 'ACTIVE')}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {ws.status !== 'SUSPENDED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ws.id, 'SUSPENDED')}>
                                <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {ws.status !== 'ARCHIVED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ws.id, 'ARCHIVED')}>
                                <Archive className="w-4 h-4 mr-2 text-muted-foreground" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />
    </div>
  );
}
