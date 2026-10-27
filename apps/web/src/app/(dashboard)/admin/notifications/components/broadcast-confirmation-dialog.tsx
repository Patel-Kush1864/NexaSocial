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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, CheckCircle2, Radio, Send, Loader2 } from 'lucide-react';

interface BroadcastConfirmationDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewData: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      <DialogContent className="w-[95vw] sm:max-w-[520px] p-0 overflow-hidden bg-background border border-border/80 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-destructive/5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Confirm Platform Broadcast
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Targeting <span className="font-semibold text-foreground">{previewData.targetType.replace('_', ' ')}</span>
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Recipient Count Highlight */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">Estimated Audience</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-primary font-mono text-base">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {previewData.recipientCount?.toLocaleString() || 0} Recipients
            </div>
          </div>

          {/* Details Card */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Type</span>
              <Badge variant="outline" className="font-semibold text-[11px]">
                {previewData.type}
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Title</span>
              <div className="font-semibold text-foreground text-sm">{previewData.title}</div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Message</span>
              <div className="bg-background/80 p-3 rounded-lg border border-border/50 text-muted-foreground text-xs leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                {previewData.message}
              </div>
            </div>
          </div>

          <div className="text-xs text-destructive font-medium bg-destructive/10 p-3.5 rounded-xl border border-destructive/20 flex gap-2.5 items-start">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <p className="leading-relaxed">
              Broadcasts immediately dispatch push notifications and inbox alerts across the entire selected userbase.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border/50 bg-card/60 backdrop-blur-md flex flex-row items-center justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending}
            variant="destructive"
            className="h-10 px-5 gap-2 font-semibold shadow-md shadow-destructive/20"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirm & Dispatch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
