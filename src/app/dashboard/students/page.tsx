'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { Search, UsersRound } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Input,
  ListSkeleton,
  PageHeader,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';

type Student = {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  studentId?: string;
  className?: string;
  section?: string;
  course?: string;
  role?: string;
  isActive?: boolean;
};

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiRequest('/students')
      .then((data: any) =>
        setStudents(Array.isArray(data) ? data : data?.data || []),
      )
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.fullName, s.username, s.email, s.studentId, s.className]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [students, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Directory of all students across your classes."
      >
        <Badge variant="secondary">{students.length} total</Badge>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ID, class or email"
          className="pl-9"
        />
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={query ? 'No matching students' : 'No students yet'}
          description={
            query
              ? 'Try a different name, student ID or class.'
              : 'Students added by an administrator will appear here.'
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH>Student ID</TH>
                <TH>Class</TH>
                <TH>Role</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              {filtered.map((s) => (
                <TR key={s._id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={s.fullName || s.username}
                        className="h-9 w-9 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#1d1d1f]">
                          {s.fullName || s.username}
                        </p>
                        <p className="truncate text-[11.5px] text-[#86868b]">
                          {s.email || `@${s.username}`}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD className="font-mono text-[12px] text-[#424245]">
                    {s.studentId || '—'}
                  </TD>
                  <TD className="text-[12.5px] text-[#424245]">
                    {s.className || '—'}
                    {s.section ? ` · ${s.section}` : ''}
                  </TD>
                  <TD>
                    {s.role === 'CLASS_REPRESENTATIVE' ? (
                      <Badge variant="info">Class Rep</Badge>
                    ) : (
                      <Badge variant="secondary">Student</Badge>
                    )}
                  </TD>
                  <TD>
                    {s.isActive === false ? (
                      <Badge variant="danger">Inactive</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
