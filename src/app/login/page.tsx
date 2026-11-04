'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AuthBrandPanel, AuthFormFrame } from '@/components/auth-layout';
import { Button, Field, Input, Label } from '@/components/ui';
import { login, getStoredUser, fetchCurrentUser } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  { label: 'Student', username: 'student1', password: 'CampusVoice123!' },
  { label: 'Class Representative', username: 'cr1', password: 'CampusVoice123!' },
  { label: 'Teacher', username: 'teacher1', password: 'CampusVoice123!' },
  { label: 'Super Admin', username: 'super_admin', password: 'SuperAdmin123!' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    setShowDemo(isLocal);

    // If a valid cookie session already exists, skip the login form.
    if (!getStoredUser()) {
      setChecking(false);
      return;
    }
    fetchCurrentUser()
      .then(() => router.replace('/dashboard'))
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usernameOrEmail.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandPanel panel="login" />

      <AuthFormFrame>
        <div className="mb-7">
          <p className="text-[12px] font-medium text-[#71717a]">
            Sign in to HUConnect
          </p>
          <h1 className="mt-2 text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#09090b]">
            Welcome back.
          </h1>
          <p className="mt-2.5 max-w-[23rem] text-[13px] leading-relaxed text-[#52525b]">
            Use your campus credentials. Your ballot stays separate from your
            name — always.
          </p>
        </div>

        {checking && (
          <div className="mb-5 flex items-center gap-2.5 rounded-[4px] border border-[#e4e4e7] bg-[#fafafa] px-3 py-2.5 text-[11.5px] text-[#71717a]">
            <span className="h-3 w-3 animate-spin rounded-full border border-[#09090b] border-t-transparent" />
            Checking for an existing session…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[4px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#b91c1c]">
              {error}
            </div>
          )}

          <Field label="Username or email" required>
            <Input
              id="username"
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="student1 or you@college.edu"
              autoComplete="username"
              className="h-11"
              required
            />
          </Field>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label>
                Password <span className="ml-0.5 text-[#b91c1c]">*</span>
              </Label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-[#0f4c81] transition-colors hover:text-[#0b3a63] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-11 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[3px] p-1.5 text-[#a1a1aa] transition-colors hover:bg-[#f4f4f5] hover:text-[#3f3f46]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="group h-11 w-full justify-between px-4"
            size="lg"
            loading={loading}
          >
            <span>{loading ? 'Signing in…' : 'Sign in'}</span>
            {!loading && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </Button>
        </form>

        <p className="mt-5 text-[12.5px] text-[#52525b]">
          New to HUConnect?{' '}
          <Link
            href="/register"
            className="font-medium text-[#0f4c81] transition-colors hover:text-[#0b3a63] hover:underline"
          >
            Create an account
          </Link>
        </p>

        {showDemo && (
          <details className="group mt-6 rounded-[6px] border border-[#e4e4e7] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[12px] font-medium text-[#3f3f46]">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0f4c81]" />
                Demo accounts
              </span>
              <span className="text-[11px] font-normal text-[#a1a1aa]">
                4 accounts · local only
              </span>
            </summary>
            <div className="border-t border-[#e4e4e7]">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail(account.username);
                    setPassword(account.password);
                    setError('');
                  }}
                  className="group/row flex w-full items-center gap-3 border-b border-[#f4f4f5] px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-[#fafafa]"
                >
                  <span className="flex-1 text-[12px] font-medium text-[#09090b]">
                    {account.label}
                  </span>
                  <span className="font-mono text-[11px] text-[#71717a]">
                    {account.username}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#a1a1aa] transition-all group-hover/row:translate-x-0.5 group-hover/row:text-[#0f4c81]" />
                </button>
              ))}
            </div>
          </details>
        )}

        <p className="mt-6 flex items-center gap-1.5 text-[11px] text-[#a1a1aa]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Anonymous ballots · One vote per person · Audit-ready
        </p>
      </AuthFormFrame>
    </div>
  );
}
