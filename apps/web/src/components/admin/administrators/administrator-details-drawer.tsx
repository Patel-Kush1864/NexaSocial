'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useAdministratorDetails, useUpdateAdministratorRole, useUpdateAdministratorStatus } from '@/hooks/use-administrators';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  adminId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdministratorDetailsDrawer({ adminId, open, onOpenChange }: Props) {
  const { data: admin, isLoading } = useAdministratorDetails(adminId || '');
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateAdministratorRole();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateAdministratorStatus();

  const [roleConfirmState, setRoleConfirmState] = useState<{ open: boolean; newRole: string }>({ open: false, newRole: '' });
  const [statusConfirmState, setStatusConfirmState] = useState<{ open: boolean; newStatus: string }>({ open: false, newStatus: '' });

  if (!open || !adminId) return null;

  const handleRoleChange = (newRole: string | null) => {
    if (newRole && newRole !== admin?.role?.name) {
      setRoleConfirmState({ open: true, newRole });
    }
  };

  const handleStatusChange = (newStatus: string | null) => {
    if (newStatus && newStatus !== admin?.status) {
      setStatusConfirmState({ open: true, newStatus });
    }
  };

  const confirmRoleChange = () => {
    updateRole({ id: adminId, role: roleConfirmState.newRole });
    setRoleConfirmState({ open: false, newRole: '' });
  };

  const confirmStatusChange = () => {
    updateStatus({ id: adminId, status: statusConfirmState.newStatus });
    setStatusConfirmState({ open: false, newStatus: '' });
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Administrator Details</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-8">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          ) : admin ? (
            <>
              {/* Profile Section */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div>{admin.firstName} {admin.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{admin.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Created At</div>
                    <div>{format(new Date(admin.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
                  </div>
                </div>
              </section>

              {/* Access Section */}
              <section className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Access & Status</h3>
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Platform Role</div>
                    <Select value={admin.role?.name} onValueChange={handleRoleChange} disabled={isUpdatingRole}>
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Account Status</div>
                    <Select value={admin.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Permissions Section */}
              <section className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Role Permissions</span>
                  <Badge variant="secondary">{admin.role?.permissions?.length || 0} Total</Badge>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-4 border rounded-md bg-muted/20">
                  {admin.role?.permissions?.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-xs font-mono">{p.key}</span>
                    </div>
                  ))}
                  {(!admin.role?.permissions || admin.role.permissions.length === 0) && (
                    <div className="text-sm text-muted-foreground col-span-2">No permissions found.</div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="text-center text-muted-foreground">Failed to load details</div>
          )}
        </div>
      </div>

      {/* Role Confirmation */}
      <Dialog open={roleConfirmState.open} onOpenChange={(open) => setRoleConfirmState(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Change Administrator Role?
            </DialogTitle>
            <DialogDescription>
              {roleConfirmState.newRole === 'SUPER_ADMIN' 
                ? 'Promoting this user to SUPER_ADMIN grants them full platform control, including managing other administrators.'
                : 'Demoting this user from SUPER_ADMIN to ADMIN will revoke their ability to manage platform administrators. NexaSocial must retain at least one active SUPER_ADMIN.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleConfirmState({ open: false, newRole: '' })}>Cancel</Button>
            <Button onClick={confirmRoleChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Confirmation */}
      <Dialog open={statusConfirmState.open} onOpenChange={(open) => setStatusConfirmState(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Change Account Status?
            </DialogTitle>
            <DialogDescription>
              {statusConfirmState.newStatus === 'ACTIVE'
                ? 'Activating this administrator will restore their platform access.'
                : 'Suspending or deactivating this administrator will revoke their platform access immediately. If this is the final active SUPER_ADMIN, the action will be rejected by the server.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirmState({ open: false, newStatus: '' })}>Cancel</Button>
            <Button onClick={confirmStatusChange} className={statusConfirmState.newStatus !== 'ACTIVE' ? 'bg-red-500 hover:bg-red-600' : ''}>
              Confirm Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
