/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallbackRoute?: string;
}

export function PermissionGuard({
  children,
  permission,
  fallbackRoute = '/unauthorized',
}: PermissionGuardProps) {
  const router = useRouter();
  const { hasPermission, isLoading, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return; // Wait for auth to finish loading

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasPermission(permission)) {
      router.replace(fallbackRoute);
    } else {
      setIsChecking(false);
    }
  }, [isLoading, isAuthenticated, hasPermission, permission, router, fallbackRoute]);

  if (isLoading || isChecking) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
