import { Metadata } from 'next';
import { AdministratorsClient } from '@/components/admin/administrators/administrators-client';

export const metadata: Metadata = {
  title: 'Administrator Management | NexaSocial',
  description: 'Manage platform administrators, roles, status, and permissions.',
};

export default function AdministratorsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administrators</h2>
          <p className="text-muted-foreground">
            Manage NexaSocial platform administrators, roles, status, and permissions.
          </p>
        </div>
      </div>
      <AdministratorsClient />
    </div>
  );
}
