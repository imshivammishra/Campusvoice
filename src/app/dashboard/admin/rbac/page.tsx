'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Badge, Card, PageHeader } from '@/components/ui';
import {
  AUTHORITY_ROLES,
  PERMISSION_DESCRIPTIONS,
  ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  roleLabel,
} from '@/lib/rbac';

export default function AdminRbacPage() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    apiRequest('/permissions')
      .then((data: any) =>
        setPermissions(
          Array.isArray(data) ? data : Object.keys(PERMISSION_DESCRIPTIONS),
        ),
      )
      .catch(() => setPermissions(Object.keys(PERMISSION_DESCRIPTIONS)));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles & Access Control"
        description="The role-based access control matrix governing every protected action."
      />

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Roles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map((role) => {
            const perms = ROLE_PERMISSIONS[role] || [];
            const isAuthority = AUTHORITY_ROLES.includes(role);
            return (
              <Card key={role} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isAuthority
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {roleLabel(role)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {perms.length} permission{perms.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  {isAuthority && <Badge variant="default">Authority</Badge>}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {perms.map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Permission reference
        </h2>
        <Card className="divide-y divide-border">
          {(permissions.length
            ? permissions
            : Object.keys(PERMISSION_DESCRIPTIONS)
          ).map((perm) => (
            <div
              key={perm}
              className="flex items-center justify-between gap-4 px-5 py-3"
            >
              <span className="font-mono text-xs text-foreground">{perm}</span>
              <span className="text-right text-sm text-muted-foreground">
                {PERMISSION_DESCRIPTIONS[perm] || '—'}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
