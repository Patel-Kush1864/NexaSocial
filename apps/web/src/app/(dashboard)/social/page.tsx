'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSocialAccounts } from '@/hooks/use-social';
import { queryKeys } from '@/lib/query-client';
import { PageHeader } from '@/components/shared/page-header';
import { SocialAccountCard } from '@/components/cards/social-account-card';
import { ConnectPlatformCard } from '@/components/cards/connect-platform-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
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
  const { accounts, isLoading, refetch, connect, sync, disconnect } = useSocialAccounts(
    currentWorkspace?.id,
  );

  useEffect(() => {
    console.log('[SocialPage] Workspace state:', currentWorkspace);
    console.log('[SocialPage] Accounts list state:', accounts);
  }, [currentWorkspace, accounts]);

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Social Accounts"
        description="Connect and manage your social channels across all major platforms."
        badge={`${accounts.length} Connected`}
      />

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Connected Channels ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border-dashed border-border/60">
            <p className="text-sm font-semibold text-foreground">No channels connected yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a platform below to initiate OAuth connection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => (
              <SocialAccountCard
                key={acc.id}
                account={acc}
                onSync={(id) => sync({ accountId: id, workspaceId: currentWorkspace?.id || '' })}
                onDisconnect={(id) =>
                  disconnect({ accountId: id, workspaceId: currentWorkspace?.id || '' })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Available Platforms to Connect */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h3 className="text-lg font-bold">Connect More Channels</h3>
        {!currentWorkspace ? (
          <div className="p-6 text-center glass-panel rounded-xl border-dashed border-border/60 bg-muted/20">
            <p className="text-sm font-semibold text-foreground">No workspace selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please create or select a workspace first to connect social media accounts.
            </p>
          </div>
        ) : availablePlatforms.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-xl border border-border/60 bg-muted/10">
            <p className="text-sm font-semibold text-foreground">All supported channels are connected!</p>
            <p className="text-xs text-muted-foreground mt-1">
              You have connected all available platforms (YouTube, Facebook, Instagram, and X).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlatforms.map((pKey) => (
              <ConnectPlatformCard
                key={pKey}
                platformKey={pKey}
                onConnect={(p) => connect({ platform: p, workspaceId: currentWorkspace.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialPage;
