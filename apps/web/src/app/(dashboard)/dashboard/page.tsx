'use client';

import { useAuthStore } from '@/stores/auth-store';
import { PlatformDashboard } from './components/platform-dashboard';
import { WorkspaceDashboard } from './components/workspace-dashboard';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { scope, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading dashboard..." />;
  }

  if (scope === 'PLATFORM') {
    return <PlatformDashboard />;
  }

  if (scope === 'WORKSPACE') {
    return <WorkspaceDashboard />;
  }

  return (
    <div className="text-center py-16 space-y-4">
      <h2 className="text-xl font-bold">Unable to determine account scope</h2>
      <p className="text-sm text-muted-foreground">
        Your account scope is invalid or unsupported. Please refresh or contact support.
      </p>
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    </div>
  );
}
