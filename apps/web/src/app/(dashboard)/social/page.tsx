'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSocialAccounts } from '@/hooks/use-social';
import { PageHeader } from '@/components/shared/page-header';
import { SocialAccountCard } from '@/components/cards/social-account-card';
import { ConnectPlatformCard } from '@/components/cards/connect-platform-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { toast } from 'sonner';
import type { SocialPlatform } from '@/types';

const ALL_PLATFORMS: SocialPlatform[] = [
  'YOUTUBE',
  'FACEBOOK',
  'INSTAGRAM',
  'LINKEDIN',
  'X',
  'TWITCH',
  'TIKTOK',
];

export function SocialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const { accounts, isLoading, connect, sync, disconnect } = useSocialAccounts(
    currentWorkspace?.id,
  );

  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam) {
      const platformName =
        connectedParam.toLowerCase() === 'youtube'
          ? 'YouTube'
          : connectedParam.charAt(0).toUpperCase() + connectedParam.slice(1);
      toast.success(`${platformName} channel connected successfully!`);
      router.replace('/social');
    } else if (errorParam) {
      toast.error(`Account connection failed: ${errorParam}`);
      router.replace('/social');
    }
  }, [searchParams, router]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading connected social channels..." />;
  }

  const connectedPlatformKeys = new Set(accounts.map((a) => a.platform));
  const availablePlatforms = ALL_PLATFORMS.filter(
    (p) => !connectedPlatformKeys.has(p) || p === 'FACEBOOK', // Facebook supports connecting multiple pages
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePlatforms.map((pKey) => (
            <ConnectPlatformCard
              key={pKey}
              platformKey={pKey}
              onConnect={(p) => connect({ platform: p, workspaceId: currentWorkspace?.id || '' })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SocialPage;
