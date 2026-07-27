import type { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl glass-panel border-dashed border-border/80 space-y-4 max-w-lg mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold shadow-md shadow-violet-500/20"
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
