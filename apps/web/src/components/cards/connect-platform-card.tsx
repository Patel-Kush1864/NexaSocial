'use client';

import type { SocialPlatform } from '@/types';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Ban } from 'lucide-react';

interface ConnectPlatformCardProps {
  platformKey: SocialPlatform;
  onConnect: (platform: SocialPlatform) => void;
  isDisabled?: boolean;
  disabledReason?: string;
}

export function ConnectPlatformCard({
  platformKey,
  onConnect,
  isDisabled = false,
  disabledReason = 'Platform disabled by administrator',
}: ConnectPlatformCardProps) {
  const config = PLATFORM_CONFIG[platformKey] || {
    name: platformKey,
    icon: '🌐',
    gradient: 'from-gray-600 to-gray-800',
  };

  return (
    <Card
      className={`glass-panel border-dashed transition-all group ${
        isDisabled
          ? 'border-border/40 bg-muted/10 opacity-75'
          : 'border-border/70 hover:border-primary/50'
      }`}
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${config.gradient} flex items-center justify-center text-white text-lg shadow-sm ${
              isDisabled
                ? 'grayscale opacity-60'
                : 'group-hover:scale-105 transition-transform'
            }`}
          >
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold leading-none">{config.name}</h4>
              {isDisabled && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] py-0 px-1.5 font-medium"
                >
                  Disabled by Admin
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isDisabled ? disabledReason : 'Connect channel'}
            </p>
          </div>
        </div>

        {isDisabled ? (
          <Button
            size="sm"
            disabled
            variant="outline"
            className="h-8 text-xs font-semibold border-border/40 text-muted-foreground opacity-60 cursor-not-allowed"
          >
            <Ban className="w-3.5 h-3.5 mr-1" />
            Disabled
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onConnect(platformKey)}
            className="h-8 text-xs font-semibold bg-accent hover:bg-primary hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
