'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  TriangleAlert,
  UserCog,
  UserPlus,
  Users,
  Vote,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Button,
  Card,
  CardSkeletonGrid,
  Input,
  Modal,
  PageHeader,
  StatCard,
} from '@/components/ui';

type Stats = {
  users: number;
  activeUsers: number;
  inactiveUsers: number;
  students: number;
  teachers: number;
  authorities: number;
  pendingRegistrations: number;
  institutions: number;
  departments: number;
  classes: number;
  elections: number;
  activeElections: number;
  proposals: number;
};

const MANAGE_LINKS = [
  {
    title: 'User Management',
    description: 'Create accounts, assign roles, reset credentials.',
    href: '/dashboard/admin/users',
    icon: UserCog,
  },
  {
    title: 'Registration Approvals',
    description: 'Review and approve pending account requests.',
    href: '/dashboard/admin/registrations',
    icon: UserPlus,
  },
  {
    title: 'Organization',
    description: 'Manage institutions, departments and classes.',
    href: '/dashboard/admin/organization',
    icon: Building2,
  },
  {
    title: 'Roles & Access',
    description: 'Inspect the RBAC permission matrix.',
    href: '/dashboard/admin/rbac',
    icon: ShieldCheck,
  },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadStats = () => {
    apiRequest('/admin/stats')
      .then((data: any) => setStats(data))
      .catch((e) => setError(e?.message || 'Failed to load stats'));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const runReset = async () => {
    setResetting(true);
    try {
      const res: any = await apiRequest('/admin/reset', { method: 'POST' });
      const removed = Object.values(res?.purged || {}).reduce(
        (a: number, b: any) => a + (Number(b) || 0),
        0,
      );
      toast.success(`Platform reset complete — ${removed} records removed`);
      setResetOpen(false);
      setConfirmText('');
      setStats(null);
      loadStats();
    } catch (e: any) {
      toast.error(e?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Console"
        description="System administration, accounts, RBAC and institutional configuration."
      />

      {error && (
        <Card className="border-[#fecaca] bg-[#fef2f2] p-4 text-[12px] text-[#b91c1c]">
          {error}
        </Card>
      )}

      {!stats ? (
        <CardSkeletonGrid count={4} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Users"
              value={stats.users}
              icon={Users}
              hint={`${stats.activeUsers} active · ${stats.inactiveUsers} inactive`}
            />
            <StatCard
              label="Authorities"
              value={stats.authorities}
              icon={ShieldCheck}
              hint="Governing & admin roles"
            />
            <StatCard
              label="Pending Approvals"
              value={stats.pendingRegistrations}
              icon={UserPlus}
              hint="Awaiting review"
            />
            <StatCard
              label="Active Elections"
              value={stats.activeElections}
              icon={Vote}
              hint={`${stats.elections} total`}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Students" value={stats.students} icon={GraduationCap} />
            <StatCard label="Teachers" value={stats.teachers} icon={Users} />
            <StatCard
              label="Institutions"
              value={stats.institutions}
              icon={Building2}
              hint={`${stats.departments} depts · ${stats.classes} classes`}
            />
            <StatCard label="Proposals" value={stats.proposals} icon={Megaphone} />
          </div>
        </>
      )}

      <section>
        <h2 className="mb-4 text-[14px] font-semibold text-[#09090b]">Manage</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MANAGE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card hover className="flex items-center gap-3.5 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[#e4e4e7] bg-[#fafafa] text-[#71717a] transition-colors group-hover:border-[#09090b] group-hover:bg-[#09090b] group-hover:text-white">
                  <link.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#09090b]">{link.title}</p>
                  <p className="truncate text-[11.5px] text-[#a1a1aa]">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#d4d4d8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0f4c81]" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[14px] font-semibold text-[#b91c1c]">
          Danger Zone
        </h2>
        <Card className="flex flex-col gap-4 border-[#fecaca] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]">
              <TriangleAlert className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-medium text-[#09090b]">Reset platform data</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#71717a]">
                Permanently deletes all users (except super admins), concerns,
                elections, messages, tickets and organization data for a fresh
                start. This cannot be undone.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setResetOpen(true)}
            className="shrink-0"
          >
            <TriangleAlert className="h-4 w-4" />
            Reset everything
          </Button>
        </Card>
      </section>

      <Modal
        open={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setConfirmText('');
        }}
        title="Reset all platform data?"
        description="This will permanently remove all content and user accounts except super administrators. There is no undo."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setResetOpen(false);
                setConfirmText('');
              }}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={runReset}
              loading={resetting}
              disabled={confirmText !== 'RESET'}
            >
              Permanently reset
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Type <span className="font-mono font-semibold text-destructive">RESET</span>{' '}
            to confirm.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}

