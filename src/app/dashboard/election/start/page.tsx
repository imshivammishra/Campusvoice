'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Play, Vote } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import { AUTHORITY_ROLES } from '@/lib/rbac';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Label,
  ListSkeleton,
  PageHeader,
  Select,
} from '@/components/ui';

function canStartElections(user: AuthUser | null) {
  if (!user) return false;
  return (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'REGISTRAR' ||
    user.role === 'TEACHER' ||
    AUTHORITY_ROLES.includes(user.role as any) ||
    Boolean(user.permissions?.includes('elections:create'))
  );
}

type ClassItem = { _id: string; name: string; code?: string };

export default function StartCrVotingPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    apiRequest('/classes')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setClasses(list);
      })
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = canStartElections(user);

  const startVoting = async () => {
    setStarting(true);
    setResult(null);
    try {
      const res: any = await apiRequest('/elections/start', {
        method: 'POST',
        body: JSON.stringify({ classId: classId || undefined }),
      });
      const message = res?.message || 'CR voting started.';
      setResult(message);
      toast.success(message);
    } catch (error: any) {
      const message = error?.message || 'Could not start CR voting';
      setResult(message);
      toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Start CR Voting" description="Manual Class Representative election control." />
        <EmptyState
          icon={Vote}
          title="Not available"
          description="Only administrators can start CR voting."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Start CR Voting"
        description="Open a 24-hour Class Representative election for one class or for every active class."
      >
        <Link href="/dashboard/election">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to elections
          </Button>
        </Link>
      </PageHeader>

      <Card className="max-w-xl p-6">
        {loading ? (
          <ListSkeleton count={2} />
        ) : (
          <div className="space-y-4">
            <Field label="Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All active classes</option>
                {classes.map((klass) => (
                  <option key={klass._id} value={klass._id}>
                    {klass.name}
                    {klass.code ? ` (${klass.code})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="text-xs text-muted-foreground">
              Leave blank to start voting for every active class that does not already
              have an open election.
            </p>
            <Button onClick={startVoting} loading={starting}>
              <Play className="h-4 w-4" />
              Start CR voting
            </Button>
            {result && (
              <p className="text-sm font-medium text-foreground">{result}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
