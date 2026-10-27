'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSocialAccounts } from '@/hooks/use-social';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { queryKeys } from '@/lib/query-client';
import { PageHeader } from '@/components/shared/page-header';
import { SocialAccountCard } from '@/components/cards/social-account-card';
import { ConnectPlatformCard } from '@/components/cards/connect-platform-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { SocialPlatform } from '@/types';

const ALL_PLATFORMS: SocialPlatform[] = [
  'YOUTUBE',
  'INSTAGRAM',
  'FACEBOOK',
  'X',
];

export function SocialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceStore();
  const { hasPermission } = useAuthStore();
  const { entitlements } = useSubscriptionEntitlements();
  const canManage =
    hasPermission('social_accounts.manage') ||
    hasPermission('workspace.social_accounts.manage');
  const canConnect =
    hasPermission('social_accounts.connect') ||
    hasPermission('workspace.social_accounts.manage');

  const { accounts, platforms, isLoading, refetch, connect, sync, disconnect } = useSocialAccounts(
    currentWorkspace?.id,
  );

  const maxAccounts = entitlements?.features?.socialAccounts;
  const isUnlimited = maxAccounts === -1;
  const isLimitReached =
    !isUnlimited &&
    typeof maxAccounts === 'number' &&
    accounts.length >= maxAccounts;

  // Build platform active/enabled status map from API
  const platformStatusMap = new Map<string, boolean>();
  (platforms || []).forEach((p: any) => {
    const rawKey = (p.id || p.name || '').toUpperCase();
    const canonicalKey = rawKey === 'TWITTER' ? 'X' : rawKey;
    const isEnabled = p.isEnabled ?? p.isActive ?? true;
    platformStatusMap.set(canonicalKey, Boolean(isEnabled));
  });

  useEffect(() => {
    console.log('[SocialPage] Workspace state:', currentWorkspace);
    console.log('[SocialPage] Accounts list state:', accounts);
    console.log('[SocialPage] Platforms state:', platforms);
  }, [currentWorkspace, accounts, platforms]);

  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam) {
      const platformName =
        connectedParam.toLowerCase() === 'youtube'
          ? 'YouTube'
          : connectedParam.charAt(0).toUpperCase() + connectedParam.slice(1);
      console.log(`[SocialPage] Connected parameter detected: ${connectedParam} -> Refetching channels...`);
      toast.success(`${platformName} channel connected successfully!`);
      
      // Invalidate query cache and force an immediate refetch
      if (currentWorkspace?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.social.accounts(currentWorkspace.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['social'] });
      refetch();

      router.replace('/social');
    } else if (errorParam) {
      console.error(`[SocialPage] OAuth connection error detected:`, errorParam);
      toast.error(`Account connection failed: ${errorParam}`);
      router.replace('/social');
    }
  }, [searchParams, router, refetch, queryClient, currentWorkspace?.id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading connected social channels..." />;
  }

  const connectedPlatformKeys = new Set(
    accounts.map((a) => {
      const p = (a.platform || '').toUpperCase();
      return p === 'TWITTER' ? 'X' : p;
    }),
  );
  const availablePlatforms = ALL_PLATFORMS.filter(
    (p) => !connectedPlatformKeys.has(p),
  );

  const hasDisabledPlatform = availablePlatforms.some(
    (pKey) => platformStatusMap.get(pKey) === false,
  );

  const badgeText = entitlements?.planName
    ? `${accounts.length} / ${isUnlimited ? '∞' : maxAccounts} Channels (${entitlements.planName})`
    : `${accounts.length} Connected`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Social Accounts"
        description="Connect and manage your social channels across all major platforms."
        badge={badgeText}
      />

      {isLimitReached && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You have reached your social account limit ({accounts.length} of {maxAccounts}) for the{' '}
              <strong>{entitlements?.planName || 'current'}</strong> plan. Upgrade your plan to connect more channels.
            </span>
          </div>
          <Button
            asChild
            size="sm"
            className="text-xs bg-amber-500 text-black hover:bg-amber-400 font-semibold"
          >
            <a href="/billing">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Upgrade Plan
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      )}

      {/* Read-Only Notice for non-managers */}
      {!canManage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <span>
            You are viewing this workspace as a{' '}
            <strong>{currentWorkspace?.role || 'VIEWER'}</strong>. Social channel
            management (connecting, syncing, and disconnecting) is restricted to
            workspace owners and managers.
          </span>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Connected Channels ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border-dashed border-border/60">
            <p className="text-sm font-semibold text-foreground">No channels connected yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {canConnect
                ? 'Select a platform below to initiate OAuth connection.'
                : 'No social channels have been connected by the workspace owner yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => {
              const accKey = (acc.platform || '').toUpperCase();
              const canonicalKey = accKey === 'TWITTER' ? 'X' : accKey;
              const isPlatformDisabled = platformStatusMap.has(canonicalKey)
                ? platformStatusMap.get(canonicalKey) === false
                : false;

              return (
                <SocialAccountCard
                  key={acc.id}
                  account={acc}
                  isPlatformDisabled={isPlatformDisabled}
                  onSync={
                    canManage
                      ? (id) =>
                          sync({
                            accountId: id,
                            workspaceId: currentWorkspace?.id || '',
                          })
                      : undefined
                  }
                  onDisconnect={
                    canManage
                      ? (id) =>
                          disconnect({
                            accountId: id,
                            workspaceId: currentWorkspace?.id || '',
                          })
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Available Platforms to Connect (Restricted to canConnect) */}
      {canConnect && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Connect More Channels</h3>
            {hasDisabledPlatform && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                <AlertTriangle className="w-3.5 h-3.5" />
                Platforms disabled by platform administrator cannot be connected
              </span>
            )}
          </div>
          {!currentWorkspace ? (
            <div className="p-6 text-center glass-panel rounded-xl border-dashed border-border/60 bg-muted/20">
              <p className="text-sm font-semibold text-foreground">No workspace selected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please create or select a workspace first to connect social media accounts.
              </p>
            </div>
          ) : isLimitReached ? (
            <div className="p-8 text-center glass-panel rounded-xl border border-destructive/40 bg-destructive/10">
              <p className="text-sm font-semibold text-foreground">
                Channel Limit Reached ({accounts.length} / {maxAccounts})
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                To connect additional platforms, please upgrade your subscription plan.
              </p>
              <Button asChild className="bg-primary text-primary-foreground font-semibold">
                <a href="/billing">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Upgrade Subscription Plan
                </a>
              </Button>
            </div>
          ) : availablePlatforms.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-xl border border-border/60 bg-muted/10">
              <p className="text-sm font-semibold text-foreground">
                All supported channels are connected!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You have connected all available platforms (YouTube, Facebook, Instagram, and X).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlatforms.map((pKey) => {
                const isPlatformDisabled = platformStatusMap.has(pKey)
                  ? platformStatusMap.get(pKey) === false
                  : false;

                return (
                  <ConnectPlatformCard
                    key={pKey}
                    platformKey={pKey}
                    isDisabled={isPlatformDisabled}
                    disabledReason="Disabled by platform administrator"
                    onConnect={(p) => {
                      if (isPlatformDisabled) {
                        toast.error('This social platform has been disabled by the administrator.');
                        return;
                      }
                      connect({ platform: p, workspaceId: currentWorkspace.id });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SocialPage;
