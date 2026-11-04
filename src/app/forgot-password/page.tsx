'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { AuthLayout } from '@/components/auth-layout';
import { Button, Field, Input } from '@/components/ui';

type Step = 'request' | 'reset' | 'sent' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      setStep('reset');
    }
  }, []);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const data = await apiRequest<{ message?: string; resetToken?: string }>(
        '/auth/password-reset/request',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      setNotice(data?.message || 'If an account exists, a reset link has been sent.');
      if (data?.resetToken) {
        // Development only: the API returns the token so the flow can be
        // completed without an SMTP server.
        setToken(data.resetToken);
        setStep('reset');
      } else {
        setStep('sent');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not request a password reset.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={
        step === 'done'
          ? 'Password updated'
          : step === 'reset'
            ? 'Choose a new password'
            : 'Reset your password'
      }
      description={
        step === 'done'
          ? 'You can now sign in with your new password.'
          : step === 'reset'
            ? 'Paste the reset token you received and choose a new password.'
            : 'Enter the email address linked to your HUConnect account.'
      }
      panel="reset"
    >
      {error && (
        <div className="mb-5 border-l-2 border-destructive bg-destructive/[0.07] px-4 py-3 text-[12px] leading-relaxed text-destructive">
          {error}
        </div>
      )}

      {step === 'request' && (
        <form onSubmit={requestReset} className="space-y-5">
          <Field label="Email address" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@college.edu"
                className="pl-10"
                autoComplete="email"
                required
              />
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <p className="text-[12px] text-muted-foreground">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="font-medium text-[#0071e3] transition-colors hover:text-[#0b3a63] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}

      {step === 'sent' && (
        <div className="rounded-[16px] border border-[#e4e4e7] bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] text-[#0071e3]">
            <Mail className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-[#52525b]">
            {notice}
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#52525b]">
            If your institution has not configured email delivery yet, contact
            an administrator to reset your credentials.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="outline" onClick={() => setStep('reset')}>
              I already have a reset token
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      )}

      {step === 'reset' && (
        <form onSubmit={confirmReset} className="space-y-5">
          {notice && (
            <div className="rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#0071e3]">
              {notice}
            </div>
          )}
          <Field
            label="Reset token"
            required
            hint="Development mode returns the token automatically. In production it arrives by email."
          >
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste your reset token"
                className="pl-10 font-mono text-xs"
                required
              />
            </div>
          </Field>
          <Field label="New password" required hint="Minimum 8 characters.">
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
          <p className="text-[12px] text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setError('');
              }}
              className="font-medium text-[#0071e3] hover:underline"
            >
              Request a new token
            </button>
          </p>
        </form>
      )}

      {step === 'done' && (
        <div className="rounded-[16px] border border-[#e4e4e7] bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#bbf7d0] bg-[#f0fdf4] text-[#248a3d]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-[#52525b]">
            Your password has been changed and all other sessions have been
            signed out.
          </p>
          <Link href="/login" className="mt-6 block">
            <Button className="w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
