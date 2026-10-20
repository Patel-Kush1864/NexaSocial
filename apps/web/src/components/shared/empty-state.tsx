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
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl glass-panel space-y-4 mx-auto ${
        compact ? 'p-6 max-w-sm' : 'p-12 border-dashed border-border/80 max-w-lg my-6'
      } ${className}`}
    >
      <div
        className={`rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary ${
          compact ? 'w-12 h-12' : 'w-16 h-16'
        }`}
      >
        <Icon className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
      </div>
      <div className="space-y-1.5">
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold tracking-tight`}>{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={compact ? 'sm' : 'default'}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold shadow-md shadow-violet-500/20"
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
