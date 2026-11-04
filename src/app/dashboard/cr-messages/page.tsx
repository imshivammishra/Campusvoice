'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessagesSquare, Send, UserRound } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Spinner,
} from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';

export default function CrMessagesPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => setUser(getStoredUser()), []);

  const isCr = user?.role === 'CLASS_REPRESENTATIVE';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCr ? 'Student Messages' : 'Message your CR'}
        description={
          isCr
            ? 'Private suggestions from your classmates. Review and decide what to publish.'
            : 'Privately suggest management issues to your Class Representative.'
        }
      />
      {isCr ? <CrInbox me={user} /> : <StudentThread me={user} />}
    </div>
  );
}

/* ----------------------------- Student view ------------------------------ */

function StudentThread({ me }: { me: AuthUser | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (me?.sub || me?._id || '').toString();

  const load = useCallback(async () => {
    try {
      const data = await apiRequest('/cr-messages');
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await apiRequest('/cr-messages', {
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

  return (
    <Card className="flex h-[65vh] flex-col p-0">
      <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3">
        <p className="text-[12px] font-medium text-[#3f3f46]">
          Private channel with your CR
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[#a1a1aa]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#248a3d]" />
          Confidential
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#e4e4e7] bg-[#fafafa] text-[#71717a]">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-[#09090b]">
              Start a private thread
            </p>
            <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#71717a]">
              Messages reach your Class Representative directly. They are not
              published to the class and never count as a vote.
            </p>
            <p className="mt-4 text-[10.5px] uppercase tracking-[0.08em] text-[#a1a1aa]">
              Visible to you and your CR only
            </p>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m._id} m={m} myId={myId} />)
        )}
        <div ref={bottomRef} />
      </div>
      <Composer
        value={text}
        onChange={setText}
        onSend={send}
        sending={sending}
        placeholder="Message your CR…"
      />
    </Card>
  );
}

/* ------------------------------- CR inbox -------------------------------- */

function CrInbox({ me }: { me: AuthUser | null }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (me?.sub || me?._id || '').toString();

  const load = useCallback(async () => {
    try {
      const data = await apiRequest('/cr-messages');
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      setActive((prev: any) =>
        prev ? list.find((c: any) => c.studentId === prev.studentId) || prev : null,
      );
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active]);

  const reply = async () => {
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      await apiRequest(`/cr-messages/reply/${active.studentId}`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      });
      setText('');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex h-[65vh] items-center justify-center">
        <Spinner />
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No student messages yet"
        description="When a classmate messages you privately, it will appear here."
      />
    );
  }

  const studentName = (c: any) =>
    c.studentName ||
    c.messages?.find((m: any) => m.studentName)?.studentName ||
    c.messages?.find((m: any) => m.senderRole === 'STUDENT')?.senderName ||
    'Student';

  return (
    <div className="grid h-[65vh] gap-4 md:grid-cols-[280px_1fr]">
      <Card className="overflow-y-auto p-2">
        {conversations.map((c) => (
          <button
            key={c.studentId}
            onClick={() => setActive(c)}
            className={cn(
              'flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors',
              active?.studentId === c.studentId
                ? 'bg-[#f4f4f5]'
                : 'hover:bg-[#fafafa]',
            )}
          >
            <Avatar name={studentName(c)} className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-[#09090b]">
                {studentName(c)}
              </p>
              <p className="truncate text-[11px] text-[#a1a1aa]">
                {c.lastMessage}
              </p>
            </div>
          </button>
        ))}
      </Card>

      <Card className="flex flex-col p-0">
        {active ? (
          <>
            <div className="border-b border-[#e4e4e7] px-5 py-3">
              <p className="text-[13px] font-semibold text-[#09090b]">
                {studentName(active)}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {active.messages.map((m: any) => (
                <Bubble key={m._id} m={m} myId={myId} />
              ))}
              <div ref={bottomRef} />
            </div>
            <Composer
              value={text}
              onChange={setText}
              onSend={reply}
              sending={sending}
              placeholder="Reply to student…"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------ Shared bits ------------------------------ */

function Bubble({ m, myId }: { m: any; myId: string }) {
  const mine = (m.senderId?._id || m.senderId)?.toString() === myId;
  return (
    <div className={cn('flex gap-2', mine && 'flex-row-reverse')}>
      <Avatar name={m.senderName} className="h-7 w-7 shrink-0" />
      <div
        className={cn(
          'max-w-[75%] rounded-[16px] px-3 py-2 text-[12.5px] leading-relaxed',
          mine ? 'bg-[#0071e3] text-white' : 'bg-[#f4f4f5] text-[#18181b]',
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
}

function Composer({
  value,
  onChange,
  onSend,
  sending,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-[#e4e4e7] p-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
      />
      <Button onClick={onSend} loading={sending} size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

