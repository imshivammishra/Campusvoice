'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Vote } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Card,
  EmptyState,
  ListSkeleton,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function ElectionPage() {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/elections')
      .then((data: any) => setElections(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CR Elections"
        description="Weekly Class Representative elections for your class."
      />

      {loading ? (
        <ListSkeleton count={2} />
      ) : elections.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No active elections"
          description="There are no elections open right now. New CR elections open automatically each week."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <Link
              key={election._id || election.electionId}
              href={`/dashboard/election/${election._id || election.electionId}`}
            >
              <Card hover className="group overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                      CR election / {election.className || election.classId || 'Class'}
                    </p>
                    <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#09090b]">
                      {election.title || 'CR Election'}
                    </h3>
                  </div>
                  <StatusBadge status={election.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 px-5 py-4">
                  <div className="rounded-[4px] border border-[#e4e4e7] bg-[#fafafa] px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                      <CalendarClock className="h-3 w-3" />
                      Opens
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#3f3f46]">
                      {formatDate(election.opensAt)}
                    </p>
                  </div>
                  <div className="rounded-[4px] border border-[#e4e4e7] bg-[#fafafa] px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                      <CalendarClock className="h-3 w-3" />
                      Closes
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#3f3f46]">
                      {formatDate(election.closesAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#e4e4e7] px-5 py-3 text-[11.5px]">
                  <span className="text-[#a1a1aa]">Anonymous ballot</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#0f4c81]">
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
