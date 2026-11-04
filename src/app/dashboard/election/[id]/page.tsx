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
    <div className="space-y-8">
      <Link
        href="/dashboard/election"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Opens
          </div>
          <p className="mt-2 font-medium">{formatDateTime(election.opensAt)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Closes
          </div>
          <p className="mt-2 font-medium">{formatDateTime(election.closesAt)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersRound className="h-4 w-4" />
            Participation
          </div>
          <p className="mt-2 font-medium">
            {election.totalParticipatingVoters || totalVotes} vote
            {(election.totalParticipatingVoters || totalVotes) === 1 ? '' : 's'}
            {election.totalEligibleVoters
              ? ` of ${election.totalEligibleVoters} eligible`
              : ''}
          </p>
        </Card>
      </div>

      {election.hasVoted && (
        <Card className="flex items-start gap-3 border-emerald-500/30 bg-emerald-500/5 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium">Your anonymous vote is recorded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your choice cannot be linked back to your account. Results are
              shown below.
            </p>
          </div>
        </Card>
      )}

      {!election.isEligible && (
        <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/5 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-muted-foreground">
            You can view this election, but only students in the election class
            are eligible to vote.
          </p>
        </Card>
      )}

      {election.status === 'certified' && election.winnerName && (
        <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 p-5">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Certified Class Representative</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {election.winnerName} has been certified as the CR for{' '}
              {election.className || 'this class'}.
            </p>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Candidates</h2>
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
                  className={`p-6 ${isWinner ? 'border-emerald-500/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={candidate.studentName || 'Candidate'}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="font-semibold">{candidate.studentName}</p>
                        <p className="text-xs text-muted-foreground">
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

                  {candidate.manifesto && (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {candidate.manifesto}
                    </p>
                  )}

                  {showResults ? (
                    <div className="mt-5 border-t border-border pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Votes</span>
                        <span className="font-semibold">
                          {candidate.votes || 0}
                          {totalVotes > 0
                            ? ` · ${Math.round(((candidate.votes || 0) / totalVotes) * 100)}%`
                            : ''}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
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
                    <div className="mt-5 border-t border-border pt-4">
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
                        <p className="text-xs text-muted-foreground">
                          {isMe
                            ? 'You cannot vote for yourself.'
                            : isOpen
                              ? 'Only eligible class students can vote.'
                              : 'Voting is not open.'}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {canManage && election.status !== 'certified' && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Election administration</p>
            <p className="text-sm text-muted-foreground">
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
