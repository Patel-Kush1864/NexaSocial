'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function FacebookOAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const msg = errorDescription || error || 'Facebook authorization failed';
      router.replace(`/social?error=${encodeURIComponent(msg)}`);
      return;
    }

    if (!code) {
      router.replace('/social?error=No authorization code returned');
      return;
    }

    // Forward to backend callback handler
    const backendApiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Direct browser navigation to backend callback so NestJS process redirect cleanly
    const callbackUrl = `${backendApiUrl}/auth/facebook/callback?code=${encodeURIComponent(
      code,
    )}&state=${encodeURIComponent(state || '')}`;

    window.location.href = callbackUrl;
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <h2 className="text-xl font-semibold">Connecting Facebook Account...</h2>
        <p className="text-sm text-slate-400">
          Authenticating with Meta and saving Facebook Page credentials securely.
        </p>
      </div>
    </div>
  );
}
