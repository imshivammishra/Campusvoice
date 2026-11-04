'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  FileText,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Vote,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import { AUTHORITY_ROLES } from '@/lib/rbac';
import { Avatar, Progress, Skeleton, StatusBadge } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';

type DashboardData = {
  elections: any[];
  proposals: any[];
  notifications: any[];
  tickets: any[];
  spotlight: any | null;
  detail: any | null;
};

const QUICK_ACTIONS = [
  {
    title: 'Vote in an election',
    description: 'Open your class poll and candidate profiles.',
    href: '/dashboard/election',
    icon: Vote,
  },
  {
    title: 'Raise a concern',
    description: 'Submit an issue to the people responsible.',
    href: '/dashboard/concerns',
    icon: FileText,
  },
  {
    title: 'Explore proposals',
    description: 'Review what your campus is deciding.',
    href: '/dashboard/proposals',
    icon: Megaphone,
  },
  {
    title: 'Get private support',
    description: 'Confidential help from a welfare officer.',
    href: '/dashboard/support',
    icon: LifeBuoy,
  },
];

function extractList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function firstNameOf(user: AuthUser | null) {
  return (user?.fullName || user?.username || 'there').split(' ')[0];
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(value?: string) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

function timeLeft(target?: string, now = Date.now()) {
  if (!target) return '—';
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) return '—';
  const diff = end - now;
  if (diff <= 0) return 'Closed';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours >= 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatProposalMeta(proposal: any) {
  const category = String(proposal.category || proposal.type || 'Campus proposal')
    .replace(/_/g, ' ')
    .toLowerCase();
  const date = proposal.createdAt ? formatDate(proposal.createdAt) : '';
  return [category, date].filter(Boolean).join(' · ');
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setUser(getStoredUser());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [electionsResult, proposalsResult, notificationsResult, supportResult] =
        await Promise.allSettled([
          apiRequest('/elections'),
          apiRequest('/proposals'),
          apiRequest('/notifications'),
          apiRequest('/support'),
        ]);
      if (!active) return;

      const elections =
        electionsResult.status === 'fulfilled'
          ? extractList(electionsResult.value)
          : [];
      const proposals =
        proposalsResult.status === 'fulfilled'
          ? extractList(proposalsResult.value)
          : [];
      const notifications =
        notificationsResult.status === 'fulfilled'
          ? extractList(notificationsResult.value)
          : [];
      const tickets =
        supportResult.status === 'fulfilled'
          ? extractList(supportResult.value)
          : [];

      const spotlight =
        elections.find((election) => election.status === 'active') ||
        elections[0] ||
        null;

      let detail: any = null;
      if (spotlight?._id) {
        try {
          detail = await apiRequest(`/elections/${spotlight._id}`);
        } catch {
          detail = null;
        }
      }
      if (!active) return;

      setData({ elections, proposals, notifications, tickets, spotlight, detail });
    })();
    return () => {
      active = false;
    };
  }, []);

  const firstName = firstNameOf(user);
  const activeElections = useMemo(
    () => data?.elections.filter((election) => election.status === 'active') || [],
    [data?.elections],
  );
  const openProposals = useMemo(
    () =>
      data?.proposals.filter(
        (proposal) =>
          !['resolved', 'rejected', 'closed', 'passed', 'failed'].includes(
            String(proposal.status),
          ),
      ).length || 0,
    [data?.proposals],
  );
  const openProposalList = useMemo(
    () =>
      [...(data?.proposals || [])]
        .filter(
          (proposal) =>
            !['resolved', 'rejected', 'closed', 'passed', 'failed'].includes(
              String(proposal.status),
            ),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 3),
    [data?.proposals],
  );
  const unread = useMemo(
    () => data?.notifications.filter((notification) => !notification.isRead) || [],
    [data?.notifications],
  );
  const quickActions = useMemo(() => {
    const role = user?.role || '';
    const canBrowseProposals =
      role === 'TEACHER' || AUTHORITY_ROLES.includes(role as any);
    if (canBrowseProposals) return QUICK_ACTIONS;
    return QUICK_ACTIONS.map((action) =>
      action.href === '/dashboard/proposals'
        ? {
            ...action,
            title: 'Open voting',
            description: 'Cast anonymous votes on concerns and proposals.',
            href: '/dashboard/voting',
          }
        : action,
    );
  }, [user?.role]);
  const recent = useMemo(
    () =>
      [...(data?.notifications || [])]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 4),
    [data?.notifications],
  );

  const spotlight = data?.spotlight;
  const detail = data?.detail;
  const candidates: any[] = detail?.candidates || [];
  const totalVoters = Number(detail?.totalParticipatingVoters || 0);
  const eligibleVoters = Number(detail?.totalEligibleVoters || 0);
  const turnout =
    eligibleVoters > 0
      ? Math.min(100, Math.round((totalVoters / eligibleVoters) * 100))
      : 0;
  const hasVoted = Boolean(detail?.hasVoted);
  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + Number(candidate.votes || 0),
    0,
  );
  const proposalHref =
    user?.role === 'TEACHER' ||
    AUTHORITY_ROLES.includes((user?.role || '') as any)
      ? '/dashboard/proposals'
      : '/dashboard/voting';

  const dateLabel = new Date(now)
    .toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  const metrics = [
    {
      label: 'Live elections',
      value: data ? activeElections.length : '—',
      note: spotlight
        ? `Closes in ${timeLeft(spotlight.closesAt, now)}`
        : 'No active poll',
      icon: Vote,
    },
    {
      label: 'Open proposals',
      value: data ? openProposals : '—',
      note: 'Across your communities',
      icon: Megaphone,
    },
    {
      label: 'Unread notices',
      value: data ? unread.length : '—',
      note: unread.length ? 'Awaiting your attention' : 'Nothing outstanding',
      icon: Bell,
    },
    {
      label: 'Support threads',
      value: data ? data.tickets.length : '—',
      note: 'Private and confidential',
      icon: LifeBuoy,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-[#71717a]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateLabel}
            </span>
            <span className="text-[#d4d4d8]">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#248a3d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#248a3d]" />
              Live record
            </span>
            <span className="hidden text-[#d4d4d8] sm:inline">•</span>
            <span className="hidden capitalize sm:inline">
              {user?.role?.replace(/_/g, ' ').toLowerCase() || 'member'} workspace
            </span>
          </div>
          <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.035em] text-[#09090b] sm:text-[34px]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#52525b]">
            Here&apos;s what needs your attention across campus today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/concerns"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#d4d4d8] bg-white px-4 text-[12.5px] font-medium text-[#09090b] transition-colors hover:border-[#09090b] hover:bg-[#fafafa]"
          >
            <FileText className="h-4 w-4 text-[#71717a]" />
            Raise a concern
          </Link>
          {spotlight ? (
            <Link
              href={`/dashboard/election/${spotlight._id}`}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#0071e3] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#0077ed]"
            >
              {hasVoted ? 'View live results' : 'Open your ballot'}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard/election"
              className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#0071e3] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#0077ed]"
            >
              View elections
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-[16px] border border-[#e4e4e7] bg-white p-4 transition-colors duration-150 hover:border-[#a1a1aa] sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11.5px] font-medium text-[#71717a]">
                  {metric.label}
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] text-[#0071e3]">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-[#09090b] sm:text-[30px]">
                {metric.value}
              </p>
              <p className="mt-2 text-[11px] leading-snug text-[#a1a1aa]">
                {metric.note}
              </p>
            </div>
          );
        })}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
        <section className="overflow-hidden rounded-[16px] border border-[#e4e4e7] bg-white">
          {!data ? (
            <div className="p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-4 h-7 w-2/3" />
              <Skeleton className="mt-3 h-3 w-1/2" />
              <Skeleton className="mt-8 h-40 w-full" />
            </div>
          ) : spotlight ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e4e4e7] p-5 sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-[10px] border px-2 py-0.5 text-[10.5px] font-medium capitalize',
                        spotlight.status === 'active'
                          ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#248a3d]'
                          : 'border-[#e4e4e7] bg-[#fafafa] text-[#71717a]',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-[1px]',
                          spotlight.status === 'active'
                            ? 'bg-[#248a3d]'
                            : 'bg-[#a1a1aa]',
                        )}
                      />
                      {spotlight.status?.replace(/_/g, ' ') || 'Election'}
                    </span>
                    <span className="text-[11px] font-medium text-[#a1a1aa]">
                      {spotlight.className || 'Your class'} · Class representative
                    </span>
                  </div>
                  <h2 className="mt-3 text-[21px] font-semibold leading-snug tracking-[-0.02em] text-[#09090b]">
                    {spotlight.title || 'Class Representative Election'}
                  </h2>
                  <p className="mt-1 text-[12px] text-[#71717a]">
                    Closes {formatDate(spotlight.closesAt)} ·{' '}
                    <span className="font-medium text-[#3f3f46]">
                      {timeLeft(spotlight.closesAt, now)} remaining
                    </span>
                  </p>
                </div>
                <Link
                  href={`/dashboard/election/${spotlight._id}`}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[12px] border border-[#d4d4d8] bg-white px-3 text-[12px] font-medium text-[#09090b] transition-colors hover:border-[#09090b] hover:bg-[#fafafa]"
                >
                  {hasVoted ? 'View results' : 'Open ballot'}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid md:grid-cols-[minmax(0,1fr)_210px]">
                <div className="flex flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                    <span>Candidate</span>
                    <span>Votes</span>
                  </div>

                  {candidates.length > 0 ? (
                    <div>
                      {candidates.slice(0, 4).map((candidate, index) => {
                        const votes = Number(candidate.votes || 0);
                        const share = totalVotes
                          ? Math.round((votes / totalVotes) * 100)
                          : 0;
                        return (
                          <div
                            key={candidate._id || index}
                            className="flex items-center gap-3 border-b border-[#f4f4f5] py-3.5 last:border-0"
                          >
                            <Avatar
                              name={candidate.studentName || 'Candidate'}
                              className="h-8 w-8 shrink-0 text-[11px]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <p className="truncate text-[13px] font-medium text-[#09090b]">
                                  {candidate.studentName || 'Candidate'}
                                </p>
                                <span className="shrink-0 text-[12px] font-medium tabular-nums text-[#3f3f46]">
                                  {votes}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <Progress value={share} className="h-1" />
                                <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-[#a1a1aa]">
                                  {share}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {candidates.length > 4 && (
                        <Link
                          href={`/dashboard/election/${spotlight._id}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3] hover:underline"
                        >
                          All {candidates.length} candidates
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="py-6 text-[12px] leading-relaxed text-[#71717a]">
                      Candidate profiles will appear here once nominations are
                      confirmed.
                    </p>
                  )}

                  <div className="mt-auto pt-6">
                    <div className="rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] p-4">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#248a3d]" />
                        <div>
                          <p className="text-[11.5px] font-medium text-[#3f3f46]">
                            Your ballot is anonymous
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#71717a]">
                            Your vote is counted once and cannot be linked back
                            to your account.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-[12px] border border-[#e4e4e7] bg-white p-3">
                        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                          Opened
                        </p>
                        <p className="mt-1 text-[11.5px] font-medium text-[#3f3f46]">
                          {formatDate(spotlight.opensAt)}
                        </p>
                      </div>
                      <div className="rounded-[12px] border border-[#e4e4e7] bg-white p-3">
                        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                          Closes
                        </p>
                        <p className="mt-1 text-[11.5px] font-medium text-[#3f3f46]">
                          {formatDate(spotlight.closesAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="border-t border-[#e4e4e7] bg-[#fafafa] p-5 sm:p-6 md:border-l md:border-t-0">
                  <p className="text-[11px] font-medium text-[#71717a]">
                    Turnout
                  </p>
                  <p className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[#09090b]">
                    {turnout}
                    <span className="text-[18px] text-[#a1a1aa]">%</span>
                  </p>
                  <div className="mt-3 flex gap-[3px]" aria-hidden="true">
                    {Array.from({ length: 20 }).map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          'h-1.5 flex-1 rounded-[1px]',
                          index < Math.round(turnout / 5)
                            ? 'bg-[#0071e3]'
                            : 'bg-[#e4e4e7]',
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#a1a1aa]">
                    {eligibleVoters > 0
                      ? `${totalVoters} of ${eligibleVoters} eligible ballots cast`
                      : 'Awaiting the next live poll'}
                  </p>

                  <dl className="mt-4 space-y-2.5 border-t border-[#e4e4e7] pt-4 text-[11.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-[#71717a]">Your ballot</dt>
                      <dd
                        className={cn(
                          'font-medium',
                          hasVoted ? 'text-[#248a3d]' : 'text-[#b25000]',
                        )}
                      >
                        {hasVoted ? 'Recorded' : 'Not cast'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-[#71717a]">Candidates</dt>
                      <dd className="font-medium tabular-nums text-[#3f3f46]">
                        {candidates.length || '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-[#71717a]">Closes in</dt>
                      <dd className="font-medium tabular-nums text-[#3f3f46]">
                        {timeLeft(spotlight.closesAt, now)}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href={`/dashboard/election/${spotlight._id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3] hover:underline"
                  >
                    Election details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </aside>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e4e7] px-5 py-3 text-[11px] text-[#a1a1aa] sm:px-6">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#248a3d]" />
                  Anonymous ballot · one vote per student
                </span>
                <span>Verified by the registrar</span>
              </div>
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#e4e4e7] bg-[#fafafa]">
                <Vote className="h-4 w-4 text-[#a1a1aa]" />
              </span>
              <p className="mt-3 text-[15px] font-semibold text-[#09090b]">
                No election on the desk
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#71717a]">
                When your class poll opens, candidates and your anonymous ballot
                will appear here.
              </p>
              <Link
                href="/dashboard/election"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3] hover:underline"
              >
                View election history
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>

          <section className="overflow-hidden rounded-[16px] border border-[#e4e4e7] bg-white">
            <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-4">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[#09090b]">
                <Megaphone className="h-4 w-4 text-[#71717a]" />
                Open proposals
              </h2>
              <Link
                href={proposalHref}
                className="text-[11.5px] font-medium text-[#0071e3] hover:underline"
              >
                View all
              </Link>
            </div>
            {!data ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : openProposalList.length > 0 ? (
              <div>
                {openProposalList.map((proposal, index) => (
                  <Link
                    key={proposal._id || index}
                    href={proposalHref}
                    className="flex items-center gap-4 border-b border-[#f4f4f5] px-5 py-3.5 transition-colors last:border-0 hover:bg-[#fafafa]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-[#09090b]">
                        {proposal.title || 'Untitled proposal'}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#a1a1aa]">
                        {formatProposalMeta(proposal)}
                      </p>
                    </div>
                    <StatusBadge status={proposal.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-[11.5px] text-[#71717a]">
                No open proposals right now.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-[16px] border border-[#e4e4e7] bg-white">
            <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-4">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[#09090b]">
                <Bell className="h-4 w-4 text-[#71717a]" />
                Notices
              </h2>
              <span className="text-[11px] text-[#71717a]">
                {data ? `${unread.length} unread` : '—'}
              </span>
            </div>

            {!data ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : recent.length > 0 ? (
              <div>
                {recent.map((notification, index) => (
                  <Link
                    key={notification._id || index}
                    href="/dashboard/notifications"
                    className="group flex gap-3 border-b border-[#f4f4f5] px-5 py-3.5 transition-colors last:border-0 hover:bg-[#fafafa]"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[1px]',
                        notification.isRead ? 'bg-[#d4d4d8]' : 'bg-[#0071e3]',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            'truncate text-[12.5px]',
                            notification.isRead
                              ? 'font-normal text-[#3f3f46]'
                              : 'font-medium text-[#09090b]',
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[10.5px] text-[#a1a1aa]">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#a1a1aa]">
                        {notification.content || 'Open the notice for details.'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 px-5 py-6 text-[11.5px] text-[#71717a]">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#a1a1aa]" />
                No notices filed today. The desk is quiet.
              </div>
            )}

            <Link
              href="/dashboard/notifications"
              className="flex items-center justify-between border-t border-[#e4e4e7] px-5 py-3 text-[12px] font-medium text-[#0071e3] transition-colors hover:bg-[#fafafa]"
            >
              View all notifications
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section className="overflow-hidden rounded-[16px] border border-[#e4e4e7] bg-white">
            <div className="border-b border-[#e4e4e7] px-5 py-4">
              <h2 className="text-[13px] font-semibold text-[#09090b]">
                Quick actions
              </h2>
            </div>
            <div>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 border-b border-[#f4f4f5] px-5 py-3 transition-colors last:border-0 hover:bg-[#fafafa]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] text-[#71717a] transition-colors group-hover:border-[#09090b] group-hover:bg-[#0071e3] group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-[#09090b]">
                        {action.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#a1a1aa]">
                        {action.description}
                      </span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#d4d4d8] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0071e3]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-1.5 border-t border-[#e4e4e7] pt-5 text-[11px] text-[#a1a1aa] sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#248a3d]" />
          All systems operational · ballots anonymous · every action auditable
        </span>
        <span>HUConnect · Registrar&apos;s Office</span>
      </footer>
    </div>
  );
}
