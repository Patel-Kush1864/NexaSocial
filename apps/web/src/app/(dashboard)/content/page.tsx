'use client';

import { PageHeader } from '@/components/shared/page-header';

export default function ContentPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Content Management"
        description="Create, schedule, and manage your social media posts."
      />
      <div className="flex flex-col items-center justify-center p-12 border rounded-xl glass-panel text-center">
        <h2 className="text-xl font-bold mb-2">Content Planner Coming Soon</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The content scheduling and management interface is currently under construction. Check back soon!
        </p>
      </div>
    </div>
  );
}
