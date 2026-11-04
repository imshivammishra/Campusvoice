'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Award,
  CalendarClock,
  CheckCircle2,
  Lock,
  ShieldCheck,
  UsersRound,
  Vote,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { fetchCurrentUser, getStoredUser, type AuthUser } from '@/lib/auth';
import { AUTHORITY_ROLES } from '@/lib/rbac';
import { formatDateTime } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  StatusBadge,
} from '@/components/ui';

export default function ElectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [election, setElection] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/elections/${id}`);
      setElection(data);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load election');
      setElection(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    fetchCurrentUser().then(setUser).catch(() => {});
  }, [load]);

  const castVote = async (candidateId: string) => {
    setVotingFor(candidateId);
    try {
      await apiRequest(`/elections/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ candidateId }),
      });
      toast.success('Your anonymous vote has been recorded');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Could not record your vote');
    } finally {
      setVotingFor('');
    }
  };

  const runAction = async (action: 'close' | 'certify') => {
    setBusy(true);
    try {
      await apiRequest(`/elections/${id}/${action}`, { method: 'POST' });
      toast.success(action === 'close' ? 'Election closed and winner calculated' : 'Result certified');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="space-y-8">
        <PageHeader title="Election not found" description="This election may have been removed." />
        <Link href="/dashboard/election">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to elections
          </Button>
        </Link>
      </div>
    );
  }

  const candidates: any[] = election.candidates || [];
  const isOpen = election.status === 'active';
  const showResults = election.hasVoted || ['closed', 'certified'].includes(election.status);
  const canManage =
    Boolean(user) &&
    (AUTHORITY_ROLES.includes(user!.role as any) || user!.role === 'SUPER_ADMIN');
  const myId = String((user as any)?.sub || (user as any)?._id || '');
  const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/election"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#71717a] transition-colors hover:text-[#09090b]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to elections
      </Link>

      <PageHeader
        title={election.title || 'CR Election'}
        description={`${election.className || 'Class election'} · ${
          election.status === 'active'
            ? 'Voting is open'
            : election.status?.replace(/_/g, ' ') || 'Election'
        }`}
      >
        <StatusBadge status={election.status} />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
            <CalendarClock className="h-3.5 w-3.5" />
            Opens
          </div>
          <p className="mt-2 text-[13px] font-medium text-[#09090b]">
            {formatDateTime(election.opensAt)}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
            <Lock className="h-3.5 w-3.5" />
            Closes
          </div>
          <p className="mt-2 text-[13px] font-medium text-[#09090b]">
            {formatDateTime(election.closesAt)}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
            <UsersRound className="h-3.5 w-3.5" />
            Participation
          </div>
          <p className="mt-2 text-[13px] font-medium text-[#09090b]">
            {election.totalParticipatingVoters || totalVotes} vote
            {(election.totalParticipatingVoters || totalVotes) === 1 ? '' : 's'}
            {election.totalEligibleVoters
              ? ` of ${election.totalEligibleVoters} eligible`
              : ''}
          </p>
        </Card>
      </div>

      {election.hasVoted && (
        <Card className="flex items-start gap-3.5 border-[#bbf7d0] bg-[#f0fdf4] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#bbf7d0] bg-white/60 text-[#15803d]">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium text-[#14532d]">
              Your anonymous vote is recorded
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#15803d]">
              Your choice cannot be linked back to your account. Results are
              shown below.
            </p>
          </div>
        </Card>
      )}

      {!election.isEligible && (
        <Card className="flex items-start gap-3.5 border-[#fde68a] bg-[#fffbeb] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#fde68a] bg-white/60 text-[#b45309]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <p className="text-[11.5px] leading-relaxed text-[#b45309]">
            You can view this election, but only students in the election class
            are eligible to vote.
          </p>
        </Card>
      )}

      {election.status === 'certified' && election.winnerName && (
        <Card className="flex items-start gap-3.5 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] text-[#0f4c81]">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium text-[#09090b]">
              Certified Class Representative
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#71717a]">
              {election.winnerName} has been certified as the CR for{' '}
              {election.className || 'this class'}.
            </p>
          </div>
        </Card>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-[14px] font-semibold text-[#09090b]">Candidates</h2>
          <span className="text-[11px] text-[#a1a1aa]">
            {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'}
          </span>
        </div>
        {candidates.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No candidates yet"
            description="Nominations have not been approved for this election."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((candidate) => {
              const candidateId = String(candidate.studentId?._id || candidate.studentId);
              const isMe = candidateId === myId;
              const isWinner =
                candidate.status === 'winner' ||
                (election.winnerName && candidate.studentName === election.winnerName);
              return (
                <Card
                  key={candidate._id}
                  className={`overflow-hidden p-0 ${isWinner ? 'border-[#bbf7d0]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        name={candidate.studentName || 'Candidate'}
                        className="h-9 w-9 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#09090b]">
                          {candidate.studentName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#a1a1aa]">
                          {isMe ? 'Your candidacy' : candidate.className || 'Student'}
                        </p>
                      </div>
                    </div>
                    {isWinner ? (
                      <Badge variant="success">Winner</Badge>
                    ) : (
                      <Badge variant="outline">Candidate</Badge>
                    )}
                  </div>

                  <div className="px-5 py-4">
                    {candidate.manifesto && (
                      <p className="text-[12.5px] leading-relaxed text-[#71717a]">
                        {candidate.manifesto}
                      </p>
                    )}

                    {showResults ? (
                      <div className="mt-4 border-t border-[#f4f4f5] pt-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#a1a1aa]">Votes</span>
                          <span className="font-medium tabular-nums text-[#09090b]">
                            {candidate.votes || 0}
                            {totalVotes > 0
                              ? ` · ${Math.round(((candidate.votes || 0) / totalVotes) * 100)}%`
                              : ''}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4f4f5]">
                          <div
                            className="h-full rounded-full bg-[#0f4c81]"
                            style={{
                              width: `${
                                totalVotes > 0
                                  ? Math.round(((candidate.votes || 0) / totalVotes) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border-t border-[#f4f4f5] pt-4">
                        {isOpen && election.isEligible && !isMe ? (
                          <Button
                            className="w-full"
                            loading={votingFor === candidate._id}
                            disabled={Boolean(votingFor)}
                            onClick={() => castVote(candidate._id)}
                          >
                            <Vote className="h-4 w-4" />
                            Vote for {candidate.studentName?.split(' ')[0] || 'candidate'}
                          </Button>
                        ) : (
                          <p className="text-[11px] leading-relaxed text-[#a1a1aa]">
                            {isMe
                              ? 'You cannot vote for yourself.'
                              : isOpen
                                ? 'Only eligible class students can vote.'
                                : 'Voting is not open.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {canManage && election.status !== 'certified' && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12.5px] font-medium text-[#09090b]">
              Election administration
            </p>
            <p className="mt-1 text-[11.5px] text-[#71717a]">
              Close the poll to calculate the winner, then certify the result.
            </p>
          </div>
          <div className="flex gap-2">
            {election.status === 'active' && (
              <Button variant="outline" loading={busy} onClick={() => runAction('close')}>
                Close election
              </Button>
            )}
            <Button loading={busy} onClick={() => runAction('certify')}>
              Certify result
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
