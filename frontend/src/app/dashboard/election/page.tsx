'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Vote } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Card,
  EmptyState,
  ListSkeleton,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function ElectionPage() {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/elections')
      .then((data: any) => setElections(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="CR Elections"
        description="Weekly Class Representative elections for your class."
      />

      {loading ? (
        <ListSkeleton count={2} />
      ) : elections.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No active elections"
          description="There are no elections open right now. New CR elections open automatically each week."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <Card key={election._id || election.electionId} hover className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {election.title || 'CR Election'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Class: {election.className || election.classId || 'N/A'}
                  </p>
                </div>
                <StatusBadge status={election.status} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  <div>
                    <p className="text-xs uppercase tracking-wide">Opens</p>
                    <p className="font-medium text-foreground">
                      {formatDate(election.opensAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  <div>
                    <p className="text-xs uppercase tracking-wide">Closes</p>
                    <p className="font-medium text-foreground">
                      {formatDate(election.closesAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
