'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { KeyRound, Plus, Search, ShieldCheck, Trash2, UserCog, UsersRound } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Label,
  ListSkeleton,
  Modal,
  PageHeader,
  Select,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import {
  AUTHORITY_ROLES,
  ROLES,
  ROLE_PERMISSIONS,
  roleLabel,
} from '@/lib/rbac';

type User = {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions?: string[];
  isActive?: boolean;
  studentId?: string;
  employeeId?: string;
  className?: string;
};

const EMPTY_CREATE = {
  fullName: '',
  username: '',
  email: '',
  role: 'REGISTRAR',
  password: '',
  phone: '',
  studentId: '',
  employeeId: '',
  className: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [canDeleteUsers, setCanDeleteUsers] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const data = await apiRequest(`/users?${params.toString()}`);
      setUsers(data?.data || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length && users.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u._id)));
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Permanently delete ${selected.size} selected user${selected.size === 1 ? '' : 's'}? This cannot be undone.`,
    );
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      const res = await apiRequest('/users/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      toast.success(`${res?.deleted ?? selected.size} user${(res?.deleted ?? selected.size) === 1 ? '' : 's'} deleted`);
      setSelected(new Set());
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchCurrentUser()
      .then((u: any) =>
        setCanDeleteUsers(
          u?.role === 'SUPER_ADMIN' ||
            (Array.isArray(u?.permissions) && u.permissions.includes('users:deactivate')),
        ),
      )
      .catch(() => setCanDeleteUsers(false));
  }, []);

  useEffect(() => {
    setSelected(new Set());
  }, [users]);

  useEffect(() => {
    apiRequest('/permissions')
      .then((data: any) => setAllPermissions(Array.isArray(data) ? data : []))
      .catch(() => setAllPermissions([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Provision accounts, assign roles and permissions, and manage credentials."
      >
        <Link href="/dashboard/admin/students">
          <Button variant="outline">
            <UsersRound className="h-4 w-4" />
            Bulk add students
          </Button>
        </Link>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create account
        </Button>
      </PageHeader>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username or email"
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="sm:w-56"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </Select>
      </Card>

      {loading ? (
        <ListSkeleton count={4} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No users found"
          description="Try adjusting your search, or create a new account."
        />
      ) : (
        <>
          {canDeleteUsers && selected.size > 0 && (
            <div className="flex items-center justify-between rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
              <p className="text-sm font-medium text-destructive">
                {selected.size} user{selected.size === 1 ? '' : 's'} selected
              </p>
              <Button variant="destructive" size="sm" onClick={bulkDelete} loading={bulkDeleting}>
                <Trash2 className="h-4 w-4" />
                Delete selected
              </Button>
            </div>
          )}
          <Table>
          <THead>
            <TR>
              {canDeleteUsers && (
                <TH className="w-10">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selected.size === users.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#d4d4d8]"
                  />
                </TH>
              )}
              <TH>User</TH>
              <TH className="hidden md:table-cell">Email</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <tbody>
            {users.map((u) => (
              <TR key={u._id}>
                {canDeleteUsers && (
                  <TD className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.has(u._id)}
                      onChange={() => toggleSelect(u._id)}
                      className="h-4 w-4 rounded border-[#d4d4d8]"
                    />
                  </TD>
                )}
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.fullName || u.username} className="h-9 w-9" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {u.fullName || u.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{u.username}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD className="hidden md:table-cell text-muted-foreground">
                  {u.email}
                </TD>
                <TD>
                  <Badge
                    variant={
                      AUTHORITY_ROLES.includes(u.role as any)
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {roleLabel(u.role)}
                  </Badge>
                </TD>
                <TD>
                  {u.isActive === false ? (
                    <Badge variant="danger">Inactive</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditUser(u)}
                  >
                    Manage
                  </Button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        </>
      )}

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        allPermissions={allPermissions}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
      />

      <ManageUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        allPermissions={allPermissions}
        onChanged={load}
        viewerCanDelete={canDeleteUsers}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create user modal                                                           */
/* -------------------------------------------------------------------------- */

function CreateUserModal({
  open,
  onClose,
  allPermissions,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  allPermissions: string[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_CREATE });
  const [permissions, setPermissions] = useState<string[]>(
    ROLE_PERMISSIONS.REGISTRAR,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_CREATE });
      setPermissions(ROLE_PERMISSIONS.REGISTRAR);
    }
  }, [open]);

  const setRole = (role: string) => {
    setForm((f) => ({ ...f, role }));
    setPermissions(ROLE_PERMISSIONS[role] || []);
  };

  const togglePerm = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const submit = async () => {
    if (!form.fullName || !form.username || !form.email || !form.password) {
      toast.error('Full name, username, email and password are required.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        role: form.role,
        password: form.password,
        permissions,
      };
      if (form.phone) payload.phone = form.phone;
      if (form.role === 'STUDENT' && form.studentId)
        payload.studentId = form.studentId;
      if (form.role !== 'STUDENT' && form.employeeId)
        payload.employeeId = form.employeeId;
      if (
        (form.role === 'STUDENT' || form.role === 'CLASS_REPRESENTATIVE') &&
        form.className
      )
        payload.className = form.className;
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(`${roleLabel(form.role)} account created`);
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Create account"
      description="Provision an authority, teacher or student account."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Username" required>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="jane.doe"
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@college.edu"
            />
          </Field>
          <Field label="Temporary password" required hint="The user should change it after first sign-in.">
            <Input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 characters"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional"
            />
          </Field>
          {form.role === 'STUDENT' ? (
            <Field label="Student ID">
              <Input
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="Optional"
              />
            </Field>
          ) : (
            <Field label="Employee ID">
              <Input
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
                placeholder="Optional"
              />
            </Field>
          )}
          {(form.role === 'STUDENT' || form.role === 'CLASS_REPRESENTATIVE') && (
            <Field
              label="Class / Section"
              hint="Links students and their Class Representative for messaging. Use the same value for a class and its CR."
            >
              <Input
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                placeholder="e.g. CSE-A 2026"
              />
            </Field>
          )}
        </div>

        <div>
          <Label>Permissions</Label>
          <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
            Defaults applied from the selected role. Adjust as needed.
          </p>
          <PermissionGrid
            all={allPermissions}
            selected={permissions}
            onToggle={togglePerm}
          />
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Manage user modal                                                           */
/* -------------------------------------------------------------------------- */

function ManageUserModal({
  user,
  onClose,
  allPermissions,
  onChanged,
  viewerCanDelete,
}: {
  user: User | null;
  onClose: () => void;
  allPermissions: string[];
  onChanged: () => void;
  viewerCanDelete: boolean;
}) {
  const [role, setRole] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [className, setClassName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setPermissions(user.permissions || []);
      setTempPassword('');
      setClassName(user.className || '');
      setUsername(user.username || '');
    }
  }, [user]);

  if (!user) return null;

  const togglePerm = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const saveRoleAndPerms = async () => {
    setBusy(true);
    try {
      if (username.trim() && username.trim().toLowerCase() !== (user.username || '').toLowerCase()) {
        await apiRequest(`/users/${user._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ username: username.trim() }),
        });
      }
      if (role !== user.role) {
        await apiRequest(`/users/${user._id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role }),
        });
      }
      await apiRequest(`/users/${user._id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      });
      if ((className || '') !== (user.className || '')) {
        await apiRequest(`/users/${user._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ className }),
        });
      }
      toast.success('User updated');
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update user');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setBusy(true);
    try {
      const action = user.isActive === false ? 'activate' : 'deactivate';
      await apiRequest(`/users/${user._id}/${action}`, { method: 'PATCH' });
      toast.success(
        user.isActive === false ? 'Account activated' : 'Account deactivated',
      );
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    try {
      const res = await apiRequest(`/users/${user._id}/reset-password`, {
        method: 'POST',
      });
      setTempPassword(res?.temporaryPassword || '');
      toast.success('Temporary password generated');
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    const confirmed = window.confirm(
      `Permanently delete ${user.fullName || user.username}? This removes the account and all of their personal data (messages, notifications, support tickets). This cannot be undone.`,
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await apiRequest(`/users/${user._id}`, { method: 'DELETE' });
      toast.success('User permanently deleted');
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const canDeleteUsers = user.role === 'SUPER_ADMIN';

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      size="lg"
      title={user.fullName || user.username}
      description={`@${user.username} · ${user.email}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button onClick={saveRoleAndPerms} loading={busy}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button
              variant={user.isActive === false ? 'primary' : 'outline'}
              onClick={toggleActive}
              disabled={busy}
              className="flex-1"
            >
              {user.isActive === false ? 'Activate' : 'Deactivate'}
            </Button>
          </div>
        </div>

        {(role === 'STUDENT' || role === 'CLASS_REPRESENTATIVE') && (
          <Field
            label="Class / Section"
            hint="Links students to their Class Representative for messaging. Set the same value for a class and its CR."
          >
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. CSE-A 2026"
            />
          </Field>
        )}

        <div className="rounded-[12px] border border-[#e4e4e7] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#0071e3]" />
              <span className="text-[13px] font-medium">Credential reset</span>
            </div>
            <Button variant="secondary" size="sm" onClick={resetPassword} disabled={busy}>
              Generate temporary password
            </Button>
          </div>
          {tempPassword && (
            <div className="mt-3 rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] px-3 py-2 font-mono text-[13px]">
              {tempPassword}
              <p className="mt-1 font-sans text-[11px] leading-relaxed text-[#71717a]">
                Share securely — shown once. The user must change it after signing in.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0071e3]" />
            <Label>Permissions</Label>
          </div>
          <PermissionGrid
            all={allPermissions}
            selected={permissions}
            onToggle={togglePerm}
          />
        </div>

        {viewerCanDelete && (
          <div className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Delete account
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permanently removes this user and all of their data.
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={deleteUser} disabled={busy}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Permission grid                                                             */
/* -------------------------------------------------------------------------- */

function PermissionGrid({
  all,
  selected,
  onToggle,
}: {
  all: string[];
  selected: string[];
  onToggle: (perm: string) => void;
}) {
  const list = all.length ? all : selected;
  return (
    <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-[12px] border border-[#e4e4e7] p-3 sm:grid-cols-2">
      {list.map((perm) => {
        const checked = selected.includes(perm);
        return (
          <label
            key={perm}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] px-2 py-1.5 text-[12px] hover:bg-[#f4f4f5]"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(perm)}
              className="h-4 w-4 rounded-[10px] border-[#d4d4d8] text-[#09090b] focus:ring-[#09090b]/20"
            />
            <span className="font-mono text-xs">{perm}</span>
          </label>
        );
      })}
    </div>
  );
}
