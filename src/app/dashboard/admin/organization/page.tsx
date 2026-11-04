'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, GraduationCap, Layers, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
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
import { cn } from '@/lib/utils';

type Tab = 'institutions' | 'departments' | 'classes';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'institutions', label: 'Institutions', icon: Building2 },
  { id: 'departments', label: 'Departments', icon: Layers },
  { id: 'classes', label: 'Classes', icon: GraduationCap },
];

export default function AdminOrganizationPage() {
  const [tab, setTab] = useState<Tab>('institutions');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [inst, dept, cls] = await Promise.allSettled([
      apiRequest('/institutions'),
      apiRequest('/departments'),
      apiRequest('/classes'),
    ]);
    setInstitutions(inst.status === 'fulfilled' ? asArray(inst.value) : []);
    setDepartments(dept.status === 'fulfilled' ? asArray(dept.value) : []);
    setClasses(cls.status === 'fulfilled' ? asArray(cls.value) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const deleteInstitution = async (id: string) => {
    try {
      await apiRequest(`/institutions/${id}`, { method: 'DELETE' });
      toast.success('Institution deleted');
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const instName = (id: string) =>
    institutions.find((i) => i._id === id)?.name || '—';
  const deptName = (id: string) =>
    departments.find((d) => d._id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Configure institutions, departments and classes."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New {tab.slice(0, -1)}
        </Button>
      </PageHeader>

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : tab === 'institutions' ? (
        institutions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No institutions"
            description="Create your first institution to begin configuring the organization."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH className="hidden md:table-cell">Contact</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {institutions.map((i) => (
                <TR key={i._id}>
                  <TD className="font-medium text-foreground">{i.name}</TD>
                  <TD>
                    <Badge variant="secondary">{i.code}</Badge>
                  </TD>
                  <TD className="hidden md:table-cell text-muted-foreground">
                    {i.email || i.phone || '—'}
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInstitution(i._id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )
      ) : tab === 'departments' ? (
        departments.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No departments"
            description="Create a department under an institution."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH className="hidden md:table-cell">Institution</TH>
              </TR>
            </THead>
            <tbody>
              {departments.map((d) => (
                <TR key={d._id}>
                  <TD className="font-medium text-foreground">{d.name}</TD>
                  <TD>
                    <Badge variant="secondary">{d.code}</Badge>
                  </TD>
                  <TD className="hidden md:table-cell text-muted-foreground">
                    {instName(d.institutionId)}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes"
          description="Create a class under a department."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Code</TH>
              <TH className="hidden md:table-cell">Department</TH>
              <TH>Year / Sem</TH>
            </TR>
          </THead>
          <tbody>
            {classes.map((c) => (
              <TR key={c._id}>
                <TD className="font-medium text-foreground">{c.name}</TD>
                <TD>
                  <Badge variant="secondary">{c.code}</Badge>
                </TD>
                <TD className="hidden md:table-cell text-muted-foreground">
                  {deptName(c.departmentId)}
                </TD>
                <TD className="text-muted-foreground">
                  {c.academicYear} · Sem {c.semester}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <CreateEntityModal
        tab={tab}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        institutions={institutions}
        departments={departments}
        onCreated={() => {
          setCreateOpen(false);
          loadAll();
        }}
      />
    </div>
  );
}

function asArray(v: any): any[] {
  return Array.isArray(v) ? v : v?.data || [];
}

function CreateEntityModal({
  tab,
  open,
  onClose,
  institutions,
  departments,
  onCreated,
}: {
  tab: Tab;
  open: boolean;
  onClose: () => void;
  institutions: any[];
  departments: any[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({});
  }, [open, tab]);

  const submit = async () => {
    setSaving(true);
    try {
      if (tab === 'institutions') {
        if (!form.name || !form.code) {
          toast.error('Name and code are required.');
          setSaving(false);
          return;
        }
        await apiRequest('/institutions', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            email: form.email || undefined,
            phone: form.phone || undefined,
            address: form.address || undefined,
          }),
        });
      } else if (tab === 'departments') {
        if (!form.name || !form.code || !form.institutionId) {
          toast.error('Name, code and institution are required.');
          setSaving(false);
          return;
        }
        await apiRequest('/departments', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            institutionId: form.institutionId,
          }),
        });
      } else {
        if (!form.name || !form.code || !form.departmentId) {
          toast.error('Name, code and department are required.');
          setSaving(false);
          return;
        }
        await apiRequest('/classes', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            departmentId: form.departmentId,
            academicYear: Number(form.academicYear) || new Date().getFullYear(),
            semester: Number(form.semester) || 1,
          }),
        });
      }
      toast.success('Created successfully');
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const title =
    tab === 'institutions'
      ? 'New institution'
      : tab === 'departments'
        ? 'New department'
        : 'New class';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Code" required>
            <Input
              value={form.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. CSE"
            />
          </Field>
        </div>

        {tab === 'institutions' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}

        {tab === 'departments' && (
          <Field label="Institution" required>
            <Select
              value={form.institutionId || ''}
              onChange={(e) =>
                setForm({ ...form, institutionId: e.target.value })
              }
            >
              <option value="">Select institution</option>
              {institutions.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {tab === 'classes' && (
          <>
            <Field label="Department" required>
              <Select
                value={form.departmentId || ''}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Academic year">
                <Input
                  type="number"
                  value={form.academicYear || ''}
                  onChange={(e) =>
                    setForm({ ...form, academicYear: e.target.value })
                  }
                  placeholder={`${new Date().getFullYear()}`}
                />
              </Field>
              <Field label="Semester">
                <Input
                  type="number"
                  value={form.semester || ''}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  placeholder="1"
                />
              </Field>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
