'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui';
import { login, getStoredUser, fetchCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  'Anonymous, verifiable campus elections',
  'Concerns tracked with real accountability',
  'One private, secure student workspace',
];

const STATS = [
  { value: '11', label: 'Governance roles' },
  { value: '100%', label: 'Anonymous ballots' },
  { value: '24/7', label: 'Audit coverage' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
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
    <div className="flex min-h-screen bg-[#0a223a] text-[#0a223a]">
      {/* ------------------------------ LEFT / BRAND ------------------------------ */}
      <aside className="relative hidden w-[52%] shrink-0 overflow-hidden border-r border-white/10 lg:block">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center grayscale"
          style={{ backgroundImage: "url('/assets/campus/campus-main.jpg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.72)_0%,rgba(10,10,10,0.82)_55%,rgba(10,10,10,0.96)_100%)]"
          aria-hidden="true"
        />
        {/* Hard grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label="HUConnect home"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/assets/branding/HUconnectLogo.svg"
                alt="HUConnect"
                className="h-7 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <span className="h-7 w-px bg-white/25" />
            <span className="inline-flex items-center rounded-[6px] border border-white/15 bg-white px-2 py-1.5">
              <img
                src="/assets/branding/haridwar-university-logo.png"
                alt="Haridwar University"
                className="h-8 w-auto object-contain"
              />
            </span>
          </div>

          <div className="max-w-lg">
            <span className="inline-flex items-center rounded-[4px] border border-white/25 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/70">
              Haridwar University · Digital Campus
            </span>
            <h1 className="mt-7 text-[52px] font-bold uppercase leading-[0.98] tracking-[-0.03em] text-white">
              Your campus.
              <br />
              Your voice.
              <br />
              Your future.
            </h1>
            <div className="mt-7 h-px w-16 bg-white/40" />
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/60">
              Sign in to the campus governance platform — elections, concerns and
              proposals in one private, accountable place.
            </p>

            <ul className="mt-9 space-y-3.5">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[13px] font-medium text-white/80"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-white/30">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 border border-white/15">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(index > 0 && 'border-l border-white/15')}
              >
                <div className="px-4 py-4">
                  <p className="text-[22px] font-bold tracking-[-0.03em] text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/45">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ------------------------------ RIGHT / FORM ------------------------------ */}
      <main className="flex w-full flex-1 items-center justify-center bg-white px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-9 flex items-center justify-center lg:hidden">
            <Link href="/" aria-label="HUConnect home">
              <img
                src="/assets/branding/HUconnectLogo.svg"
                alt="HUConnect"
                className="h-7 w-auto object-contain"
              />
            </Link>
          </div>

          <span className="inline-flex items-center rounded-[4px] bg-[#0a223a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            Secure sign in
          </span>
          <h2 className="mt-4 text-[34px] font-bold leading-[1.02] tracking-[-0.035em] text-[#0a223a]">
            Welcome back
          </h2>
          <div className="mt-3 h-[3px] w-10 bg-[#0a223a]" />
          <p className="mt-4 text-[13px] leading-relaxed text-[#52525b]">
            Sign in to your university account to continue.
          </p>

          {checking && (
            <div className="mt-5 flex items-center gap-2.5 rounded-[8px] border border-[#e4e4e7] bg-[#fafafa] px-3 py-2.5 text-[11.5px] font-medium text-[#52525b]">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0a223a] border-t-transparent" />
              Checking for an existing session…
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-[8px] border-2 border-[#0a223a] bg-[#fafafa] px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-[#0a223a]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Username / email */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#3f3f46]"
              >
                Student ID / Email
              </label>
              <div className="group relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a1a1aa] transition-colors group-focus-within:text-[#0a223a]" />
                <input
                  id="username"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="your.name or you@university.edu"
                  autoComplete="username"
                  required
                  className="h-[50px] w-full rounded-[8px] border-2 border-[#e4e4e7] bg-white pl-11 pr-4 text-[13.5px] font-medium text-[#0a223a] outline-none transition-colors placeholder:font-normal placeholder:text-[#a1a1aa] focus:border-[#0a223a]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#3f3f46]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11.5px] font-semibold text-[#0a223a] underline-offset-2 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a1a1aa] transition-colors group-focus-within:text-[#0a223a]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-[50px] w-full rounded-[8px] border-2 border-[#e4e4e7] bg-white pl-11 pr-12 text-[13.5px] font-medium text-[#0a223a] outline-none transition-colors placeholder:font-normal placeholder:text-[#a1a1aa] focus:border-[#0a223a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] p-2 text-[#a1a1aa] transition-colors hover:bg-[#f4f4f5] hover:text-[#0a223a]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[#3f3f46]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-[3px] border-2 border-[#d4d4d8] accent-[#0a223a] text-[#0a223a] focus:ring-0 focus:ring-offset-0"
                />
                Remember me
              </label>
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
                Secure session
              </span>
            </div>

            <Button
              type="submit"
              className="group h-[50px] w-full justify-between rounded-[8px] bg-[#0a223a] px-5 text-[13.5px] font-semibold uppercase tracking-[0.04em] hover:bg-[#0f2d4d] focus-visible:ring-[#0a223a]/25"
              loading={loading}
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>
          </form>

          <div className="mt-7 border-t border-[#e4e4e7] pt-5">
            <p className="text-[11.5px] leading-relaxed text-[#71717a]">
              Accounts are created by your institution&apos;s administrator.
              Contact them if you need access.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
              <Lock className="h-3 w-3" />
              Powered by HUConnect
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
