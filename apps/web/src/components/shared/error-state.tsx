import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Error',
  message,
  onRetry,
  retryLabel = 'Retry',
  compact = false,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl glass-panel space-y-4 mx-auto ${
        compact ? 'p-6 max-w-sm' : 'p-12 border-dashed border-destructive/50 bg-destructive/5 max-w-lg my-6'
      } ${className}`}
    >
      <div
        className={`rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive ${
          compact ? 'w-12 h-12' : 'w-16 h-16'
        }`}
      >
        <AlertCircle className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
      </div>
      <div className="space-y-1.5">
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold tracking-tight text-destructive`}>{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          size={compact ? 'sm' : 'default'}
          className="border-destructive/20 hover:bg-destructive/10 text-destructive mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
