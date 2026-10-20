import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe this is an error, please contact your workspace administrator.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
