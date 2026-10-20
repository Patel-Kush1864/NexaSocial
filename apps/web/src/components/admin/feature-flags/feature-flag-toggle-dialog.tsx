'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToggleFeatureFlag } from '@/hooks/use-feature-flags';
import { AlertTriangle } from 'lucide-react';

interface FeatureFlagToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag: any;
}

export function FeatureFlagToggleDialog({ open, onOpenChange, flag }: FeatureFlagToggleDialogProps) {
  const toggleMutation = useToggleFeatureFlag();

  if (!flag) return null;

  const willBeEnabled = !flag.isEnabled;
  const displayName = flag.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  const handleConfirm = () => {
    toggleMutation.mutate(
      { key: flag.name, enabled: willBeEnabled },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!willBeEnabled && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            {willBeEnabled ? 'Enable' : 'Disable'} {displayName}?
          </DialogTitle>
          <DialogDescription className="space-y-2 mt-2">
            <p>
              This will {willBeEnabled ? 'enable' : 'disable'} the {displayName} functionality across the platform.
            </p>
            {!willBeEnabled && (
              <p className="text-muted-foreground">
                Existing data and history will NOT be deleted. This only controls the availability of the feature.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={toggleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className={!willBeEnabled ? 'bg-red-500 hover:bg-red-600' : ''}
            disabled={toggleMutation.isPending}
          >
            {toggleMutation.isPending ? 'Updating...' : willBeEnabled ? 'Enable Feature' : 'Disable Feature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
