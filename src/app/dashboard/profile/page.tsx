'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { fetchCurrentUser, getStoredUser, type AuthUser } from '@/lib/auth';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
  Skeleton,
} from '@/components/ui';

function roleLabel(role?: string) {
  if (!role) return 'User';
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account information and governance identity."
      />

      <Card className="overflow-hidden">
        <div className="h-24 border-b border-[#e4e4e7] bg-[#fafafa]" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <Avatar
            name={user?.fullName || user?.username}
            className="-mt-11 h-20 w-20 rounded-[16px] border-4 border-white bg-[#0071e3] text-2xl text-white"
          />
          <div className="min-w-0 flex-1 sm:pb-0.5">
            {loading && !user ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
                  {user?.fullName || user?.username}
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[#71717a]">
                  {user?.email || 'No email on file'}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:pb-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#e4e4e7] bg-[#fafafa] px-2 py-1 text-[10.5px] font-medium text-[#52525b]">
              <span className="h-1.5 w-1.5 rounded-[1px] bg-[#248a3d]" />
              {user?.isActive === false ? 'Deactivated' : 'Active'}
            </span>
            <Badge variant="default">{roleLabel(user?.role)}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            <Detail label="Username" value={user?.username} />
            <Detail label="Email" value={user?.email} />
            <Detail label="Role" value={roleLabel(user?.role)} />
            <Detail
              label="Status"
              value={user?.isActive === false ? 'Deactivated' : 'Active'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.permissions && user.permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary" className="normal-case">
                    {perm}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-[#71717a]">
                No elevated permissions assigned.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChangePasswordCard />
        <InfoCard
          icon={ShieldCheck}
          title="Security & audit"
          body="All credential changes are recorded in the security audit log. Authorized authorities can also reset your password without accessing your current one."
        />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast.success('Your password has been updated.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (error: any) {
      toast.error(error?.message || 'Could not update your password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#0071e3]" />
          Change password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Current password">
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Field label="New password" hint="At least 8 characters.">
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter the new password"
              autoComplete="new-password"
              required
            />
          </Field>
          <div className="pt-1">
            <Button type="submit" loading={saving}>
              <Lock className="h-4 w-4" />
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f4f4f5] pb-3 last:border-0 last:pb-0">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-[#71717a]">
        {label}
      </span>
      <span className="text-[13px] font-medium text-foreground">
        {value || '—'}
      </span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] text-[#0071e3]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-[13.5px] font-semibold leading-tight text-[#09090b]">
            {title}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#71717a]">
            {body}
          </p>
        </div>
      </div>
    </Card>
  );
}
