'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpRight, LifeBuoy, Plus, Send } from 'lucide-react';
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
        <div className="space-y-4">
          {tickets.map((t) => (
            <Card
              key={t._id || t.ticketId}
              hover
              className="group cursor-pointer overflow-hidden p-0"
              onClick={() => setActive(t)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e4e7] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                    {t.category || 'Support ticket'}
                    {t.confidentiality === 'confidential' && ' / confidential'}
                  </p>
                  <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#09090b]">
                    {t.subject}
                  </h3>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="px-5 py-4">
                <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[#71717a]">
                  {t.message}
                </p>
                <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f4f4f5] pt-3 text-[11px] text-[#a1a1aa]">
                  <span>Opened {formatDateTime(t.createdAt)}</span>
                  {t.confidentiality === 'confidential' && (
                    <Badge variant="warning">Confidential</Badge>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 font-medium text-[#0071e3]">
                    Open thread
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
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
          <div className="rounded-[4px] border border-[#e4e4e7] bg-[#fafafa] p-3 text-[12px]">
            <p className="font-medium text-[#09090b]">Original request</p>
            <p className="mt-1 leading-relaxed text-[#71717a]">{ticket.message}</p>
          </div>
          {loading ? (
            <p className="text-[12px] text-[#a1a1aa]">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-[#a1a1aa]">
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
                      'max-w-[75%] rounded-[6px] px-3 py-2 text-[12.5px] leading-relaxed',
                      mine ? 'bg-[#09090b] text-white' : 'bg-[#f4f4f5] text-[#18181b]',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        mine ? 'text-white/50' : 'text-[#a1a1aa]',
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

        <div className="mt-3 flex items-center gap-2 border-t border-[#e4e4e7] pt-3">
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

