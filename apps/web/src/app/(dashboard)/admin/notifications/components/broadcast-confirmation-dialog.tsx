'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, CheckCircle2 } from 'lucide-react';

interface BroadcastConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: any;
  onConfirm: () => void;
  isSending: boolean;
}

export function BroadcastConfirmationDialog({
  open,
  onOpenChange,
  previewData,
  onConfirm,
  isSending,
}: BroadcastConfirmationDialogProps) {
  if (!previewData) return null;

  return (
    <Dialog open={open} onOpenChange={isSending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Confirm Broadcast
          </DialogTitle>
          <DialogDescription>
            You are about to send this notification to{' '}
            <span className="font-bold">
              {previewData.targetType.replace('_', ' ')}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 bg-muted/50 p-4 rounded-lg mt-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Estimated Recipients:</span>
            <span className="font-medium text-foreground">
              {previewData.recipientCount.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Type
            </div>
            <div className="text-sm font-medium">{previewData.type}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Title
            </div>
            <div className="text-sm font-medium">{previewData.title}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Message
            </div>
            <div className="text-sm bg-background p-3 rounded-md border text-muted-foreground">
              {previewData.message}
            </div>
          </div>
        </div>

        <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            This is a broadcast notification and may notify a large number of users.
            Please confirm that you want to continue.
          </p>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending}
            variant="destructive"
            className="gap-2"
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
