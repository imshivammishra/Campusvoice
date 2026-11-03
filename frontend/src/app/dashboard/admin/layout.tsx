'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/rbac';
import { Spinner } from '@/components/ui';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user && canAccessAdmin(user.permissions)) {
      setAllowed(true);
    } else {
      setAllowed(false);
      router.replace('/dashboard');
    }
  }, [router]);

  if (allowed !== true) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span className="text-sm">
            {allowed === false
              ? 'You do not have access to administration.'
              : 'Checking access…'}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
