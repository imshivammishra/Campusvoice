'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  FileText,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Vote,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import { AUTHORITY_ROLES } from '@/lib/rbac';
import { Skeleton } from '@/components/ui';
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
    description: 'Your class poll and candidate profiles.',
    href: '/dashboard/election',
    icon: Vote,
  },
  {
    title: 'Raise a concern',
    description: 'Put an issue on the record, formally.',
    href: '/dashboard/concerns',
    icon: FileText,
  },
  {
    title: 'Explore proposals',
    description: 'See what your campus is deciding.',
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

  const dateLabel = new Date(now)
    .toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  const ledger = [
    {
      label: 'Live elections',
      value: data ? activeElections.length : '—',
      note: spotlight
        ? `Closes in ${timeLeft(spotlight.closesAt, now)}`
        : 'No active poll',
    },
    {
      label: 'Open proposals',
      value: data ? openProposals : '—',
      note: 'Across your communities',
    },
    {
      label: 'Unread notices',
      value: data ? unread.length : '—',
      note: unread.length ? 'Awaiting your attention' : 'Nothing outstanding',
    },
    {
      label: 'Support threads',
      value: data ? data.tickets.length : '—',
      note: 'Private and confidential',
    },
  ];

  return (
    <div className="space-y-9">
      <header className="border-b border-[#171611] pb-7">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-[#7a7365]">
          <p>{dateLabel}</p>
          <p className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2f5d3a]" />
            Live record · {user?.role?.replace(/_/g, ' ').toLowerCase() || 'member'}
          </p>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#a33a1b]">
              The campus desk
            </p>
            <h1 className="mt-2 font-editorial text-[clamp(2.9rem,5.6vw,4.9rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-[#171611]">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-[#5f5b4f] sm:text-[14px]">
              A working record of what your campus is deciding — and where your
              voice is needed before the next bell.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            {spotlight ? (
              <Link
                href={`/dashboard/election/${spotlight._id}`}
                className="group inline-flex h-11 items-center gap-4 bg-[#171611] px-5 font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-[#f8f6f0] transition-colors hover:bg-[#a33a1b]"
              >
                {hasVoted ? 'Read live results' : 'Open your ballot'}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                href="/dashboard/election"
                className="group inline-flex h-11 items-center gap-4 bg-[#171611] px-5 font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-[#f8f6f0] transition-colors hover:bg-[#a33a1b]"
              >
                Explore elections
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}
            <Link
              href="/dashboard/concerns"
              className="border-b border-[#171611]/40 pb-1 font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-[#171611] transition-colors hover:border-[#a33a1b] hover:text-[#a33a1b]"
            >
              Raise a concern
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 border-b border-[#171611] lg:grid-cols-4">
        {ledger.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              'py-5',
              index % 2 === 1 && 'border-l border-[#cfc8b8] pl-4 sm:pl-5',
              index > 0 && 'lg:border-l lg:border-[#cfc8b8] lg:pl-5',
              index === 0 && 'lg:border-l-0 lg:pl-0',
            )}
          >
            <p className="font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-[#7a7365]">
              {item.label}
            </p>
            <p className="mt-2 font-editorial text-[40px] font-semibold leading-none tracking-[-0.045em] text-[#171611]">
              {item.value}
            </p>
            <p className="mt-2 text-[10px] leading-snug text-[#7a7365]">
              {item.note}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.78fr)] xl:gap-12">
        <section>
          <div className="flex items-end justify-between border-b border-[#171611] pb-2">
            <h2 className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#171611]">
              01 / The lead
            </h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#a29a8b]">
              Election
            </span>
          </div>

          {!data ? (
            <div className="border-x border-b border-[#cfc8b8] bg-[#f8f6f0] p-6">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-4 h-10 w-2/3" />
              <Skeleton className="mt-3 h-3 w-1/2" />
              <Skeleton className="mt-8 h-28 w-full" />
            </div>
          ) : spotlight ? (
            <article className="border-x border-b border-[#cfc8b8] bg-[#f8f6f0]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#171611]/15 p-5 sm:p-6">
                <div>
                  <p className="font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-[#a33a1b]">
                    {spotlight.className || 'Your class'} / Class representative
                  </p>
                  <h3 className="mt-2 font-editorial text-[32px] font-semibold leading-[0.94] tracking-[-0.04em] text-[#171611] sm:text-[38px]">
                    {spotlight.title || 'CR Election'}
                  </h3>
                  <p className="mt-2 text-[11px] text-[#5f5b4f]">
                    Closes {formatDate(spotlight.closesAt)} ·{' '}
                    {timeLeft(spotlight.closesAt, now)} remaining
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 border px-2 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.12em]',
                    spotlight.status === 'active'
                      ? 'border-[#2f5d3a]/35 text-[#2f5d3a]'
                      : 'border-[#171611]/20 text-[#7a7365]',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      spotlight.status === 'active'
                        ? 'bg-[#2f5d3a]'
                        : 'bg-[#a29a8b]',
                    )}
                  />
                  {spotlight.status?.replace(/_/g, ' ') || 'Election'}
                </span>
              </div>

              <div className="grid sm:grid-cols-[minmax(0,1fr)_184px]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#171611]/20 pb-2 font-mono text-[7px] font-medium uppercase tracking-[0.16em] text-[#a29a8b]">
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
                            className="border-b border-[#171611]/10 py-3.5 last:border-0"
                          >
                            <div className="flex items-baseline justify-between gap-4">
                              <div className="flex min-w-0 items-baseline gap-3">
                                <span className="font-mono text-[8px] text-[#a29a8b]">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="truncate font-editorial text-[16px] font-semibold text-[#171611]">
                                  {candidate.studentName || 'Candidate'}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] tabular-nums text-[#5f5b4f]">
                                {votes}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="h-[3px] flex-1 bg-[#e3ddcf]">
                                <div
                                  className="h-full bg-[#a33a1b]"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="w-7 text-right font-mono text-[8px] text-[#a29a8b]">
                                {share}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {candidates.length > 4 && (
                        <Link
                          href={`/dashboard/election/${spotlight._id}`}
                          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-[#a33a1b] hover:underline"
                        >
                          All {candidates.length} candidates
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="py-5 text-[12px] leading-relaxed text-[#7a7365]">
                      Candidate profiles will appear here once nominations are
                      confirmed.
                    </p>
                  )}
                </div>

                <aside className="border-t border-[#171611]/15 bg-[#f1eee6] p-5 sm:border-l sm:border-t-0 sm:p-6">
                  <p className="font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-[#7a7365]">
                    Turnout
                  </p>
                  <p className="mt-2 font-editorial text-[54px] font-semibold leading-none tracking-[-0.05em] text-[#171611]">
                    {turnout}
                    <span className="text-[22px]">%</span>
                  </p>

                  <div className="mt-4 flex gap-[2px]" aria-hidden="true">
                    {Array.from({ length: 20 }).map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          'h-2 flex-1',
                          index < Math.round(turnout / 5)
                            ? 'bg-[#171611]'
                            : 'bg-[#d8d2c3]',
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2.5 text-[10px] leading-relaxed text-[#7a7365]">
                    {eligibleVoters > 0
                      ? `${totalVoters} of ${eligibleVoters} eligible ballots cast`
                      : 'Awaiting the next live poll'}
                  </p>

                  <div className="mt-5 space-y-2.5 border-t border-[#171611]/15 pt-4 text-[10px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a7365]">Your ballot</span>
                      <span
                        className={cn(
                          'font-mono text-[8px] font-medium uppercase tracking-[0.08em]',
                          hasVoted ? 'text-[#2f5d3a]' : 'text-[#a33a1b]',
                        )}
                      >
                        {hasVoted ? 'Recorded' : 'Not cast'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a7365]">Candidates</span>
                      <span className="font-mono text-[9px]">
                        {candidates.length || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a7365]">Closes in</span>
                      <span className="font-mono text-[9px]">
                        {timeLeft(spotlight.closesAt, now)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/election/${spotlight._id}`}
                    className="mt-5 inline-flex items-center gap-1.5 border-b border-[#171611]/40 pb-1 font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-[#171611] transition-colors hover:border-[#a33a1b] hover:text-[#a33a1b]"
                  >
                    {hasVoted ? 'View result' : 'Open ballot'}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </aside>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#171611]/15 px-5 py-3 font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-[#7a7365] sm:px-6">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-[#2f5d3a]" />
                  Ballot sealed · identities not attached
                </span>
                <span>{spotlight.status === 'active' ? 'Poll open' : 'Poll closed'}</span>
              </div>
            </article>
          ) : (
            <div className="border-x border-b border-[#cfc8b8] bg-[#f8f6f0] px-6 py-12 text-center">
              <Vote className="mx-auto h-5 w-5 text-[#a29a8b]" />
              <p className="mt-3 font-editorial text-[24px] font-semibold tracking-[-0.03em]">
                No election on the desk.
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-[#7a7365]">
                When your class poll opens, candidates and your anonymous ballot
                will be filed here.
              </p>
              <Link
                href="/dashboard/election"
                className="mt-4 inline-flex items-center gap-1.5 border-b border-[#171611]/40 pb-1 font-mono text-[8px] font-medium uppercase tracking-[0.12em] hover:border-[#a33a1b] hover:text-[#a33a1b]"
              >
                Election history <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-9">
          <section>
            <div className="flex items-end justify-between border-b border-[#171611] pb-2">
              <h2 className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#171611]">
                02 / Notices
              </h2>
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#a29a8b]">
                {data ? `${unread.length} unread` : '—'}
              </span>
            </div>

            {!data ? (
              <div className="space-y-4 border-b border-[#171611]/15 py-4">
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
                    className="group flex gap-3 border-b border-[#171611]/12 py-3.5 transition-colors hover:bg-[#e9e4d8]/50"
                  >
                    <span className="pt-0.5 font-mono text-[8px] text-[#a29a8b]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'mt-1.5 h-1 w-1 shrink-0 rounded-full',
                        notification.isRead
                          ? 'bg-transparent'
                          : 'bg-[#a33a1b]',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-[12px]',
                          notification.isRead
                            ? 'font-normal text-[#5f5b4f]'
                            : 'font-medium text-[#171611]',
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[10px] text-[#8a8274]">
                        {notification.content || 'Open the notice for details.'}
                      </p>
                    </div>
                    <span className="shrink-0 pt-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[#a29a8b]">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 border-b border-[#171611]/15 py-5 text-[11px] text-[#7a7365]">
                <Bell className="mt-0.5 h-4 w-4 shrink-0" />
                No notices filed today. The desk is quiet.
              </div>
            )}

            <Link
              href="/dashboard/notifications"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-[#a33a1b] hover:underline"
            >
              Read the noticeboard
              <ArrowRight className="h-3 w-3" />
            </Link>
          </section>

          <section>
            <div className="flex items-end justify-between border-b border-[#171611] pb-2">
              <h2 className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#171611]">
                03 / Desk
              </h2>
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#a29a8b]">
                Quick actions
              </span>
            </div>

            <div>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 border-b border-[#171611]/12 py-3.5 transition-colors hover:bg-[#e9e4d8]/50"
                  >
                    <span className="font-mono text-[8px] text-[#a29a8b]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#a33a1b]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-[#171611]">
                        {action.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-[#8a8274]">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#a29a8b] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#a33a1b]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-2 border-t border-[#171611] pt-4 font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-[#7a7365] sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-3 w-3 text-[#2f5d3a]" />
          Anonymous by default · one person, one vote · every action auditable
        </span>
        <span>Registrar&apos;s desk · CampusVoice</span>
      </footer>
    </div>
  );
}
