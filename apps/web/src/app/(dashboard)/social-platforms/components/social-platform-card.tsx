'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, CheckCircle2, ChevronRight, Power, ServerCrash, HelpCircle } from 'lucide-react';
import { useToggleSocialPlatform } from '@/hooks/use-admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SocialPlatformDetailsDrawer } from './social-platform-details-drawer';

interface SocialPlatformCardProps {
  platform: any;
}

export function SocialPlatformCard({ platform }: SocialPlatformCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleMutation = useToggleSocialPlatform();

  const handleToggle = async () => {
    await toggleMutation.mutateAsync({ id: platform.id, enabled: !platform.enabled });
    setIsConfirmOpen(false);
  };

  const getHealthIcon = () => {
    switch (platform.health) {
      case 'HEALTHY':
        return <CheckCircle2 className="mr-1 h-4 w-4" />;
      case 'DEGRADED':
        return <AlertCircle className="mr-1 h-4 w-4" />;
      case 'DOWN':
        return <ServerCrash className="mr-1 h-4 w-4" />;
      default:
        return <HelpCircle className="mr-1 h-4 w-4" />;
    }
  };

  const getHealthVariant = () => {
    switch (platform.health) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'DOWN':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">{platform.name}</CardTitle>
          <Badge variant={platform.enabled ? 'default' : 'secondary'} className={platform.enabled ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
            {platform.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Health:</span>
            <Badge variant={getHealthVariant() as any} className="flex items-center">
              {getHealthIcon()}
              {platform.health}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Connected</span>
              <span className="text-xl font-semibold">{platform.connectedAccounts}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                {platform.activeConnections}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">API Errors</span>
              <span className="flex items-center text-xl font-semibold text-destructive">
                {platform.apiErrors}
                {platform.apiErrors > 0 && <AlertCircle className="ml-1 h-4 w-4" />}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(true)}>
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            variant={platform.enabled ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            disabled={toggleMutation.isPending}
          >
            <Power className="mr-2 h-4 w-4" />
            {platform.enabled ? 'Disable' : 'Enable'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {platform.enabled ? `Disable ${platform.name}?` : `Enable ${platform.name}?`}
            </DialogTitle>
            <DialogDescription>
              {platform.enabled
                ? 'Disabling this platform may prevent new connections and platform operations. Existing connected account data will be preserved.'
                : 'Enabling this platform will allow users to connect new accounts and resume operations.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={toggleMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant={platform.enabled ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? 'Updating...' : platform.enabled ? 'Disable Platform' : 'Enable Platform'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SocialPlatformDetailsDrawer
        platform={platform}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </>
  );
}
