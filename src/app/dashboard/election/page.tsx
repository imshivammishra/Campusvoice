'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, CalendarClock, Play, Vote } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import { AUTHORITY_ROLES } from '@/lib/rbac';
import {
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

function canStartElections(user: AuthUser | null) {
  if (!user) return false;
  return (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'REGISTRAR' ||
    AUTHORITY_ROLES.includes(user.role as any) ||
    Boolean(user.permissions?.includes('elections:create'))
  );
}

export default function ElectionPage() {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const load = useCallback(() => {
    apiRequest('/elections')
      .then((data: any) => setElections(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
    load();
  }, [load]);

  const isAdmin = canStartElections(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CR Elections"
        description="Class Representative elections. A 24-hour vote opens automatically every Sunday, and a super admin can also start one manually."
      >
        {isAdmin && (
          <Link href="/dashboard/election/start">
            <Button>
              <Play className="h-4 w-4" />
              Start CR voting
            </Button>
          </Link>
        )}
      </PageHeader>

      {loading ? (
        <ListSkeleton count={2} />
      ) : elections.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No active elections"
          description={
            isAdmin
              ? 'No elections are open right now. Use “Start CR voting” to open a 24-hour vote, or wait for the automatic Sunday election.'
              : 'There are no elections open right now. New CR elections open automatically each week.'
          }
          action={
            isAdmin ? (
              <Link href="/dashboard/election/start">
                <Button>
                  <Play className="h-4 w-4" />
                  Start CR voting now
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <Link
              key={election._id || election.electionId}
              href={`/dashboard/election/${election._id || election.electionId}`}
            >
              <Card hover className="group overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e5ea] px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#86868b]">
                      CR election / {election.className || election.classId || 'Class'}
                    </p>
                    <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#1d1d1f]">
                      {election.title || 'CR Election'}
                    </h3>
                  </div>
                  <StatusBadge status={election.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 px-5 py-4">
                  <div className="rounded-[12px] border border-[#e5e5ea] bg-[#f5f5f7] px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#86868b]">
                      <CalendarClock className="h-3 w-3" />
                      Opens
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#424245]">
                      {formatDate(election.opensAt)}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e5ea] bg-[#f5f5f7] px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#86868b]">
                      <CalendarClock className="h-3 w-3" />
                      Closes
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#424245]">
                      {formatDate(election.closesAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#e5e5ea] px-5 py-3 text-[11.5px]">
                  <span className="text-[#86868b]">Anonymous ballot</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#0071e3]">
                    View candidates
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
