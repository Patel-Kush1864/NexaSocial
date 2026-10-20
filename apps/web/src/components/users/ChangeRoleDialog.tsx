import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// TODO: Fetch these dynamically from API in future
const ROLES = [
  { id: '1', name: 'SUPER_ADMIN' },
  { id: '2', name: 'ADMIN' },
  { id: '3', name: 'WORKSPACE_OWNER' },
  { id: '4', name: 'MANAGER' },
  { id: '5', name: 'CREATOR' },
  { id: '6', name: 'VIEWER' },
];

interface ChangeRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoleId: string;
  onConfirm: (roleId: string) => void;
  isLoading?: boolean;
}

export function ChangeRoleDialog({
  isOpen,
  onClose,
  currentRoleId,
  onConfirm,
  isLoading,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState(currentRoleId);

  // Update selected role if the prop changes
  React.useEffect(() => {
    if (isOpen) setSelectedRole(currentRoleId);
  }, [isOpen, currentRoleId]);

  const handleConfirm = () => {
    onConfirm(selectedRole);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Select a new role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
