'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Vote } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Card,
  EmptyState,
  ListSkeleton,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

function VoteBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-medium text-[#3f3f46]">{label}</span>
        <span className="tabular-nums text-[#a1a1aa]">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#f4f4f5]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function VotingPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/proposals')
      .then((data: any) => {
        const items = data?.data || (Array.isArray(data) ? data : []);
        setSessions(
          items.filter((p: any) =>
            ['voting_active', 'voting_closed', 'approved_for_voting'].includes(
              p.status,
            ),
          ),
        );
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voting"
        description="Cast anonymous votes on open proposals and elections."
      />

      <Card className="flex items-start gap-3.5 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] text-[#0071e3]">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[12.5px] font-medium text-[#09090b]">
            One vote per person, anonymous by design
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#71717a]">
            Open proposals and concerns appear here. Open any item to cast your
            vote — you can&apos;t vote on your own submission, and your choice is
            never linked back to your account.
          </p>
        </div>
      </Card>

      {loading ? (
        <ListSkeleton count={2} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No open voting sessions"
          description="When a proposal or election opens for voting, it will appear here for you to participate anonymously."
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const support = s.supportVotes || 0;
            const oppose = s.opposeVotes || 0;
            const abstain = s.abstainVotes || 0;
            const total = support + oppose + abstain;
            const closed = s.status === 'voting_closed';
            return (
              <Link key={s._id || s.sessionId} href={`/dashboard/proposals/${s._id}`}>
                <Card hover className="group overflow-hidden p-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                        Anonymous ballot / {s.type?.replace(/_/g, ' ') || 'Campus record'}
                      </p>
                      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#09090b]">
                        {s.title || 'Voting session'}
                      </h3>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div className="px-5 py-4">
                    {s.description && (
                      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[#71717a]">
                        {s.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-3 border-t border-[#f4f4f5] pt-4">
                      <VoteBar
                        label="Support"
                        value={support}
                        total={total}
                        color="bg-[#0071e3]"
                      />
                      <VoteBar
                        label="Oppose"
                        value={oppose}
                        total={total}
                        color="bg-[#d70015]"
                      />
                      <VoteBar
                        label="Abstain"
                        value={abstain}
                        total={total}
                        color="bg-[#a1a1aa]"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#f4f4f5] pt-3">
                      <span className="text-[11px] text-[#a1a1aa]">
                        {total} {total === 1 ? 'ballot' : 'ballots'} recorded
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0071e3]">
                        {closed ? 'View final record' : 'Open to cast your vote'}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
