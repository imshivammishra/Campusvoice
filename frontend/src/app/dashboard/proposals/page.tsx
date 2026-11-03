'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Megaphone, Plus, ThumbsUp } from 'lucide-react';
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

const PROPOSAL_TYPES = [
  { value: 'teacher_proposal', label: 'Teacher Proposal' },
  { value: 'management_review', label: 'Management Review' },
  { value: 'improvement_request', label: 'Improvement Request' },
];

function canRaiseProposal(user: AuthUser | null) {
  if (!user) return false;
  return (
    user.role === 'TEACHER' ||
    AUTHORITY_ROLES.includes(user.role as any) ||
    (user.permissions || []).includes('proposals:create')
  );
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/proposals');
      setProposals(data?.data || (Array.isArray(data) ? data : []));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
    load();
  }, [load]);

  const mayRaise = canRaiseProposal(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher &amp; Management Proposals"
        description="The independent teacher governance community — separate from student concerns."
      >
        {mayRaise && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New proposal
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <ListSkeleton count={3} />
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No proposals yet"
          description="Governance proposals from students, teachers and authorities will appear here."
          action={
            mayRaise ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                New proposal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const total =
              (p.supportVotes || 0) + (p.opposeVotes || 0) + (p.abstainVotes || 0);
            return (
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
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    {p.type && (
                      <Badge variant="secondary">{p.type.replace(/_/g, ' ')}</Badge>
                    )}
                    {p.raisedByName && (
                      <span className="text-xs text-muted-foreground">
                        by {p.raisedByName}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {p.supportVotes || 0} support · {total} votes
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <NewProposalModal
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

function NewProposalModal({
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
    type: 'teacher_proposal',
    category: 'Institutional Improvement',
    department: '',
    description: '',
    proposedSolution: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const user = getStoredUser() as any;
      setForm({
        title: '',
        type: 'teacher_proposal',
        category: 'Institutional Improvement',
        department: user?.department || '',
        description: '',
        proposedSolution: '',
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
          type: form.type,
          department: form.department.trim(),
          proposedSolution: form.proposedSolution.trim() || undefined,
          confidentiality: 'public',
          audienceType: 'institution',
          community: 'teacher',
        }),
      });
      toast.success('Proposal published for voting');
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create proposal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New proposal"
      description="Published immediately and opened for voting. Every step is visible to all."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Publish proposal
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Revise internal assessment weightage"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" required>
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {PROPOSAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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
            placeholder="Describe the proposal."
            className="min-h-[120px]"
          />
        </Field>
        <Field label="Proposed solution" hint="Optional">
          <Textarea
            value={form.proposedSolution}
            onChange={(e) => setForm({ ...form, proposedSolution: e.target.value })}
            placeholder="Optional"
          />
        </Field>
      </div>
    </Modal>
  );
}
