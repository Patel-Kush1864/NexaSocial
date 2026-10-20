'use client';

import { useState } from 'react';
import { useAdminUsers } from '@/hooks/use-admin';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  UsersHeader,
  UsersTable,
  ChangeRoleDialog,
} from '@/components/users';
import { AdminTableToolbar, FilterConfig } from '@/components/admin/shared/admin-table-toolbar';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRoleId, setSelectedUserRoleId] = useState<string>('');

  const {
    data,
    isLoading,
    updateStatus,
    updateRole,
  } = useAdminUsers({ page, limit, search, status, role, sortBy, sortOrder });

  const users = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  const handleActivate = (id: string) => updateStatus({ id, status: 'ACTIVE' });
  const handleSuspend = (id: string) => updateStatus({ id, status: 'SUSPENDED' });
  const handleDeactivate = (id: string) => updateStatus({ id, status: 'DEACTIVATED' });

  const openRoleDialog = (id: string, currentRoleId: string) => {
    setSelectedUserId(id);
    setSelectedUserRoleId(currentRoleId);
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = async (newRoleId: string) => {
    if (selectedUserId) {
      await updateRole({ id: selectedUserId, roleId: newRoleId });
    }
    setRoleDialogOpen(false);
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

  const filters: FilterConfig[] = [
    { id: 'search', type: 'search' },
    {
      id: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
        { label: 'Deactivated', value: 'DEACTIVATED' },
      ],
    },
    {
      id: 'role',
      type: 'select',
      placeholder: 'All Roles',
      options: [
        { label: 'Super Admin', value: 'SUPER_ADMIN' },
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Workspace Owner', value: 'WORKSPACE_OWNER' },
        { label: 'Manager', value: 'MANAGER' },
        { label: 'Creator', value: 'CREATOR' },
        { label: 'Viewer', value: 'VIEWER' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <UsersHeader total={total} />

      <AdminTableToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={filters}
        filterValues={{ status, role }}
        onFilterChange={(id, val) => {
          if (id === 'status') setStatus(val);
          if (id === 'role') setRole(val);
          setPage(1);
        }}
        onClearFilters={() => {
          setSearch('');
          setStatus('');
          setRole('');
          setPage(1);
        }}
        searchPlaceholder="Search users by name or email..."
      />

      {isLoading ? (
        <LoadingSpinner size="lg" label="Loading system users..." />
      ) : (
        <UsersTable
          users={users}
          isLoading={isLoading}
          onActivate={handleActivate}
          onSuspend={handleSuspend}
          onDeactivate={handleDeactivate}
          onChangeRole={openRoleDialog}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      )}

      {total > 0 && (
        <AdminPagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      <ChangeRoleDialog
        isOpen={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        currentRoleId={selectedUserRoleId}
        onConfirm={handleConfirmRoleChange}
      />
    </div>
  );
}
