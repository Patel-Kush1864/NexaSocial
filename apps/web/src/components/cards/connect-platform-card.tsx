'use client';

import type { SocialPlatform } from '@/types';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ConnectPlatformCardProps {
  platformKey: SocialPlatform;
  onConnect: (platform: SocialPlatform) => void;
}

export function ConnectPlatformCard({ platformKey, onConnect }: ConnectPlatformCardProps) {
  const config = PLATFORM_CONFIG[platformKey] || {
    name: platformKey,
    icon: '🌐',
    gradient: 'from-gray-600 to-gray-800',
  };

  return (
    <Card className="glass-panel border-dashed border-border/70 hover:border-primary/50 transition-all group">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${config.gradient} flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-105 transition-transform`}>
            {config.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold leading-none">{config.name}</h4>
            <p className="text-[11px] text-muted-foreground mt-1">Connect channel</p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onConnect(platformKey)}
          className="h-8 text-xs font-semibold bg-accent hover:bg-primary hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Connect
        </Button>
      </CardContent>
    </Card>
  );
}
