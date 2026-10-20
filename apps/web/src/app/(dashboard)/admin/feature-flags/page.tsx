import { Metadata } from 'next';
import FeatureFlagsClient from '@/components/admin/feature-flags/feature-flags-client';

export const metadata: Metadata = {
  title: 'Feature Flags | NexaSocial Admin',
  description: 'Manage platform-wide feature availability',
};

export default function FeatureFlagsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
        <p className="text-muted-foreground">
          Manage platform-wide feature availability.
        </p>
      </div>

      <FeatureFlagsClient />
    </div>
  );
}
