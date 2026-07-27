'use client';

import type { PlanTier } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PlanCardProps {
  name: string;
  tier: PlanTier;
  price: number;
  interval: string;
  features: string[];
  isCurrent?: boolean;
  onSelect?: () => void;
}

export function PlanCard({
  name,
  tier,
  price,
  interval,
  features,
  isCurrent = false,
  onSelect,
}: PlanCardProps) {
  const isPopular = tier === 'PRO';

  return (
    <Card
      className={`glass-panel border-border/50 relative flex flex-col justify-between transition-all ${
        isPopular
          ? 'ring-2 ring-violet-500 border-violet-500/60 shadow-xl shadow-violet-500/10'
          : 'hover:border-primary/40'
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md">
          Most Popular
        </span>
      )}

      <CardHeader className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-extrabold">{name}</CardTitle>
          {isCurrent && (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
              Current Plan
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Ideal for growing creators and media agencies.
        </CardDescription>

        <div className="flex items-baseline gap-1 pt-2">
          <span className="text-3xl font-black tracking-tight">${price}</span>
          <span className="text-xs text-muted-foreground">/{interval.toLowerCase()}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2.5 pt-2 border-t border-border/40">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-foreground/90">{feat}</span>
            </div>
          ))}
        </div>

        <Button
          disabled={isCurrent}
          onClick={onSelect}
          className={`w-full h-10 text-xs font-semibold ${
            isCurrent
              ? 'bg-accent text-muted-foreground'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20'
          }`}
        >
          {isCurrent ? 'Current Active Plan' : `Upgrade to ${name}`}
        </Button>
      </CardContent>
    </Card>
  );
}
