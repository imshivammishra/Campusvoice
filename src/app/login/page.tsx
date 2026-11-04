'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthBrandPanel, AuthFormFrame } from '@/components/auth-layout';
import { Button, Field, Input, Label } from '@/components/ui';
import { login, getStoredUser, fetchCurrentUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
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
          <div className="mb-5 flex items-center gap-2.5 rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] px-3 py-2.5 text-[11.5px] text-[#71717a]">
            <span className="h-3 w-3 animate-spin rounded-full border border-[#09090b] border-t-transparent" />
            Checking for an existing session…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#d70015]">
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
                Password <span className="ml-0.5 text-[#d70015]">*</span>
              </Label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-[#0071e3] transition-colors hover:text-[#0b3a63] hover:underline"
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
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[10px] p-1.5 text-[#a1a1aa] transition-colors hover:bg-[#f4f4f5] hover:text-[#3f3f46]"
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
          Accounts are created by your institution&apos;s administrator. Contact
          them if you need access.
        </p>
      </AuthFormFrame>
    </div>
  );
}
