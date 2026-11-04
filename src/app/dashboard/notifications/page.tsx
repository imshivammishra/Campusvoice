'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageHeader,
} from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/notifications');
      setNotifications(data?.data || (Array.isArray(data) ? data : []));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (n: any) => {
    if (n.isRead) return;
    setNotifications((prev) =>
      prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
    );
    try {
      await apiRequest(`/notifications/${n._id}/read`, { method: 'PATCH' });
    } catch {
      /* optimistic */
    }
  };

  const markAll = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setBusy(true);
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    try {
      await Promise.allSettled(
        unread.map((n) =>
          apiRequest(`/notifications/${n._id}/read`, { method: 'PATCH' }),
        ),
      );
      toast.success('All marked as read');
    } finally {
      setBusy(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates on your concerns, voting and resolutions."
      >
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAll} loading={busy}>
            <CheckCheck className="h-4 w-4" />
            Mark all read ({unreadCount})
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <ListSkeleton count={3} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Updates about your governance activity will show up here."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e4e7] bg-white px-5 py-3">
            <p className="text-[11.5px] font-medium text-[#3f3f46]">
              {unreadCount > 0
                ? `${unreadCount} unread of ${notifications.length} notices`
                : `${notifications.length} notices · all read`}
            </p>
            <span className="text-[10.5px] text-[#a1a1aa]">
              Select a notice to mark it read
            </span>
          </div>

          <div>
            {notifications.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => markRead(n)}
                className={cn(
                  'flex w-full items-start gap-3.5 border-b border-[#f4f4f5] px-5 py-4 text-left transition-colors last:border-0 hover:bg-[#fafafa]',
                  !n.isRead && 'bg-white',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[12px] border',
                    !n.isRead
                      ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#0071e3]'
                      : 'border-[#e4e4e7] bg-[#fafafa] text-[#a1a1aa]',
                  )}
                >
                  <Bell className="h-3 w-3" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        'text-[13px] leading-snug',
                        !n.isRead
                          ? 'font-semibold text-[#09090b]'
                          : 'font-medium text-[#3f3f46]',
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[10.5px] tabular-nums text-[#a1a1aa]">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </span>

                  {n.content && (
                    <span className="mt-1 block text-[12.5px] leading-relaxed text-[#71717a]">
                      {n.content}
                    </span>
                  )}

                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    {n.type && (
                      <Badge variant="secondary" className="normal-case">
                        {String(n.type).replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {!n.isRead && (
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#0071e3]">
                        <span className="h-1.5 w-1.5 rounded-[1px] bg-[#0071e3]" />
                        Unread
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
