'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  UserRound,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { AuthLayout } from '@/components/auth-layout';
import { Button, Field, Input, Select } from '@/components/ui';

type Option = {
  _id: string;
  name: string;
  code?: string;
};

type RegisterOptions = {
  institutions: Option[];
  departments: (Option & { institutionId?: string })[];
  classes: (Option & { departmentId?: string; institutionId?: string; semester?: number; section?: string })[];
};

const EMPTY_OPTIONS: RegisterOptions = {
  institutions: [],
  departments: [],
  classes: [],
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    studentId: '',
    employeeId: '',
    course: '',
    semester: '',
    section: '',
    phone: '',
    designation: '',
    institutionId: '',
    departmentId: '',
    classId: '',
  });
  const [options, setOptions] = useState<RegisterOptions>(EMPTY_OPTIONS);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ message: string; reference?: string } | null>(
    null,
  );

  useEffect(() => {
    apiRequest<RegisterOptions>('/auth/register-options')
      .then((data) => {
        const next = {
          institutions: data?.institutions || [],
          departments: data?.departments || [],
          classes: data?.classes || [],
        };
        setOptions(next);
        if (next.institutions[0]) {
          setForm((current) => ({
            ...current,
            institutionId: current.institutionId || next.institutions[0]._id,
          }));
        }
      })
      .catch(() => setOptions(EMPTY_OPTIONS))
      .finally(() => setLoadingOptions(false));
  }, []);

  const departments = useMemo(
    () =>
      options.departments.filter(
        (department) =>
          !form.institutionId || department.institutionId === form.institutionId,
      ),
    [options.departments, form.institutionId],
  );

  const classes = useMemo(
    () =>
      options.classes.filter(
        (klass) =>
          !form.departmentId || klass.departmentId === form.departmentId,
      ),
    [options.classes, form.departmentId],
  );

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleInstitutionChange = (value: string) => {
    setForm((current) => ({
      ...current,
      institutionId: value,
      departmentId: '',
      classId: '',
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setForm((current) => ({
      ...current,
      departmentId: value,
      classId: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest<{ message: string; reference?: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            studentId: form.studentId.trim() || undefined,
            employeeId: form.employeeId.trim() || undefined,
            course: form.course.trim() || undefined,
            semester: form.semester || undefined,
            section: form.section.trim() || undefined,
            phone: form.phone.trim() || undefined,
            designation: form.designation.trim() || undefined,
            institutionId: form.institutionId || undefined,
            departmentId: form.departmentId || undefined,
            classId: form.classId || undefined,
          }),
        },
      );
      setSuccess({
        message:
          data?.message ||
          'Registration submitted. An administrator will review your account.',
        reference: data?.reference,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Registration submitted"
        description="Your request is now waiting for administrator approval."
        wide
        panel="register"
      >
        <div className="rounded-[16px] border border-[#e4e4e7] bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#bbf7d0] bg-[#f0fdf4] text-[#248a3d]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-[#52525b]">
            {success.message}
          </p>
          {success.reference && (
            <p className="mt-4 rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] px-3.5 py-2.5 text-[11px] text-[#71717a]">
              Reference{' '}
              <span className="ml-1.5 font-mono text-[11px] text-[#09090b]">
                {success.reference}
              </span>
            </p>
          )}
          <p className="mt-4 text-[12.5px] leading-relaxed text-[#52525b]">
            You will be able to sign in once a registrar or administrator
            approves your account.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="flex-1">
              <Button className="w-full">
                Go to sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSuccess(null);
                setForm((current) => ({
                  ...current,
                  password: '',
                  confirmPassword: '',
                }));
              }}
            >
              Register another account
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Registration is reviewed by your institution before activation."
      wide
      panel="register"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="border-l-2 border-destructive bg-destructive/[0.07] px-4 py-3 text-[12px] leading-relaxed text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input
              value={form.fullName}
              onChange={(event) => update('fullName', event.target.value)}
              placeholder="Priya Verma"
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Username" required hint="3-32 letters, numbers, dots, dashes or underscores.">
            <Input
              value={form.username}
              onChange={(event) => update('username', event.target.value)}
              placeholder="priya.verma"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="priya@college.edu"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </Field>
          <Field label="Password" required hint="Minimum 8 characters.">
            <Input
              type="password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm password" required>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => update('confirmPassword', event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium text-[#3f3f46]">
            I am registering as
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { value: 'STUDENT', label: 'Student', icon: GraduationCap },
              { value: 'TEACHER', label: 'Teacher', icon: Briefcase },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update('role', option.value)}
                className={`flex items-center gap-3 rounded-[12px] border p-3.5 text-left transition-colors ${
                  form.role === option.value
                    ? 'border-[#09090b] bg-[#fafafa]'
                    : 'border-[#d4d4d8] bg-white hover:border-[#a1a1aa]'
                }`}
              >
                <option.icon className="h-4 w-4 text-[#0071e3]" />
                <span className="text-[12.5px] font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {form.role === 'STUDENT' ? (
            <>
              <Field label="Student ID" hint="Leave blank if it has not been assigned yet.">
                <Input
                  value={form.studentId}
                  onChange={(event) => update('studentId', event.target.value)}
                  placeholder="STU-2023-014"
                />
              </Field>
              <Field label="Course">
                <Input
                  value={form.course}
                  onChange={(event) => update('course', event.target.value)}
                  placeholder="B.Tech CSE"
                />
              </Field>
              <Field label="Semester">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.semester}
                  onChange={(event) => update('semester', event.target.value)}
                  placeholder="5"
                />
              </Field>
              <Field label="Section">
                <Input
                  value={form.section}
                  onChange={(event) => update('section', event.target.value)}
                  placeholder="A"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Employee ID" hint="Leave blank if it has not been assigned yet.">
                <Input
                  value={form.employeeId}
                  onChange={(event) => update('employeeId', event.target.value)}
                  placeholder="EMP-1001"
                />
              </Field>
              <Field label="Designation">
                <Input
                  value={form.designation}
                  onChange={(event) => update('designation', event.target.value)}
                  placeholder="Assistant Professor"
                />
              </Field>
            </>
          )}
        </div>

        <div className="rounded-[16px] border border-[#e4e4e7] bg-[#fafafa] p-4">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
            <UserRound className="h-3.5 w-3.5 text-[#0071e3]" />
            Institutional details
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Institution">
              <Select
                value={form.institutionId}
                onChange={(event) => handleInstitutionChange(event.target.value)}
                disabled={loadingOptions}
              >
                <option value="">Not specified</option>
                {options.institutions.map((institution) => (
                  <option key={institution._id} value={institution._id}>
                    {institution.name}
                    {institution.code ? ` (${institution.code})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Department">
              <Select
                value={form.departmentId}
                onChange={(event) => handleDepartmentChange(event.target.value)}
                disabled={loadingOptions || !form.institutionId}
              >
                <option value="">Not specified</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                    {department.code ? ` (${department.code})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            {form.role === 'STUDENT' && (
              <Field label="Class">
                <Select
                  value={form.classId}
                  onChange={(event) => update('classId', event.target.value)}
                  disabled={loadingOptions || !form.departmentId}
                >
                  <option value="">Not specified</option>
                  {classes.map((klass) => (
                    <option key={klass._id} value={klass._id}>
                      {klass.name}
                      {klass.section ? ` · Section ${klass.section}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
          {!loadingOptions && options.institutions.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              No institutions have been configured yet. You can still register;
              an administrator will assign your institution later.
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Submitting registration…' : 'Create account'}
        </Button>

        <p className="text-[12px] text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[#0071e3] transition-colors hover:text-[#0b3a63] hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-[11px] text-[#a1a1aa]">
          No Google login · No social login · Username &amp; password only
        </p>
      </form>
    </AuthLayout>
  );
}
