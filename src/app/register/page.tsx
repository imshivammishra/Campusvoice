'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

// Self-registration is disabled — accounts are created by an administrator
// (higher authority) only. This route now redirects to the sign-in page.
export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex items-center gap-2 text-[13px] font-medium text-[#6e6e73]">
        <Spinner className="h-4 w-4" />
        Redirecting to sign in…
      </div>
    </div>
  );
}
