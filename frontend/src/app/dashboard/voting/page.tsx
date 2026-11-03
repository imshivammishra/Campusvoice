'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Vote } from 'lucide-react';
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
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
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
    <div className="space-y-8">
      <PageHeader
        title="Voting"
        description="Cast anonymous votes on open proposals and elections."
      />

      <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Open proposals and concerns appear here. Open any item to cast your
          vote — one vote per person, and you can&apos;t vote on your own
          submission.
        </p>
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
            return (
              <Link key={s._id || s.sessionId} href={`/dashboard/proposals/${s._id}`}>
                <Card hover className="p-6 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground">
                      {s.title || 'Voting session'}
                    </h3>
                    <StatusBadge status={s.status} />
                  </div>
                  {s.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-5 space-y-3 border-t border-border pt-4">
                    <VoteBar
                      label="Support"
                      value={support}
                      total={total}
                      color="bg-emerald-500"
                    />
                    <VoteBar
                      label="Oppose"
                      value={oppose}
                      total={total}
                      color="bg-red-500"
                    />
                    <VoteBar
                      label="Abstain"
                      value={abstain}
                      total={total}
                      color="bg-muted-foreground"
                    />
                  </div>
                  <p className="mt-4 text-xs font-medium text-primary">
                    Open to cast your vote →
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
