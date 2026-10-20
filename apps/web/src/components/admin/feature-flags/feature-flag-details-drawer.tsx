'use client';

import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface FeatureFlagDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag: any;
}

export function FeatureFlagDetailsDrawer({ open, onOpenChange, flag }: FeatureFlagDetailsDrawerProps) {
  if (!flag) return null;
  const displayName = flag.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[400px] overflow-y-auto p-6" side="right">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <Badge variant={flag.isEnabled ? 'default' : 'secondary'} className={flag.isEnabled ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
              {flag.isEnabled ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {flag.description || 'No description provided.'}
          </p>
        </div>

        <Separator className="my-6" />

        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Internal Key</h4>
            <code className="text-sm bg-muted px-2 py-1 rounded">{flag.name}</code>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Current Status</h4>
            <p className="text-sm font-medium">{flag.isEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
            <p className="text-sm">
              {flag.updatedAt && !isNaN(new Date(flag.updatedAt).getTime())
                ? format(new Date(flag.updatedAt), 'PPpp')
                : '-'}
            </p>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
            <p className="text-sm">
              {flag.createdAt && !isNaN(new Date(flag.createdAt).getTime())
                ? format(new Date(flag.createdAt), 'PPpp')
                : '-'}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
