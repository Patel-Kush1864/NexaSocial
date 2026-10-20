import { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { AuditLogsClient } from '@/components/admin/audit-logs/audit-logs-client';

export const metadata: Metadata = {
  title: 'Audit Logs | NexaSocial Admin',
  description: 'View security and administrative activity history across the platform',
};

export default function AuditLogsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Audit Logs
          </h2>
          <p className="text-muted-foreground">
            Security and administrative activity history
          </p>
        </div>
      </div>
      <AuditLogsClient />
    </div>
  );
}
