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
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Your account information and governance identity."
      />

      <Card className="overflow-hidden">
        <div className="h-20 border-b border-[#171611]/15 bg-[#e9e4d8]" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <Avatar
            name={user?.username}
            className="-mt-10 h-20 w-20 border-4 border-[#f8f6f0] bg-[#f8f6f0] text-2xl"
          />
          <div className="flex-1">
            {loading && !user ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                <h2 className="font-editorial text-[26px] font-semibold leading-tight text-foreground">
                  {user?.fullName || user?.username}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.email || 'No email on file'}
                </p>
              </>
            )}
          </div>
          <Badge variant="default">{roleLabel(user?.role)}</Badge>
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
    <div className="flex items-center justify-between border-b border-[#171611]/10 pb-3 last:border-0 last:pb-0">
      <span className="font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#a33a1b]/25 bg-[#a33a1b]/10 text-[#a33a1b]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-editorial text-[20px] font-semibold leading-tight text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      </div>
    </Card>
  );
}
