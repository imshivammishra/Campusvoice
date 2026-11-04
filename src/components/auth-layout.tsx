import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { BrandVideo } from '@/components/brand-video';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const PANEL_CONTENT = {
  login: {
    eyebrow: 'Campus governance',
    title: (
      <>
        A clearer record
        <br />
        for every decision.
      </>
    ),
    description:
      'One secure workspace for elections, concerns and the decisions that follow — built around privacy, not paperwork.',
    points: ['Anonymous ballots', 'Verified eligibility', 'Auditable record'],
  },
  register: {
    eyebrow: 'Enrolment',
    title: (
      <>
        Join the
        <br />
        campus record.
      </>
    ),
    description:
      'Create your account to vote, raise concerns and follow every decision through to its outcome.',
    points: ['One identity', 'One ballot', 'Full traceability'],
  },
  reset: {
    eyebrow: 'Account recovery',
    title: (
      <>
        Restore access,
        <br />
        securely.
      </>
    ),
    description:
      'A single-use link returns you to your workspace. Your ballot history and privacy stay untouched.',
    points: ['Single-use link', 'Session revocation', 'Private by default'],
  },
} as const;

export function AuthBrandPanel({
  panel = 'login',
}: {
  panel?: keyof typeof PANEL_CONTENT;
}) {
  const content = PANEL_CONTENT[panel];

  return (
    <div className="relative hidden min-h-screen w-[46%] shrink-0 overflow-hidden bg-[#0071e3] text-white lg:flex">
      <BrandVideo
        src="/media/campusvoice-loop.mp4"
        poster="/media/campusvoice-loop-poster.jpg"
        label="HUConnect abstract background"
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.78)_0%,rgba(9,9,11,0.45)_45%,rgba(9,9,11,0.94)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.52)_0%,transparent_68%)]" />

      <div className="relative z-10 flex w-full flex-col justify-between p-9 xl:p-12">
        <div className="flex items-center justify-between">
          <Logo light href="/" />
          <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10.5px] font-medium text-white/60 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            Secure access
          </span>
        </div>

        <div className="py-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
            {content.eyebrow}
          </p>
          <h1 className="mt-5 max-w-[35rem] text-[clamp(2.55rem,4.1vw,3.9rem)] font-semibold leading-[1.03] tracking-[-0.045em]">
            {content.title}
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/55">
            {content.description}
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
            {content.points.map((point) => (
              <li
                key={point}
                className="flex items-center gap-1.5 text-[12px] font-medium text-white/70"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 border-t border-white/15 pt-5">
          {[
            { label: 'Governance roles', value: '11' },
            { label: 'Anonymous ballots', value: '100%' },
            { label: 'Audit coverage', value: '24/7' },
          ].map((item, index) => (
            <div
              key={item.label}
              className={cn('pr-4', index > 0 && 'border-l border-white/15 pl-4')}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
                {item.label}
              </p>
              <p className="mt-1.5 text-[15px] font-semibold text-white/90">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthFormFrame({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white lg:w-[54%]">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[#0071e3] lg:hidden">
        <BrandVideo
          src="/media/campusvoice-loop.mp4"
          poster="/media/campusvoice-loop-poster.jpg"
          label="HUConnect abstract background"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.5)_0%,rgba(9,9,11,0.25)_45%,rgba(9,9,11,0.9)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <Logo light href="/" />
            <span className="rounded-[10px] border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/60">
              Access portal
            </span>
          </div>
          <p className="text-[13px] font-medium text-white/70">
            A clearer record for every campus decision.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-6 sm:px-10 lg:px-14 lg:pb-6 lg:pt-6 xl:px-20">
        <div className="flex h-11 items-center justify-between border-b border-[#e4e4e7]">
          <span className="text-[12px] font-medium text-[#71717a]">
            Access portal
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#52525b] transition-colors hover:text-[#09090b]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to campus
          </Link>
        </div>

        <div className="flex flex-1 items-center py-10 lg:py-8">
          <div className="w-full">
            <div
              className={cn(
                'mx-auto',
                wide ? 'max-w-[36rem]' : 'max-w-[25rem]',
              )}
            >
              {children}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e4e7] pt-4 text-[11px] text-[#a1a1aa]">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Argon2id · HttpOnly sessions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            Registrar&apos;s Office · Est. 2026
          </span>
        </div>
      </div>
    </div>
  );
}

export function AuthLayout({
  title,
  description,
  children,
  wide = false,
  panel = 'register',
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
  panel?: 'register' | 'reset';
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandPanel panel={panel} />
      <AuthFormFrame wide={wide}>
        <div className="mb-7">
          <p className="text-[12px] font-medium text-[#71717a]">
            {panel === 'reset' ? 'Account recovery' : 'Create an account'}
          </p>
          <h2 className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#09090b]">
            {title}
          </h2>
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-[#52525b]">
            {description}
          </p>
        </div>
        {children}
      </AuthFormFrame>
    </div>
  );
}
