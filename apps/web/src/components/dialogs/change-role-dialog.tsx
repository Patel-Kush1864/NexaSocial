'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { useWorkspaceMembers } from '@/hooks/use-workspace';

interface ChangeRoleDialogProps {
  workspaceId: string;
  memberId: string;
  currentRole: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({
  workspaceId,
  memberId,
  currentRole,
  memberName,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const { updateRole } = useWorkspaceMembers(workspaceId);
  const [role, setRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === currentRole) {
      onOpenChange(false);
      return;
    }
    try {
      setIsSubmitting(true);
      await updateRole({ workspaceId, memberId, role });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Change Role</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update the workspace role and permissions for {memberName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="change-role">New Role</Label>
            <select
              id="change-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-background border border-input text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              <option value="MANAGER">Manager (Full edit & account management)</option>
              <option value="CREATOR">Creator (Schedule streams & posts)</option>
              <option value="VIEWER">Viewer (Read-only analytics)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || role === currentRole}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
