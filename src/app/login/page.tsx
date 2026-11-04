'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthBrandPanel, AuthFormFrame } from '@/components/auth-layout';
import { Button } from '@/components/ui';
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
    <div className="flex min-h-screen bg-[#f1eee6]">
      <AuthBrandPanel panel="login" />

      <AuthFormFrame>
        <div className="mb-9">
          <div className="flex items-center justify-between font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-[#7a7365]">
            <span>01 / Sign in</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2f5d3a]" />
              Secure session
            </span>
          </div>
          <h1 className="mt-4 font-editorial text-[clamp(3.4rem,6vw,4.6rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-[#171611]">
            Sign in<span className="text-[#a33a1b]">.</span>
          </h1>
          <p className="mt-4 max-w-[22rem] text-[13px] leading-relaxed text-[#5f5b4f]">
            Use your campus credentials. Your ballot stays separate from your
            name — always.
          </p>
        </div>

        {checking ? (
          <div className="flex items-center gap-3 border-y border-[#171611]/15 py-4 text-[12px] text-[#5f5b4f]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#a33a1b] border-t-transparent" />
            Checking your session…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="border-l-2 border-[#8f1d13] bg-[#8f1d13]/[0.055] px-4 py-3 text-[12px] leading-relaxed text-[#8f1d13]">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label
                  htmlFor="username"
                  className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-[#5f5b4f]"
                >
                  Username or email <span className="text-[#a33a1b]">*</span>
                </label>
                <span className="font-mono text-[7px] font-medium uppercase tracking-[0.16em] text-[#a29a8b]">
                  Required
                </span>
              </div>
              <input
                id="username"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="student1 or you@college.edu"
                autoComplete="username"
                className="mt-1.5 w-full border-0 border-b border-[#b8b09f] bg-transparent px-0 py-3 text-[16px] text-[#171611] outline-none transition-colors placeholder:text-[#a29a8b] focus:border-[#171611] focus:ring-0"
                required
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label
                  htmlFor="password"
                  className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-[#5f5b4f]"
                >
                  Password <span className="text-[#a33a1b]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-[#a33a1b] underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="mt-1.5 w-full border-0 border-b border-[#b8b09f] bg-transparent py-3 pr-11 text-[16px] text-[#171611] outline-none transition-colors placeholder:text-[#a29a8b] focus:border-[#171611] focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute bottom-2.5 right-0 p-1 text-[#7a7365] transition-colors hover:text-[#171611]"
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
              className="group h-12 w-full justify-between px-5"
              size="lg"
              loading={loading}
            >
              <span>{loading ? 'Signing in…' : 'Enter the workspace'}</span>
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>
          </form>
        )}

        {showDemo && !checking && (
          <details className="group mt-8 border-t border-[#171611]/15">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 font-mono text-[8px] font-medium uppercase tracking-[0.15em] text-[#5f5b4f] transition-colors hover:text-[#a33a1b]">
              <span>Demo access</span>
              <span className="text-[7px] tracking-[0.18em] text-[#a29a8b]">
                Local only · click to reveal
              </span>
            </summary>
            <div className="border-t border-[#171611]/10">
              {DEMO_ACCOUNTS.map((account, index) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail(account.username);
                    setPassword(account.password);
                    setError('');
                  }}
                  className="group/row flex w-full items-center gap-3 border-b border-[#171611]/10 py-2.5 text-left transition-colors last:border-0 hover:bg-[#e9e4d8]/60"
                >
                  <span className="font-mono text-[8px] text-[#a29a8b]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-[12px] font-medium text-[#171611]">
                    {account.label}
                  </span>
                  <span className="font-mono text-[9px] text-[#7a7365] group-hover/row:text-[#a33a1b]">
                    {account.username}
                  </span>
                  <ArrowRight className="h-3 w-3 text-[#a29a8b] transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-[#a33a1b]" />
                </button>
              ))}
            </div>
          </details>
        )}

        <p className="mt-7 flex flex-wrap items-baseline gap-x-2 text-[12px] text-[#5f5b4f]">
          New to CampusVoice?
          <Link
            href="/register"
            className="border-b border-[#171611]/40 pb-0.5 font-medium text-[#171611] transition-colors hover:border-[#a33a1b] hover:text-[#a33a1b]"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-8 font-mono text-[7px] font-medium uppercase tracking-[0.18em] text-[#a29a8b]">
          One person, one vote · Anonymous by design · Audit-ready
        </p>
      </AuthFormFrame>
    </div>
  );
}
