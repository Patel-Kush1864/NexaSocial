import { Metadata } from 'next';
import { SystemHealthClient } from '@/components/admin/system-health/system-health-client';

export const metadata: Metadata = {
  title: 'System Health | NexaSocial Admin',
  description: 'Monitor NexaSocial infrastructure and services.',
};

export default function SystemHealthPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
      </div>
      <SystemHealthClient />
    </div>
  );
}
