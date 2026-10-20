import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { QuickActionConfig } from './quick-actions.config';

interface QuickActionCardProps {
  action: QuickActionConfig;
}

export function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon;
  
  return (
    <Link href={action.route} className="block group">
      <Card className="h-full border border-border/50 bg-card hover:bg-accent/5 transition-colors duration-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold leading-none">{action.label}</h4>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {action.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
