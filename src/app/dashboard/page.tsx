'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Download,
  FileText,
  LifeBuoy,
  Lock,
  Megaphone,
  Plus,
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
    description: 'Open your class poll and candidates.',
    href: '/dashboard/election',
    icon: Vote,
  },
  {
    title: 'Raise a concern',
    description: 'Send an issue to the people responsible.',
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
    title: 'Private support',
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

type TrendTone = 'up' | 'down' | 'flat';

function StatCard({
  label,
  value,
  icon: Icon,
  badge,
  tone,
  note,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  tone?: TrendTone;
  note?: string;
}) {
  const toneClass =
    tone === 'up'
      ? 'bg-[#0a223a] text-white'
      : tone === 'down'
        ? 'bg-zinc-200 text-zinc-700'
        : 'bg-zinc-100 text-zinc-500';
  const TrendIcon =
    tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#0a223a] text-white">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="grow">
        <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-zinc-500">
          {label}
        </p>
        <div className="mt-0.5 flex items-center gap-x-2">
          <h3 className="text-[22px] font-bold leading-none tracking-[-0.02em] text-[#0a223a] tabular-nums">
            {value}
          </h3>
          {badge && (
            <span
              className={cn(
                'inline-flex items-center gap-x-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold',
                toneClass,
              )}
            >
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              {badge}
            </span>
          )}
        </div>
        {note && <p className="mt-1 text-[11px] text-zinc-400">{note}</p>}
      </div>
    </div>
  );
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
        .slice(0, 5),
    [data?.proposals],
  );
  const unread = useMemo(
    () => data?.notifications.filter((notification) => !notification.isRead) || [],
    [data?.notifications],
  );
  const quickActions = useMemo(() => {
    const role = user?.role || '';
    let actions = QUICK_ACTIONS;
    if (role === 'SUPER_ADMIN') {
      actions = actions.filter((action) => action.href !== '/dashboard/election');
    }
    const canBrowseProposals =
      role === 'TEACHER' || AUTHORITY_ROLES.includes(role as any);
    if (canBrowseProposals) return actions;
    return actions.map((action) =>
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
        .slice(0, 5),
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

  const dateLabel = new Date(now).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const ring = 2 * Math.PI * 42;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel}
          </p>
          <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#0a223a] sm:text-[24px]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Here is what is happening across your campus today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            Export
          </button>
          <Link
            href="/dashboard/concerns"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0a223a] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#262626]"
          >
            <Plus className="h-3.5 w-3.5" />
            New concern
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live elections"
          value={data ? activeElections.length : '—'}
          icon={Vote}
          badge={data && activeElections.length > 0 ? 'Active' : undefined}
          tone="up"
          note={
            spotlight
              ? `Closes in ${timeLeft(spotlight.closesAt, now)}`
              : 'No active poll'
          }
        />
        <StatCard
          label="Open proposals"
          value={data ? openProposals : '—'}
          icon={Megaphone}
          badge={data ? `${openProposals}` : undefined}
          tone="flat"
          note="Across your communities"
        />
        <StatCard
          label="Unread notices"
          value={data ? unread.length : '—'}
          icon={Bell}
          badge={data && unread.length > 0 ? 'New' : undefined}
          tone={data && unread.length > 0 ? 'down' : 'flat'}
          note={unread.length ? 'Awaiting your attention' : 'Nothing outstanding'}
        />
        <StatCard
          label="Support threads"
          value={data ? data.tickets.length : '—'}
          icon={LifeBuoy}
          badge="Private"
          tone="flat"
          note="Confidential by default"
        />
      </section>

      {/* Main grid */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          {/* Election spotlight */}
          {user?.role !== 'SUPER_ADMIN' && (
            <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <h2 className="flex items-center gap-2 text-[13px] font-bold text-[#0a223a]">
                  <Vote className="h-4 w-4 text-[#0a223a]" />
                  Election spotlight
                </h2>
                {spotlight && (
                  <Link
                    href={`/dashboard/election/${spotlight._id}`}
                    className="text-[11.5px] font-semibold text-[#0a223a] hover:underline"
                  >
                    View details
                  </Link>
                )}
              </div>

              {!data ? (
                <div className="p-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-6 w-2/3" />
                  <Skeleton className="mt-3 h-3 w-1/2" />
                  <Skeleton className="mt-6 h-36 w-full" />
                </div>
              ) : spotlight ? (
                <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase capitalize',
                          spotlight.status === 'active'
                            ? 'border-[#d4d4d8] bg-[#f4f4f5] text-[#0a223a]'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-500',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            spotlight.status === 'active'
                              ? 'bg-[#0a223a]'
                              : 'bg-zinc-400',
                          )}
                        />
                        {spotlight.status?.replace(/_/g, ' ') || 'Election'}
                      </span>
                      <span className="text-[10.5px] font-semibold text-zinc-400">
                        {spotlight.className || 'Your class'} · Class representative
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-[18px] font-bold leading-snug tracking-[-0.015em] text-[#0a223a]">
                      {spotlight.title || 'Class Representative Election'}
                    </h3>
                    <p className="mt-1 text-[11.5px] text-zinc-500">
                      Closes {formatDate(spotlight.closesAt)} ·{' '}
                      <span className="font-semibold text-zinc-700">
                        {timeLeft(spotlight.closesAt, now)} remaining
                      </span>
                    </p>

                    <div className="mt-4 space-y-3">
                      {candidates.length > 0 ? (
                        candidates.slice(0, 4).map((candidate, index) => {
                          const votes = Number(candidate.votes || 0);
                          const share = totalVotes
                            ? Math.round((votes / totalVotes) * 100)
                            : 0;
                          return (
                            <div
                              key={candidate._id || index}
                              className="flex items-center gap-2.5"
                            >
                              <Avatar
                                name={candidate.studentName || 'Candidate'}
                                className="h-7 w-7 shrink-0 rounded-md text-[10px]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 text-[12px]">
                                  <span className="truncate font-semibold text-zinc-700">
                                    {candidate.studentName || 'Candidate'}
                                  </span>
                                  <span className="shrink-0 font-medium text-zinc-400 tabular-nums">
                                    {votes} · {share}%
                                  </span>
                                </div>
                                <Progress
                                  value={share}
                                  className="mt-1 h-1.5 bg-zinc-100"
                                  indicatorClassName="bg-[#0a223a]"
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-md bg-zinc-50 px-3 py-2.5 text-[11.5px] text-zinc-500">
                          Candidate standings will appear once voting begins.
                        </p>
                      )}
                    </div>
                  </div>

                  <aside className="border-t border-zinc-200 bg-zinc-50 p-4 lg:border-l lg:border-t-0">
                    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#e4e4e7"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#0a223a"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={ring}
                          strokeDashoffset={ring * (1 - turnout / 100)}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-[22px] font-bold tracking-[-0.03em] text-[#0a223a]">
                          {turnout}%
                        </p>
                        <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                          Turnout
                        </p>
                      </div>
                    </div>

                    <dl className="mt-3 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="font-medium text-zinc-500">Your ballot</dt>
                        <dd
                          className={cn(
                            'font-bold',
                            hasVoted ? 'text-[#0a223a]' : 'text-[#71717a]',
                          )}
                        >
                          {hasVoted ? 'Recorded' : 'Not cast'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="font-medium text-zinc-500">Ballots cast</dt>
                        <dd className="font-bold tabular-nums text-zinc-700">
                          {totalVoters}
                          {eligibleVoters > 0 ? ` / ${eligibleVoters}` : ''}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="font-medium text-zinc-500">Candidates</dt>
                        <dd className="font-bold tabular-nums text-zinc-700">
                          {candidates.length || '—'}
                        </dd>
                      </div>
                    </dl>

                    <Link
                      href={`/dashboard/election/${spotlight._id}`}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0a223a] px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#262626]"
                    >
                      {hasVoted ? 'View results' : 'Open ballot'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
                      <Lock className="h-3 w-3" />
                      Ballot sealed · no identities linked
                    </p>
                  </aside>
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100">
                    <Vote className="h-4 w-4 text-zinc-400" />
                  </span>
                  <p className="mt-2.5 text-[14px] font-bold text-[#0a223a]">
                    No active election
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-zinc-500">
                    When your class poll opens, candidates and results appear here.
                  </p>
                  <Link
                    href="/dashboard/election"
                    className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0a223a] hover:underline"
                  >
                    View election history
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Proposals table */}
          <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="flex items-center gap-2 text-[13px] font-bold text-[#0a223a]">
                <Megaphone className="h-4 w-4 text-[#0a223a]" />
                Open proposals
              </h2>
              <Link
                href={proposalHref}
                className="text-[11.5px] font-semibold text-[#0a223a] hover:underline"
              >
                View all
              </Link>
            </div>
            {!data ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : openProposalList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-[0.06em] text-zinc-500">
                      <th className="px-4 py-2 font-bold">Proposal</th>
                      <th className="px-4 py-2 font-bold">Category</th>
                      <th className="px-4 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openProposalList.map((proposal, index) => (
                      <tr
                        key={proposal._id || index}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={proposalHref}
                            className="block max-w-[260px] truncate text-[12px] font-semibold text-[#0a223a] hover:text-[#0a223a]"
                          >
                            {proposal.title || 'Untitled proposal'}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] capitalize text-zinc-500">
                          {formatProposalMeta(proposal)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={proposal.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-5 text-[11.5px] text-zinc-500">
                No open proposals right now.
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="flex items-center gap-2 text-[13px] font-bold text-[#0a223a]">
                <Bell className="h-4 w-4 text-[#0a223a]" />
                Notices
              </h2>
              <span className="text-[10.5px] font-semibold text-zinc-400">
                {data ? `${unread.length} unread` : '—'}
              </span>
            </div>

            {!data ? (
              <div className="space-y-3 p-4">
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
                    className="group flex gap-2.5 border-b border-zinc-100 px-4 py-3 transition-colors last:border-0 hover:bg-zinc-50"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        notification.isRead ? 'bg-zinc-300' : 'bg-[#0a223a]',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            'truncate text-[12px]',
                            notification.isRead
                              ? 'font-medium text-zinc-600'
                              : 'font-bold text-[#0a223a]',
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
                        {notification.content || 'Open the notice for details.'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-2.5 px-4 py-5 text-[11.5px] text-zinc-500">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                No notices filed today. The desk is quiet.
              </div>
            )}

            <Link
              href="/dashboard/notifications"
              className="flex items-center justify-center gap-1.5 border-t border-zinc-200 px-4 py-2.5 text-[11.5px] font-semibold text-[#0a223a] transition-colors hover:bg-zinc-50"
            >
              View all notices
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          {/* Quick actions */}
          <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-[13px] font-bold text-[#0a223a]">
                Quick actions
              </h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-zinc-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f4f4f5] text-[#0a223a]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-[#0a223a]">
                        {action.title}
                      </p>
                      <p className="truncate text-[10.5px] text-zinc-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-[#0a223a]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
