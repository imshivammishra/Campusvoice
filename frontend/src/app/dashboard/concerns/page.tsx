'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { FileText, Info, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
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
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { AUTHORITY_ROLES } from '@/lib/rbac';
import {
  AUDIENCE_TYPES,
  CONCERN_CATEGORIES,
  CONFIDENTIALITY_OPTIONS,
} from '@/lib/governance';

export default function ConcernsPage() {
  const [concerns, setConcerns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/proposals?type=student_concern');
      setConcerns(data?.data || (Array.isArray(data) ? data : []));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load concerns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
    load();
  }, [load]);

  const role = user?.role || '';
  const canPublish =
    role === 'CLASS_REPRESENTATIVE' || AUTHORITY_ROLES.includes(role as any);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Concerns"
        description="Management concerns published by your Class Representative for the class to vote on."
      >
        {canPublish && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Publish concern
          </Button>
        )}
      </PageHeader>

      {!canPublish && (
        <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Only your elected Class Representative can publish formal concerns.
            To suggest an issue, use{' '}
            <Link href="/dashboard/cr-messages" className="font-medium text-primary">
              Message your CR
            </Link>{' '}
            — the CR reviews suggestions and decides what to publish for voting.
          </p>
        </Card>
      )}

      {loading ? (
        <ListSkeleton count={3} />
      ) : concerns.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No concerns yet"
          description={
            canPublish
              ? 'Publish your first concern — the class will be able to vote on it.'
              : 'When your Class Representative publishes a concern, it will appear here for you to vote on.'
          }
          action={
            canPublish ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Publish concern
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {concerns.map((p) => (
            <Link key={p._id || p.proposalId} href={`/dashboard/proposals/${p._id}`}>
              <Card hover className="p-6 hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {p.category && <Badge variant="secondary">{p.category}</Badge>}
                  {p.department && <Badge variant="outline">{p.department}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {typeof p.supportVotes === 'number'
                      ? `${p.supportVotes + (p.opposeVotes || 0) + (p.abstainVotes || 0)} votes`
                      : ''}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <RaiseConcernModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}

function RaiseConcernModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    category: CONCERN_CATEGORIES[0],
    department: '',
    description: '',
    proposedSolution: '',
    confidentiality: 'public',
    audienceType: 'class',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const user = getStoredUser() as any;
      setForm({
        title: '',
        category: CONCERN_CATEGORIES[0],
        department: user?.department || user?.departmentName || '',
        description: '',
        proposedSolution: '',
        confidentiality: 'public',
        audienceType: 'class',
      });
    }
  }, [open]);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.department.trim()) {
      toast.error('Title, description and department are required.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/proposals', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          type: 'student_concern',
          department: form.department.trim(),
          proposedSolution: form.proposedSolution.trim() || undefined,
          confidentiality: form.confidentiality,
          audienceType: form.audienceType,
        }),
      });
      toast.success('Concern published for class voting');
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to publish concern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Publish concern"
      description="Published to your class for anonymous voting. Only the CR can publish formal concerns."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Submit concern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Broken projector in Lab 2"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CONCERN_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Department" required>
            <Input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Computer Science"
            />
          </Field>
        </div>

        <Field label="Description" required>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the concern clearly and factually."
            className="min-h-[120px]"
          />
        </Field>

        <Field label="Proposed solution" hint="Optional — suggest how it could be resolved.">
          <Textarea
            value={form.proposedSolution}
            onChange={(e) =>
              setForm({ ...form, proposedSolution: e.target.value })
            }
            placeholder="Optional"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Audience">
            <Select
              value={form.audienceType}
              onChange={(e) =>
                setForm({ ...form, audienceType: e.target.value })
              }
            >
              {AUDIENCE_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Visibility">
            <Select
              value={form.confidentiality}
              onChange={(e) =>
                setForm({ ...form, confidentiality: e.target.value })
              }
            >
              {CONFIDENTIALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
