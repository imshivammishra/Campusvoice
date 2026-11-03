'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LifeBuoy, Plus, Send } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import {
  Avatar,
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
import { cn, formatDateTime } from '@/lib/utils';

const CATEGORIES = [
  'Student Welfare',
  'Grievance',
  'Harassment / Safety',
  'Academic',
  'Administrative',
  'Other',
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = getStoredUser();
      setUser(u);
      const data = await apiRequest('/support');
      const list = Array.isArray(data) ? data : data?.data || [];
      const myId = (u?.sub || u?._id || '').toString();
      // Show tickets the user created (privacy for confidential channels)
      setTickets(list.filter((t: any) => !myId || t.createdBy === myId || t.createdBy?._id === myId));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Private support and confidential grievance channels."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New ticket
        </Button>
      </PageHeader>

      {loading ? (
        <ListSkeleton count={2} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets"
          description="Open a private ticket to confidentially reach a welfare or grievance officer."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New ticket
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card
              key={t._id || t.ticketId}
              hover
              className="cursor-pointer p-5 hover:border-primary/40"
              onClick={() => setActive(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{t.subject}</h3>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {t.message}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {t.category && <Badge variant="secondary">{t.category}</Badge>}
                {t.confidentiality === 'confidential' && (
                  <Badge variant="warning">Confidential</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(t.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
      />

      <ThreadModal
        ticket={active}
        currentUserId={(user?.sub || user?._id || '').toString()}
        onClose={() => setActive(null)}
      />
    </div>
  );
}

function CreateTicketModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    subject: '',
    category: CATEGORIES[0],
    message: '',
    confidentiality: 'confidential',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open)
      setForm({
        subject: '',
        category: CATEGORIES[0],
        message: '',
        confidentiality: 'confidential',
      });
  }, [open]);

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/support', {
        method: 'POST',
        body: JSON.stringify({
          subject: form.subject.trim(),
          message: form.message.trim(),
          category: form.category,
          confidentiality: form.confidentiality,
        }),
      });
      toast.success('Ticket created');
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New support ticket"
      description="Reach a welfare or grievance officer privately."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create ticket
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Subject" required>
          <Input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Brief summary"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              <option value="confidential">Confidential</option>
              <option value="public">Public</option>
            </Select>
          </Field>
        </div>
        <Field label="Message" required>
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Describe your issue…"
            className="min-h-[120px]"
          />
        </Field>
      </div>
    </Modal>
  );
}

function ThreadModal({
  ticket,
  currentUserId,
  onClose,
}: {
  ticket: any;
  currentUserId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!ticket?.ticketId) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/support/${ticket.ticketId}/messages`);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [ticket]);

  useEffect(() => {
    if (ticket) {
      setText('');
      load();
    }
  }, [ticket, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await apiRequest(`/support/${ticket.ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      });
      setText('');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (!ticket) return null;

  return (
    <Modal
      open={!!ticket}
      onClose={onClose}
      size="lg"
      title={ticket.subject}
      description={`${ticket.category || 'Support'} · ${ticket.status?.replace(/_/g, ' ') || 'open'}`}
    >
      <div className="flex max-h-[55vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium text-foreground">Original request</p>
            <p className="mt-1 text-muted-foreground">{ticket.message}</p>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No replies yet. Start the conversation below.
            </p>
          ) : (
            messages.map((m) => {
              const mine = (m.senderId?._id || m.senderId)?.toString() === currentUserId;
              return (
                <div
                  key={m._id}
                  className={cn('flex gap-2', mine && 'flex-row-reverse')}
                >
                  <Avatar name={mine ? 'You' : 'Officer'} className="h-7 w-7 shrink-0" />
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                      mine
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                      )}
                    >
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message…"
          />
          <Button onClick={send} loading={sending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
