'use client';

import { useState } from 'react';
import { AdministratorTable } from './administrator-table';
import { CreateAdministratorDialog } from './create-administrator-dialog';
import { AdministratorDetailsDrawer } from './administrator-details-drawer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdministrators } from '@/hooks/use-administrators';
import { Search } from 'lucide-react';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';

export function AdministratorsClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAdministrators({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
    sortBy,
    sortOrder,
  });

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search administrators..."
              className="pl-8"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || 'ALL'); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v || 'ALL'); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Administrator
        </Button>
      </div>

      <AdministratorTable 
        data={data?.data || []} 
        isLoading={isLoading} 
        isError={isError}
        onSelectAdmin={setSelectedAdminId}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {data?.pagination && data.pagination.total > 0 && (
        <AdminPagination
          page={page}
          limit={limit}
          total={data.pagination.total}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      <CreateAdministratorDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />

      <AdministratorDetailsDrawer 
        adminId={selectedAdminId}
        open={!!selectedAdminId}
        onOpenChange={(open) => {
          if (!open) setSelectedAdminId(null);
        }}
      />
    </div>
  );
}
