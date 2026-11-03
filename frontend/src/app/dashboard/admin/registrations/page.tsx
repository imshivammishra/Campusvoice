'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, UserPlus, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { roleLabel } from '@/lib/rbac';

type Registration = {
  _id: string;
  reference?: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  studentId?: string;
  employeeId?: string;
};

export default function AdminRegistrationsPage() {
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/registrations?status=${status}`);
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      await apiRequest(`/registrations/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      toast.success(action === 'approve' ? 'Registration approved' : 'Registration rejected');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registration Approvals"
        description="Review and process pending account requests."
      >
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-44"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </PageHeader>

      {loading ? (
        <ListSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={`No ${status} registrations`}
          description="Account requests awaiting your review will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <Card key={r._id} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{r.fullName}</h3>
                    <Badge variant="secondary">{roleLabel(r.role)}</Badge>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    @{r.username} · {r.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.studentId && <>Student ID: {r.studentId} · </>}
                    {r.employeeId && <>Employee ID: {r.employeeId} · </>}
                    {r.reference && <>Ref: {r.reference} · </>}
                    Requested {formatDate(r.createdAt)}
                  </p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => act(r._id, 'reject')}
                      disabled={busyId === r._id}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => act(r._id, 'approve')}
                      loading={busyId === r._id}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
