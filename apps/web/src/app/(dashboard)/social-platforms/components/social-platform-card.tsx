'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, ChevronRight, Power, ServerCrash, HelpCircle } from 'lucide-react';
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

  const isEnabled = platform.enabled ?? platform.isEnabled ?? false;
  const platformName = platform.name || platform.platform || platform.key || 'Platform';
  const platformKey = (platform.key || platform.platform || platform.name || '').toUpperCase();
  const health = (platform.health || platform.status || 'UNKNOWN').toUpperCase();
  const connectedAccounts = platform.connectedAccounts ?? platform.connectedAccountsCount ?? 0;
  const activeConnections = platform.activeConnections ?? (connectedAccounts > 0 ? connectedAccounts : 0);
  const apiErrors = platform.apiErrors ?? 0;

  const handleToggle = async () => {
    await toggleMutation.mutateAsync({ id: platform.id, enabled: !isEnabled });
    setIsConfirmOpen(false);
  };

  const getHealthBadge = () => {
    switch (health) {
      case 'HEALTHY':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
            Healthy
          </Badge>
        );
      case 'DEGRADED':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium">
            <AlertCircle className="mr-1 h-3.5 w-3.5 text-amber-500" />
            Degraded
          </Badge>
        );
      case 'DOWN':
        return (
          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-medium">
            <ServerCrash className="mr-1 h-3.5 w-3.5 text-rose-500" />
            Down
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 font-medium">
            <HelpCircle className="mr-1 h-3.5 w-3.5 text-slate-400" />
            {health === 'UNKNOWN' ? 'Unconfigured' : health}
          </Badge>
        );
    }
  };

  const getPlatformBrandColor = () => {
    switch (platformKey) {
      case 'YOUTUBE':
        return 'text-red-500';
      case 'FACEBOOK':
        return 'text-blue-500';
      case 'INSTAGRAM':
        return 'text-pink-500';
      case 'X':
      case 'TWITTER':
        return 'text-sky-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <>
      <Card className="flex flex-col border-border/50 hover:border-border transition-colors glass-panel shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={`text-xl font-bold flex items-center gap-2 ${getPlatformBrandColor()}`}>
            {platformName}
          </CardTitle>
          <Badge
            variant={isEnabled ? 'default' : 'secondary'}
            className={isEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground'}
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-muted-foreground">Health:</span>
            {getHealthBadge()}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
            <div className="flex flex-col space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Connected</span>
              <span className="text-lg font-bold text-foreground">{connectedAccounts}</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Active</span>
              <span className="text-lg font-bold text-emerald-500">
                {activeConnections}
              </span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-[11px] text-muted-foreground">API Errors</span>
              <span className="flex items-center text-lg font-bold text-rose-500">
                {apiErrors}
                {apiErrors > 0 && <AlertCircle className="ml-1 h-3.5 w-3.5" />}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/40 p-4">
          <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(true)} className="hover:bg-muted/50">
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            variant={isEnabled ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            disabled={toggleMutation.isPending}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" />
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEnabled ? `Disable ${platformName}?` : `Enable ${platformName}?`}
            </DialogTitle>
            <DialogDescription>
              {isEnabled
                ? 'Disabling this platform may prevent new connections and broadcast operations. Existing connected account data will be preserved.'
                : 'Enabling this platform will allow users to connect new accounts and resume streaming operations.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={toggleMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant={isEnabled ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? 'Updating...' : isEnabled ? 'Disable Platform' : 'Enable Platform'}
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
