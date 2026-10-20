'use client';

import { PageHeader } from '@/components/shared/page-header';

export default function MediaPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Media Library"
        description="Upload, organize, and manage your images and videos."
      />
      <div className="flex flex-col items-center justify-center p-12 border rounded-xl glass-panel text-center">
        <h2 className="text-xl font-bold mb-2">Media Library Coming Soon</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The media asset management interface is currently under construction. Check back soon to upload your assets!
        </p>
      </div>
    </div>
  );
}
