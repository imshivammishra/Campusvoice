'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, Megaphone, Plus, ThumbsUp } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import {
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
      const items = data?.data || (Array.isArray(data) ? data : []);
      const current = getStoredUser();
      const isTeacherOrAuthority =
        current?.role === 'TEACHER' || AUTHORITY_ROLES.includes(current?.role as any);
      // Student concerns have their own workspace, but teachers and authorities
      // still see the ones a CR has forwarded to them.
      setProposals(
        items.filter((item: any) => {
          if (item.type !== 'student_concern') return true;
          return isTeacherOrAuthority && ['forwarded', 'escalated', 'resolved'].includes(String(item.status));
        }),
      );
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
            const typeLabel = String(p.type || 'Proposal').replace(/_/g, ' ');
            return (
              <Link key={p._id || p.proposalId} href={`/dashboard/proposals/${p._id}`}>
                <Card hover className="group overflow-hidden p-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                        <span>{typeLabel}</span>
                        {p.department && (
                          <>
                            <span className="text-[#d4d4d8]">/</span>
                            <span>{p.department}</span>
                          </>
                        )}
                      </p>
                      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#09090b]">
                        {p.title}
                      </h3>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="px-5 py-4">
                    {p.description && (
                      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[#71717a]">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f4f4f5] pt-3 text-[11px] text-[#a1a1aa]">
                      <span className="inline-flex items-center gap-1.5">
                        <ThumbsUp className="h-3 w-3" />
                        {p.supportVotes || 0} support
                      </span>
                      <span>{total} votes</span>
                      {p.raisedByName && (
                        <span>
                          Raised by{' '}
                          <span className="font-medium text-[#52525b]">
                            {p.raisedByName}
                          </span>
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 font-medium text-[#0071e3]">
                        Open record
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
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
