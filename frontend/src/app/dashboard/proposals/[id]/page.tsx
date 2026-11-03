'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowUpCircle,
  CheckCircle2,
  FileCheck2,
  Forward,
  Lock,
  Megaphone,
  Paperclip,
  ThumbsDown,
  ThumbsUp,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import { apiRequest, fileUrl, uploadFile } from '@/lib/api';
import { fetchCurrentUser, getStoredUser, type AuthUser } from '@/lib/auth';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Spinner,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { AUTHORITY_ROLES, roleLabel } from '@/lib/rbac';

const EVENT_ICON: Record<string, any> = {
  raised: Megaphone,
  voting_opened: ThumbsUp,
  voting_closed: Lock,
  forwarded: Forward,
  under_review: FileCheck2,
  resolved: CheckCircle2,
  escalated: ArrowUpCircle,
  rejected: XCircle,
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest(`/proposals/${id}`);
      setItem(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => {});
    load();
  }, [load]);

  const act = async (fn: () => Promise<any>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const vote = (choice: string) =>
    act(
      () =>
        apiRequest(`/proposals/${id}/vote`, {
          method: 'POST',
          body: JSON.stringify({ choice }),
        }),
      'Your vote has been recorded',
    );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (!item) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Item not found.
      </Card>
    );
  }

  const role = user?.role || '';
  const perms = user?.permissions || [];
  const isAuthority = AUTHORITY_ROLES.includes(role as any);
  const canForward =
    role === 'CLASS_REPRESENTATIVE' ||
    isAuthority ||
    perms.includes('proposals:forward') ||
    perms.includes('proposals:publish');
  const canReview =
    role === 'TEACHER' ||
    isAuthority ||
    perms.includes('resolutions:update') ||
    perms.includes('proposals:review');

  const support = item.supportVotes || 0;
  const oppose = item.opposeVotes || 0;
  const abstain = item.abstainVotes || 0;
  const total = support + oppose + abstain;
  const canVoteNow = item.status === 'voting_active' && !item.hasVoted && !item.isOwner;

  const events = [...(item.events || [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.category && <Badge variant="secondary">{item.category}</Badge>}
                  {item.department && <Badge variant="outline">{item.department}</Badge>}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {item.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Raised by {item.raisedByName || 'Unknown'}
                  {item.raisedByRole ? ` (${roleLabel(item.raisedByRole)})` : ''}
                  {' · '}
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground">
              {item.description}
            </p>
            {item.proposedSolution && (
              <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proposed solution
                </p>
                <p className="mt-1 text-sm">{item.proposedSolution}</p>
              </div>
            )}
          </Card>

          {/* Resolution proof */}
          {item.status === 'resolved' && (
            <Card className="border-emerald-500/30 bg-emerald-50/50 p-6 dark:bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold">Resolved</h2>
              </div>
              {item.resolutionNote && (
                <p className="mt-2 text-sm text-foreground">{item.resolutionNote}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                By {item.resolvedByName} · {formatDateTime(item.resolvedAt)}
              </p>
              {item.proofAttachments?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Proof of resolution
                  </p>
                  <ProofGrid files={item.proofAttachments} />
                </div>
              )}
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">Timeline</h2>
            <ol className="relative space-y-5 border-l border-border pl-6">
              {events.map((ev: any, i: number) => {
                const Icon = EVENT_ICON[ev.action] || FileCheck2;
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="font-medium capitalize text-foreground">
                        {ev.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-muted-foreground">
                        by {ev.actorName}
                        {ev.actorRole ? ` (${roleLabel(ev.actorRole)})` : ''}
                      </span>
                    </div>
                    {ev.note && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{ev.note}</p>
                    )}
                    {ev.attachments?.length > 0 && (
                      <div className="mt-2">
                        <ProofGrid files={ev.attachments} compact />
                      </div>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(ev.at)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Votes */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Votes</h2>
              <span className="text-sm text-muted-foreground">{total} total</span>
            </div>
            <div className="mt-4 space-y-3">
              <VoteBar label="Support" value={support} total={total} color="bg-emerald-500" />
              <VoteBar label="Oppose" value={oppose} total={total} color="bg-red-500" />
              <VoteBar label="Abstain" value={abstain} total={total} color="bg-muted-foreground" />
            </div>

            {canVoteNow ? (
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" disabled={busy} onClick={() => vote('support')}>
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => vote('oppose')}>
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => vote('abstain')}>
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                {item.isOwner
                  ? 'You cannot vote on your own submission.'
                  : item.hasVoted
                    ? 'You have already voted. Thank you!'
                    : item.status === 'voting_active'
                      ? ''
                      : 'Voting is closed.'}
              </p>
            )}
          </Card>

          {/* Actions */}
          {(canForward || canReview) && item.status !== 'resolved' && item.status !== 'rejected' && (
            <Card className="p-6">
              <h2 className="mb-4 font-semibold">Actions</h2>
              <div className="space-y-2">
                {canForward && (item.status === 'draft' || item.status === 'pending_review' || item.status === 'approved_for_voting') && (
                  <Button
                    className="w-full"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => apiRequest(`/proposals/${id}/start-voting`, { method: 'POST', body: '{}' }),
                        'Voting started',
                      )
                    }
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Start voting
                  </Button>
                )}
                {canForward && item.status === 'voting_active' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => apiRequest(`/proposals/${id}/close-voting`, { method: 'POST', body: '{}' }),
                        'Voting closed',
                      )
                    }
                  >
                    <Lock className="h-4 w-4" />
                    Close voting
                  </Button>
                )}
                {canForward &&
                  (item.status === 'voting_closed' || item.status === 'voting_active') && (
                    <Button
                      className="w-full"
                      disabled={busy}
                      onClick={() =>
                        act(
                          () =>
                            apiRequest(`/proposals/${id}/forward`, {
                              method: 'POST',
                              body: JSON.stringify({ forwardTo: 'TEACHER' }),
                            }),
                          'Forwarded to teacher',
                        )
                      }
                    >
                      <Forward className="h-4 w-4" />
                      Forward to teacher
                    </Button>
                  )}
                {canReview &&
                  ['forwarded', 'escalated', 'voting_closed', 'under_review'].includes(
                    item.status,
                  ) && (
                    <>
                      <Button className="w-full" disabled={busy} onClick={() => setResolveOpen(true)}>
                        <CheckCircle2 className="h-4 w-4" />
                        Mark resolved (with proof)
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={busy}
                        onClick={() => setEscalateOpen(true)}
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Escalate to higher authority
                      </Button>
                    </>
                  )}
                {(canReview || canForward) &&
                  !['resolved', 'rejected'].includes(item.status) && (
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:bg-destructive/10"
                      disabled={busy}
                      onClick={() =>
                        act(
                          () =>
                            apiRequest(`/proposals/${id}/reject`, {
                              method: 'POST',
                              body: JSON.stringify({ note: 'Closed without action' }),
                            }),
                          'Item rejected',
                        )
                      }
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ResolveModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onDone={async (note, attachments) => {
          await act(
            () =>
              apiRequest(`/proposals/${id}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ note, attachments }),
              }),
            'Marked as resolved',
          );
          setResolveOpen(false);
        }}
      />

      <EscalateModal
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        onDone={async (note, escalateTo) => {
          await act(
            () =>
              apiRequest(`/proposals/${id}/escalate`, {
                method: 'POST',
                body: JSON.stringify({ note, escalateTo }),
              }),
            'Escalated to higher authority',
          );
          setEscalateOpen(false);
        }}
      />
    </div>
  );
}

function VoteBar({ label, value, total, color }: any) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProofGrid({ files, compact }: { files: string[]; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {files.map((f, i) => {
        const url = fileUrl(f);
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(f);
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="proof"
                className={`rounded-lg border border-border object-cover ${compact ? 'h-16 w-16' : 'h-28 w-28'}`}
              />
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary">
                <Paperclip className="h-4 w-4" />
                Document
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

function ResolveModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (note: string, attachments: string[]) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNote('');
      setFiles([]);
    }
  }, [open]);

  const onPick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(list)) {
        const res = await uploadFile(f);
        setFiles((prev) => [...prev, { url: res.url, name: res.name }]);
      }
      toast.success('File uploaded');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!note.trim()) {
      toast.error('Add a short resolution note.');
      return;
    }
    if (files.length === 0) {
      toast.error('Attach at least one proof (image or document).');
      return;
    }
    setSaving(true);
    try {
      await onDone(note.trim(), files.map((f) => f.url));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark as resolved"
      description="Proof of resolution is mandatory and visible to all students."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={uploading}>
            Confirm resolved
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Resolution note" required>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe what was done to resolve this."
          />
        </Field>
        <Field label="Proof (image or document)" required hint="PNG, JPG, PDF or DOC up to 10MB.">
          <Input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={(e) => onPick(e.target.files)}
            disabled={uploading}
          />
        </Field>
        {uploading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Uploading…
          </p>
        )}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <Badge key={i} variant="success">
                <Paperclip className="h-3 w-3" />
                {f.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function EscalateModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (note: string, escalateTo: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [to, setTo] = useState('HOD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNote('');
      setTo('HOD');
    }
  }, [open]);

  const submit = async () => {
    setSaving(true);
    try {
      await onDone(note.trim(), to);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Escalate to higher authority"
      description="Use this when the issue cannot be resolved at your level."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Escalate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Escalate to">
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="HOD">Head of Department</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="REGISTRAR">Registrar</option>
            <option value="PRO_VICE_CHANCELLOR">Pro Vice-Chancellor</option>
            <option value="CHAIRMAN">Chairman</option>
          </select>
        </Field>
        <Field label="Reason / note">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why does this need higher authority?"
          />
        </Field>
      </div>
    </Modal>
  );
}
