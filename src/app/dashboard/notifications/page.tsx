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
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n._id}
              onClick={() => markRead(n)}
              className={cn(
                'cursor-pointer p-5 transition-colors',
                !n.isRead && 'border-primary/40 bg-primary/5',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div>
                    <h3 className="font-medium text-foreground">{n.title}</h3>
                    {n.content && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {n.content}
                      </p>
                    )}
                    {n.type && (
                      <Badge variant="secondary" className="mt-2">
                        {n.type.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
