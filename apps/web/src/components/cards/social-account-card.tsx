'use client';

import type { SocialAccount } from '@/types';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SocialAccountCardProps {
  account: SocialAccount;
  onSync: (id: string) => void;
  onDisconnect: (id: string) => void;
}

export function SocialAccountCard({ account, onSync, onDisconnect }: SocialAccountCardProps) {
  const config = PLATFORM_CONFIG[account.platform] || {
    name: account.platform,
    icon: '🌐',
    gradient: 'from-gray-600 to-gray-800',
  };

  return (
    <Card className="glass-panel border-border/50 shadow-md relative overflow-hidden group hover:border-primary/40 transition-all">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${config.gradient} flex items-center justify-center text-white text-lg shadow-md`}>
              {config.icon}
            </div>
            <div>
              <h4 className="text-sm font-bold leading-none">{account.accountName}</h4>
              <p className="text-[11px] text-muted-foreground mt-1">{config.name}</p>
            </div>
          </div>

          {account.isActive ? (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">
              <AlertCircle className="w-3 h-3 mr-1" />
              Expired
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30 text-muted-foreground">
          <div>
            <span className="font-bold text-foreground">
              {(account.followerCount || 0).toLocaleString()}
            </span>{' '}
            followers
          </div>
          <div className="text-[10px]">
            Synced{' '}
            {account.lastSyncedAt
              ? formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })
              : 'Recently'}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSync(account.id)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisconnect(account.id)}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
