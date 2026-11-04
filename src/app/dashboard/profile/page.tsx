'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { fetchCurrentUser, getStoredUser, type AuthUser } from '@/lib/auth';
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
        <div className="grid-paper h-24 border-b border-[#e4e4e7] bg-[#fafafa]" />
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
            <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#e4e4e7] bg-[#fafafa] px-2 py-1 text-[10.5px] font-medium text-[#52525b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#248a3d]" />
              {user?.isActive === false ? 'Deactivated' : 'Active'}
            </span>
            <Badge variant="default">{roleLabel(user?.role)}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
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
            <CardTitle className="text-base">Permissions</CardTitle>
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
              <p className="text-sm text-muted-foreground">
                No elevated permissions assigned.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard
          icon={Lock}
          title="Credential restrictions"
          body="Students cannot change their username or password through the normal profile interface. Contact an authorized authority for account corrections."
        />
        <InfoCard
          icon={ShieldCheck}
          title="Security & audit"
          body="All credential changes are recorded in the security audit log. Authorized authorities can initiate password resets without accessing your current password."
        />
      </div>
    </div>
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
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] text-[#0071e3]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-[15px] font-semibold leading-tight text-foreground">
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
