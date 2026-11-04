import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Lock, ShieldCheck } from 'lucide-react';
import { BrandVideo } from '@/components/brand-video';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const PANEL_CONTENT = {
  login: {
    index: '01',
    eyebrow: 'Access to the record',
    title: (
      <>
        The record
        <br />
        <span className="italic text-[#f8f6f0]/45">starts with you.</span>
      </>
    ),
    description:
      'One private place for the votes you cast, the concerns you raise and the decisions your campus makes.',
    note: 'A vote is a small act of trust. We built the room around it.',
    attribution: 'The CampusVoice principle',
  },
  register: {
    index: '02',
    eyebrow: 'Enrolment',
    title: (
      <>
        Put your name
        <br />
        <span className="italic text-[#f8f6f0]/45">on the record.</span>
      </>
    ),
    description:
      'Enrol once, then vote anonymously, raise concerns formally and follow every answer back to its source.',
    note: 'Democracy is not a feature. It is a habit we make easier to keep.',
    attribution: 'From the registrar’s desk',
  },
  reset: {
    index: '03',
    eyebrow: 'Account recovery',
    title: (
      <>
        Back to the
        <br />
        <span className="italic text-[#f8f6f0]/45">business of campus.</span>
      </>
    ),
    description:
      'A single-use link restores your access. Your ballot history and your privacy remain untouched.',
    note: 'Identity is verified once. After that, your choices belong only to you.',
    attribution: 'Security note',
  },
} as const;

export function AuthBrandPanel({
  panel = 'login',
}: {
  panel?: keyof typeof PANEL_CONTENT;
}) {
  const content = PANEL_CONTENT[panel];

  return (
    <div className="relative hidden min-h-screen w-[52%] overflow-hidden bg-[#12110d] text-[#f8f6f0] lg:flex">
      <BrandVideo
        src="/media/campusvoice-loop.mp4"
        poster="/media/campusvoice-loop-poster.jpg"
        label="CampusVoice abstract background"
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,7,0.72)_0%,rgba(10,9,7,0.28)_45%,rgba(10,9,7,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,9,7,0.46)_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-4 border border-white/15" />

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center justify-between">
          <Logo light href="/" />
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 border-b border-white/25 pb-1 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-white/65 transition-colors hover:border-white/60 hover:text-white"
          >
            Main site
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="max-w-[42rem] py-14">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-[#f8f6f0]/45">
            {content.index} <span className="mx-2 text-white/25">/</span>{' '}
            {content.eyebrow}
          </p>
          <h1 className="mt-6 font-editorial text-[clamp(3.3rem,5.2vw,5.4rem)] font-semibold leading-[0.9] tracking-[-0.045em]">
            {content.title}
          </h1>
          <p className="mt-7 max-w-md text-[14px] leading-[1.75] text-white/55 xl:text-[15px]">
            {content.description}
          </p>

          <figure className="mt-12 max-w-md border-l border-white/25 pl-5">
            <blockquote className="font-editorial text-[19px] font-medium italic leading-snug text-white/80">
              “{content.note}”
            </blockquote>
            <figcaption className="mt-3 font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-white/35">
              {content.attribution}
            </figcaption>
          </figure>
        </div>

        <div className="grid grid-cols-3 border-t border-white/20 pt-5">
          {[
            { label: 'Established', value: '2026' },
            { label: 'Ballots', value: 'Anonymous' },
            { label: 'Record', value: 'Auditable' },
          ].map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'pr-4',
                index > 0 && 'border-l border-white/15 pl-4',
              )}
            >
              <p className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-white/35">
                {item.label}
              </p>
              <p className="mt-1.5 font-editorial text-[17px] font-semibold text-white/85">
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
    <div className="paper-grain relative flex min-h-screen w-full flex-col bg-[#f1eee6] lg:w-[48%]">
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#12110d] lg:hidden">
        <BrandVideo
          src="/media/campusvoice-loop.mp4"
          poster="/media/campusvoice-loop-poster.jpg"
          label="CampusVoice abstract background"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,7,0.52)_0%,rgba(10,9,7,0.18)_40%,rgba(10,9,7,0.88)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <Logo light href="/" />
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-white/40">
              Access / 2026
            </span>
          </div>
          <p className="font-editorial text-[24px] font-semibold leading-none tracking-[-0.03em] text-white">
            The record starts with you.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-6 sm:px-10 lg:px-12 lg:pb-7 lg:pt-7 xl:px-16">
        <div className="flex items-center justify-between border-b border-[#171611]/15 pb-3.5">
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-[#7a7365]">
            CampusVoice / Access
          </span>
          <Link
            href="/"
            className="hidden items-center gap-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[#5f5b4f] transition-colors hover:text-[#a33a1b] sm:inline-flex"
          >
            <ArrowLeft className="h-3 w-3" />
            Return to campus
          </Link>
        </div>

        <div className="flex flex-1 items-center py-10 lg:py-8">
          <div className="w-full">
            <div
              className={cn(
                'mx-auto',
                wide ? 'max-w-[34rem]' : 'max-w-[24rem]',
              )}
            >
              {children}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#171611]/15 pt-3.5 font-mono text-[8px] font-medium uppercase tracking-[0.15em] text-[#7a7365]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[#2f5d3a]" />
            Argon2id · HttpOnly sessions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Registrar&apos;s office · Est. 2026
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared split-screen shell for the public authentication pages
 * (register, password reset).
 */
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
    <div className="flex min-h-screen bg-[#f1eee6]">
      <AuthBrandPanel panel={panel} />
      <AuthFormFrame wide={wide}>
        <div className="mb-8">
          <p className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#7a7365]">
            {panel === 'reset' ? '03 / Account recovery' : '02 / Enrolment'}
          </p>
          <h2 className="mt-4 font-editorial text-[clamp(2.8rem,5vw,4rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#171611]">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-[#5f5b4f]">
            {description}
          </p>
        </div>
        {children}
      </AuthFormFrame>
    </div>
  );
}
