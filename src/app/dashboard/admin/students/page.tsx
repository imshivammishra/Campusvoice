'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Download, UsersRound } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Label,
  PageHeader,
  Table,
  TD,
  TH,
  THead,
  TR,
  Textarea,
} from '@/components/ui';

type Parsed = { fullName: string; studentId?: string; email?: string; password?: string };
type Result = {
  ok: boolean;
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  studentId?: string;
  error?: string;
};

function parseRows(text: string): Parsed[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^full\s*name/i.test(line))
    .map((line) => {
      const [fullName, studentId, email, password] = line
        .split(',')
        .map((p) => p.trim());
      return {
        fullName,
        studentId: studentId || undefined,
        email: email || undefined,
        password: password || undefined,
      };
    })
    .filter((r) => r.fullName);
}

export default function AdminStudentsPage() {
  const [text, setText] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [course, setCourse] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  const parsed = useMemo(() => parseRows(text), [text]);

  const submit = async () => {
    if (parsed.length === 0) {
      toast.error('Add at least one student (one per line).');
      return;
    }
    if (password.trim() && password.trim().length < 8) {
      toast.error('Custom password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setResults(null);
    try {
      const res = await apiRequest('/users/bulk', {
        method: 'POST',
        body: JSON.stringify({
          defaults: {
            className: className || undefined,
            section: section || undefined,
            course: course || undefined,
            password: password.trim() || undefined,
          },
          students: parsed,
        }),
      });
      setResults(res?.results || []);
      toast.success(
        `${res?.created ?? 0} student${res?.created === 1 ? '' : 's'} created` +
          (res?.failed ? `, ${res.failed} failed` : ''),
      );
    } catch (e: any) {
      toast.error(e?.message || 'Bulk import failed');
    } finally {
      setSaving(false);
    }
  };

  const credentialsCsv = useMemo(() => {
    if (!results) return '';
    const header = 'Full Name,Username,Password,Email,Student ID,Status';
    const lines = results.map((r) =>
      [
        r.fullName || '',
        r.username || '',
        r.password || '',
        r.email || '',
        r.studentId || '',
        r.ok ? 'created' : `failed: ${r.error || ''}`,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }, [results]);

  const copyCsv = async () => {
    try {
      await navigator.clipboard.writeText(credentialsCsv);
      toast.success('Credentials copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([credentialsCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-credentials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Add Students"
        description="Create many student logins at once. Each student receives a username and a temporary password."
      />

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Class (applied to all)">
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. CSE-3A"
            />
          </Field>
          <Field label="Section">
            <Input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. A"
            />
          </Field>
          <Field label="Course">
            <Input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. B.Tech CSE"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="Password for all students (optional)"
            hint="Leave blank to auto-generate a unique password for each student. If set, every student in this batch logs in with this password (min 8 characters). You can also override it per student with a 4th column."
          >
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. 12345678"
            />
          </Field>
        </div>

        <div className="mt-5">
          <Label>Students</Label>
          <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
            One student per line, comma-separated:{' '}
            <code className="rounded bg-secondary px-1">
              Full Name, Student ID, Email (optional), Password (optional)
            </code>
            . Username is generated from the student&apos;s name. If no password is given, a
            secure one is generated automatically.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[180px] font-mono text-xs"
            placeholder={`Riya Sharma, CSE2026001\nArjun Mehta, CSE2026002, arjun@college.edu\nPriya Nair, CSE2026003, , mypass123`}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {parsed.length} student{parsed.length === 1 ? '' : 's'} ready
          </p>
          <Button onClick={submit} loading={saving} disabled={parsed.length === 0}>
            <UsersRound className="h-4 w-4" />
            Create {parsed.length || ''} accounts
          </Button>
        </div>
      </Card>

      {results && (
        <Card>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Generated credentials</p>
              <p className="text-xs text-muted-foreground">
                Passwords are shown once — share them securely with students.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyCsv}>
                <Copy className="h-4 w-4" />
                Copy CSV
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCsv}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Username</TH>
                <TH>Password</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              {results.map((r, i) => (
                <TR key={i}>
                  <TD className="font-medium text-foreground">
                    {r.fullName || '—'}
                  </TD>
                  <TD className="font-mono text-xs">{r.username || '—'}</TD>
                  <TD className="font-mono text-xs">{r.password || '—'}</TD>
                  <TD>
                    {r.ok ? (
                      <Badge variant="success">Created</Badge>
                    ) : (
                      <Badge variant="danger" title={r.error}>
                        {r.error || 'Failed'}
                      </Badge>
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
