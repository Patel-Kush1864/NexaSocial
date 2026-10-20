'use client';

import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format-currency';
import { format } from 'date-fns';
import { useSubscriptionDetails, usePlatformSubscriptions } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SubscriptionDetailsDrawerProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDetailsDrawer({
  id,
  open,
  onOpenChange,
}: SubscriptionDetailsDrawerProps) {
  const { data: sub, isLoading } = useSubscriptionDetails(id || '');
  const { cancelSubscription } = usePlatformSubscriptions();

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      await cancelSubscription(id!);
      onOpenChange(false);
    }
  };

  if (!id) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6" side="right">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Subscription Details</h2>
          <p className="text-sm text-muted-foreground">
            ID: {id}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Loading details...
          </div>
        ) : sub ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
              <Badge variant="outline">{sub.status}</Badge>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Workspace & Owner</h4>
              <div className="font-medium">{sub.workspace?.name || 'No Workspace'}</div>
              <div className="text-sm mt-1">{sub.owner?.name}</div>
              <div className="text-sm text-muted-foreground">{sub.owner?.email}</div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Plan Information</h4>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{sub.plan?.name || 'Unknown'}</span>
                <span>{formatCurrency(sub.price, sub.currency)} / {sub.billingCycle?.toLowerCase()}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Billing Period</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-muted-foreground mb-1">Current Period Start</span>
                  {sub.currentPeriodStart ? format(new Date(sub.currentPeriodStart), 'dd MMM yyyy') : 'N/A'}
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1">Current Period End</span>
                  {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy') : 'N/A'}
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1">Next Renewal</span>
                  {sub.nextRenewal ? format(new Date(sub.nextRenewal), 'dd MMM yyyy') : 'N/A'}
                </div>
              </div>
            </div>

            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Dates</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-muted-foreground mb-1">Created At</span>
                  {sub.createdAt ? format(new Date(sub.createdAt), 'dd MMM yyyy HH:mm') : 'N/A'}
                </div>
                {sub.canceledAt && (
                  <div>
                    <span className="block text-muted-foreground mb-1">Canceled At</span>
                    {format(new Date(sub.canceledAt), 'dd MMM yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {sub.status === 'ACTIVE' && (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            Failed to load subscription details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
