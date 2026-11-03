'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  FileText,
  LifeBuoy,
  Megaphone,
  Vote,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import {
  Card,
  CardSkeletonGrid,
  PageHeader,
  StatCard,
} from '@/components/ui';

type Stats = {
  elections: number;
  proposals: number;
  notifications: number;
};

const QUICK_ACTIONS = [
  {
    title: 'CR Elections',
    description: 'View and participate in weekly elections.',
    href: '/dashboard/election',
    icon: Vote,
  },
  {
    title: 'Raise a Concern',
    description: 'Submit a concern for your class or department.',
    href: '/dashboard/concerns',
    icon: FileText,
  },
  {
    title: 'Proposals',
    description: 'Browse governance proposals and cast your vote.',
    href: '/dashboard/proposals',
    icon: Megaphone,
  },
  {
    title: 'Support',
    description: 'Privately contact a welfare or grievance officer.',
    href: '/dashboard/support',
    icon: LifeBuoy,
  },
];

function count(value: any): number {
  if (Array.isArray(value)) return value.length;
  if (Array.isArray(value?.data)) return value.data.length;
  if (typeof value?.total === 'number') return value.total;
  return 0;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    (async () => {
      const [elections, proposals, notifications] = await Promise.allSettled([
        apiRequest('/elections'),
        apiRequest('/proposals'),
        apiRequest('/notifications'),
      ]);
      setStats({
        elections:
          elections.status === 'fulfilled' ? count(elections.value) : 0,
        proposals:
          proposals.status === 'fulfilled' ? count(proposals.value) : 0,
        notifications:
          notifications.status === 'fulfilled'
            ? count(notifications.value)
            : 0,
      });
    })();
  }, []);

  const firstName = (user?.fullName || user?.username || 'there').split(' ')[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is your governance overview for today."
      />

      {!stats ? (
        <CardSkeletonGrid count={3} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Active Elections"
            value={stats.elections}
            icon={Vote}
            hint="Weekly CR elections"
          />
          <StatCard
            label="Proposals"
            value={stats.proposals}
            icon={Megaphone}
            hint="Across your communities"
          />
          <StatCard
            label="Notifications"
            value={stats.notifications}
            icon={Bell}
            hint="Updates for you"
          />
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card
                hover
                className="flex items-center gap-4 p-5 hover:border-primary/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Recent activity
        </h2>
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No recent activity yet. Start by exploring elections or submitting a
            concern.
          </p>
        </Card>
      </section>
    </div>
  );
}
