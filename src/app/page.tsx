'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Lock,
  Menu,
  Plus,
  ScrollText,
  ShieldCheck,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { BrandVideo } from '@/components/brand-video';
import { Logo } from '@/components/logo';
import { Reveal } from '@/components/reveal';
import { Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Elections', href: '#elections' },
  { label: 'Proposals', href: '#proposals' },
  { label: 'Security', href: '#security' },
  { label: 'FAQ', href: '#faq' },
];

const HERO_STATS = [
  { value: '11', label: 'Governance roles' },
  { value: '100%', label: 'Anonymous ballots' },
  { value: '0', label: 'Identities linked' },
  { value: '24/7', label: 'Audit coverage' },
];

const ROLES = [
  'Students',
  'Class Representatives',
  'Teachers',
  'Heads of Department',
  'Principals',
  'Registrars',
  'Leadership',
];

const FEATURES = [
  {
    kind: 'election' as const,
    title: 'Elections',
    tagline: 'Anonymous ballots. Verifiable results.',
    description:
      'Run class representative elections with eligibility checks, one-vote authorisations and live turnout.',
  },
  {
    kind: 'proposal' as const,
    title: 'Proposals',
    tagline: 'Every concern has a next step.',
    description:
      'Review stages, owners and deadlines turn student voice into a traceable, accountable decision.',
  },
  {
    kind: 'audit' as const,
    title: 'Accountability',
    tagline: 'A record you can trust.',
    description:
      'Every approval, escalation and result is written to an audit trail — not a disappearing group chat.',
  },
];

const PERSONAS = [
  {
    icon: GraduationCap,
    title: 'Students',
    description: 'Vote, raise concerns and follow every outcome from one calm dashboard.',
  },
  {
    icon: Users,
    title: 'Representatives',
    description: 'Stand for election, publish priorities and keep promises visible.',
  },
  {
    icon: Building2,
    title: 'Departments',
    description: 'Review concerns with clear ownership, deadlines and escalation paths.',
  },
  {
    icon: ShieldCheck,
    title: 'Leadership',
    description: 'See the will of the campus and act on it with an audit-ready record.',
  },
];

const SECURITY = [
  {
    icon: Lock,
    title: 'Anonymous by architecture',
    description:
      'Ballots live separately from voter identities. A one-way hash prevents double voting without revealing a choice.',
  },
  {
    icon: ShieldCheck,
    title: 'Access you can define',
    description:
      'Institutions, departments, classes and permissions are configured around your real hierarchy.',
  },
  {
    icon: ScrollText,
    title: 'Accountable by default',
    description:
      'Logins, approvals, votes and escalations are recorded, so accountability never relies on memory.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Raise it',
    description:
      'Submit a concern or proposal from your dashboard. Add context and send it to the people responsible.',
  },
  {
    number: '02',
    title: 'Vote on it',
    description:
      'Your eligibility is verified once. Your ballot is anonymous, sealed and counted exactly once.',
  },
  {
    number: '03',
    title: 'See it through',
    description:
      'Follow review, escalation and resolution with clear owners, deadlines and proof of action.',
  },
];

const FAQS = [
  {
    q: 'Can anyone see how I voted?',
    a: 'No. Ballots are stored separately from voter identities, and the hash used to prevent double voting cannot be reversed into a person. Administrators can see aggregate results, never individual choices.',
  },
  {
    q: 'How are Class Representatives elected?',
    a: 'Each class runs a CR election with eligible students, candidate profiles and anonymous ballots. When voting closes, the winner is calculated and can be certified by an authorised administrator.',
  },
  {
    q: 'What happens after a proposal passes?',
    a: 'It moves into a formal review and escalation flow. Each stage has an owner and a response deadline, and every update is visible on the proposal timeline.',
  },
  {
    q: 'Can our institution use its own structure?',
    a: 'Yes. Institutions, departments, classes and role permissions are fully configurable, so CampusVoice fits your existing academic hierarchy.',
  },
  {
    q: 'Is this secure enough for real elections?',
    a: 'CampusVoice uses anonymous ballot separation, one-vote authorisations, Argon2id passwords, HttpOnly sessions, role-based access and audit logging. Pair it with HTTPS and a managed MongoDB deployment for production.',
  },
];

function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-black text-white">
      <BrandVideo
        src="/media/campusvoice-loop.mp4"
        poster="/media/campusvoice-loop-poster.jpg"
        label="CampusVoice abstract background"
        className="absolute inset-0 -z-20 h-full w-full"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.2)_42%,rgba(0,0,0,0.82)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.18)_72%)]" />

      <div className="mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:pt-32">
        <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-white/55">
          CampusVoice
        </p>

        <h1 className="mt-5 max-w-5xl text-[clamp(3.4rem,9.4vw,7rem)] font-semibold leading-[0.94] tracking-[-0.055em]">
          Your campus.
          <br />
          <span className="text-white/55">Your voice.</span>
        </h1>

        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/65 sm:text-[20px] sm:leading-[1.45]">
          Elections, concerns and proposals — in one clear, private place.
        </p>

        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#0071e3] px-7 text-[15px] font-medium text-white transition-colors hover:bg-[#0077ed]"
          >
            Get started
          </Link>
          <a
            href="#overview"
            className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-[#2997ff] transition-colors hover:text-white"
          >
            Explore CampusVoice
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 overflow-hidden rounded-[20px] border border-white/[0.12] bg-white/[0.045] backdrop-blur-md sm:grid-cols-4">
          {HERO_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                'px-4 py-5',
                index % 2 === 1 && 'border-l border-white/[0.09]',
                index > 1 && 'border-t border-white/[0.09] sm:border-t-0',
                index > 0 && 'sm:border-l sm:border-white/[0.09]',
              )}
            >
              <p className="text-[25px] font-semibold tracking-[-0.04em] sm:text-[28px]">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex justify-center pb-8">
        <a
          href="#overview"
          aria-label="Scroll to overview"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/45 transition-colors hover:border-white/30 hover:text-white"
        >
          <ChevronDown className="h-4 w-4 animate-bob" />
        </a>
      </div>
    </section>
  );
}

function FeatureVisual({ kind }: { kind: 'election' | 'proposal' | 'audit' }) {
  if (kind === 'election') {
    return (
      <div className="rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#86868b]">
            CR Election · CSE 3A
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {[
            { name: 'Aarav Sharma', value: 68, votes: '486' },
            { name: 'Rohan Gupta', value: 32, votes: '229' },
          ].map((candidate) => (
            <div key={candidate.name}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#1d1d1f]">{candidate.name}</span>
                <span className="text-[#86868b]">{candidate.votes}</span>
              </div>
              <Progress value={candidate.value} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-1.5 border-t border-black/[0.06] pt-4 text-[11px] text-[#86868b]">
          <Lock className="h-3.5 w-3.5" />
          715 ballots · no identities attached
        </div>
      </div>
    );
  }

  if (kind === 'proposal') {
    return (
      <div className="rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#1d1d1f]">Library Wi-Fi upgrade</p>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            In review
          </span>
        </div>
        <div className="mt-5 space-y-0">
          {[
            { label: 'Raised by a student', time: 'Mon · 09:14', done: true },
            { label: 'Reviewed by HOD', time: 'Wed · 11:02', done: true },
            { label: 'Scheduled for vote', time: 'Fri · 16:00', done: false },
          ].map((step, index) => (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full',
                    step.done ? 'bg-[#0071e3] text-white' : 'border border-black/15 bg-white',
                  )}
                >
                  {step.done ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
                  )}
                </span>
                {index < 2 && <span className="h-6 w-px bg-black/10" />}
              </div>
              <div className="flex flex-1 items-start justify-between gap-2 pb-3">
                <p className="text-[12px] font-medium text-[#1d1d1f]">{step.label}</p>
                <p className="text-[10px] text-[#86868b]">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#86868b]">
        Audit trail
      </p>
      <div className="mt-4 space-y-3">
        {[
          { action: 'Election certified', meta: 'Registrar · 12:04' },
          { action: 'Proposal escalated', meta: 'HOD CSE · 10:38' },
          { action: 'Concern resolved', meta: 'Welfare · 09:12' },
        ].map((entry) => (
          <div key={entry.action} className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-[#0071e3]">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <p className="flex-1 text-[12px] font-medium text-[#1d1d1f]">{entry.action}</p>
            <p className="text-[10px] text-[#86868b]">{entry.meta}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-black/[0.06] pt-4 text-[11px] text-[#86868b]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Every sensitive action recorded
      </div>
    </div>
  );
}

function ElectionPreview() {
  const ring = 2 * Math.PI * 42;

  return (
    <div className="rounded-[28px] border border-black/[0.08] bg-[#f5f5f7] p-2.5 sm:p-4">
      <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-[0_24px_70px_-46px_rgba(0,0,0,0.38)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="hidden text-[11px] text-[#86868b] sm:block">
            CampusVoice · Elections
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.45fr_0.85fr]">
          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
              Class Representative · CSE 3A
            </p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[24px] font-semibold tracking-[-0.035em] text-[#1d1d1f]">
                  CR Election 2026
                </h3>
                <p className="mt-1 text-[13px] text-[#6e6e73]">
                  Voting closes in 4h 12m
                </p>
              </div>
              <span className="rounded-full border border-black/[0.1] px-3 py-1 text-[11px] text-[#6e6e73]">
                1,024 eligible
              </span>
            </div>

            <div className="mt-7 space-y-5">
              {[
                { name: 'Aarav Sharma', value: 68, votes: '486' },
                { name: 'Rohan Gupta', value: 32, votes: '229' },
              ].map((candidate) => (
                <div key={candidate.name}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#1d1d1f]">
                      {candidate.name}
                    </span>
                    <span className="text-[#86868b]">{candidate.votes} votes</span>
                  </div>
                  <Progress value={candidate.value} className="mt-2 h-2" />
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-4 py-2 text-[12px] font-medium text-white">
                <Vote className="h-3.5 w-3.5" />
                Cast your vote
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
                <Lock className="h-3.5 w-3.5" />
                Ballot sealed
              </span>
            </div>
          </div>

          <div className="border-t border-black/[0.06] bg-[#fbfbfd] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e8e8ed"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#0071e3"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ring * 0.26}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-[30px] font-semibold tracking-[-0.05em]">74%</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.13em] text-[#86868b]">
                  Turnout
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-black/[0.06] pt-5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#6e6e73]">Ballots cast</span>
                <span className="font-medium">715</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6e6e73]">Eligible voters</span>
                <span className="font-medium">960</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6e6e73]">Your ballot</span>
                <span className="font-medium text-[#0071e3]">Recorded</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[#f5f5f7] p-3 text-[11px] leading-relaxed text-[#6e6e73]">
              <ShieldCheck className="mb-1.5 h-4 w-4 text-[#0071e3]" />
              Identities are never linked to choices. Results are aggregate only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProposalPanel() {
  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-white/90 p-6 shadow-lift backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#86868b]">
            Proposal · CSE
          </p>
          <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.025em] text-[#1d1d1f]">
            Library Wi-Fi upgrade
          </h3>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
          In review
        </span>
      </div>

      <div className="mt-6 space-y-0">
        {[
          { label: 'Raised by a student', time: 'Mon · 09:14', done: true },
          { label: 'Reviewed by HOD', time: 'Wed · 11:02', done: true },
          { label: 'Scheduled for vote', time: 'Fri · 16:00', done: true },
          { label: 'Resolution published', time: 'Awaiting', done: false },
        ].map((step, index) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full',
                  step.done
                    ? 'bg-[#0071e3] text-white'
                    : 'border border-black/15 bg-white',
                )}
              >
                {step.done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
                )}
              </span>
              {index < 3 && <span className="h-7 w-px bg-black/10" />}
            </div>
            <div className="flex flex-1 items-start justify-between gap-3 pb-4">
              <p className="text-[13px] font-medium text-[#1d1d1f]">{step.label}</p>
              <p className="text-[11px] text-[#86868b]">{step.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-black/[0.06] pt-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#6e6e73]">3 of 4 stages complete</span>
          <span className="font-medium text-[#1d1d1f]">75%</span>
        </div>
        <Progress value={75} className="mt-2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <header className="glass-dark fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-12 max-w-content items-center justify-between px-5">
          <Logo light markClassName="h-[22px] w-[22px] rounded-[6px]" className="gap-2" />

          <nav className="hidden items-center gap-8 text-[12px] font-normal text-white/75 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/login"
              className="text-[12px] text-white/75 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#0071e3] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0077ed]"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-black/95 px-5 pb-6 pt-4 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-white/[0.07] py-3 text-[15px] text-white/80"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-full border border-white/20 text-[14px] font-medium text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-[#0071e3] text-[14px] font-medium text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <Hero />

        <section className="border-b border-black/[0.07] bg-white px-6 py-6">
          <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#86868b]">
            {ROLES.map((role, index) => (
              <span key={role} className="flex items-center gap-7">
                {role}
                {index < ROLES.length - 1 && (
                  <span className="hidden h-1 w-1 rounded-full bg-black/20 sm:block" />
                )}
              </span>
            ))}
          </div>
        </section>

        <section
          id="overview"
          className="scroll-mt-16 bg-white px-6 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
                  The platform
                </p>
                <h2 className="mt-4 text-[clamp(2.6rem,5.4vw,4.6rem)] font-semibold leading-[1.01] tracking-[-0.045em]">
                  Everything your campus decides.
                  <br />
                  <span className="text-[#86868b]">In one place.</span>
                </h2>
                <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#6e6e73] sm:text-[19px]">
                  CampusVoice brings elections, concerns and proposals into a
                  single accountable flow — so nothing gets lost between a
                  conversation and a decision.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 70}>
                  <div className="flex h-full flex-col rounded-[28px] bg-[#f5f5f7] p-7 sm:p-8">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                      {feature.title}
                    </p>
                    <h3 className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.03em]">
                      {feature.tagline}
                    </h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-[#6e6e73]">
                      {feature.description}
                    </p>
                    <div className="mt-auto pt-8">
                      <FeatureVisual kind={feature.kind} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="elections"
          className="scroll-mt-16 bg-[#f5f5f7] px-6 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
                <div className="max-w-3xl">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
                    Elections
                  </p>
                  <h2 className="mt-4 text-[clamp(2.6rem,5.4vw,4.6rem)] font-semibold leading-[1.01] tracking-[-0.045em]">
                    The ballot box,
                    <br />
                    <span className="text-[#86868b]">rebuilt.</span>
                  </h2>
                </div>
                <p className="max-w-md text-[16px] leading-relaxed text-[#6e6e73] lg:pb-2">
                  Vote from anywhere. Your identity is checked once, then
                  separated from your choice. Results are counted, not curated.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <ElectionPreview />
            </Reveal>

            <div className="mt-10 grid gap-8 border-t border-black/[0.08] pt-10 sm:grid-cols-3">
              {[
                {
                  title: 'Eligibility, verified',
                  body: 'Only students on the class roster can vote, and only once.',
                },
                {
                  title: 'Choices, separated',
                  body: 'Ballots are stored apart from identities and never shown individually.',
                },
                {
                  title: 'Results, certified',
                  body: 'Live turnout and final counts are available to every eligible voter.',
                },
              ].map((item) => (
                <div key={item.title}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0071e3]" />
                    <p className="text-[14px] font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#6e6e73]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="proposals"
          className="scroll-mt-16 bg-white px-6 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-wide">
            <Reveal>
              <div className="relative overflow-hidden rounded-[32px] border border-black/[0.08] bg-[#f5f5f7]">
                <BrandVideo
                  src="/media/campusvoice-light.mp4"
                  poster="/media/campusvoice-light-poster.jpg"
                  label="Soft light moving through a campus workspace"
                  preload="metadata"
                  className="absolute inset-0 h-full w-full opacity-90"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.72)_48%,rgba(255,255,255,0.2)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.75)_0%,transparent_38%)]" />

                <div className="relative grid gap-12 px-6 py-16 sm:px-12 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-16">
                  <div className="max-w-xl">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
                      Proposals
                    </p>
                    <h2 className="mt-4 text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-[1.03] tracking-[-0.045em]">
                      From a raised hand
                      <br />
                      <span className="text-[#86868b]">to a real outcome.</span>
                    </h2>
                    <p className="mt-5 text-[16px] leading-relaxed text-[#6e6e73] sm:text-[17px]">
                      Every concern gets a route, an owner and a deadline. Watch
                      it move from review to resolution without chasing anyone
                      for an update.
                    </p>
                    <Link
                      href="/login"
                      className="mt-7 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0071e3] hover:underline"
                    >
                      Explore proposals
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <ProposalPanel />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[#f5f5f7] px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
                  Built for everyone
                </p>
                <h2 className="mt-4 text-[clamp(2.6rem,5.4vw,4.6rem)] font-semibold leading-[1.01] tracking-[-0.045em]">
                  One campus.
                  <br />
                  <span className="text-[#86868b]">Every role.</span>
                </h2>
                <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#6e6e73]">
                  The same source of truth for the people who raise concerns, the
                  representatives who carry them and the leaders who act on them.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-black/[0.08] bg-black/[0.08] sm:grid-cols-2 lg:grid-cols-4">
                {PERSONAS.map((persona) => {
                  const Icon = persona.icon;
                  return (
                    <div key={persona.title} className="bg-white p-7">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f2ff] text-[#0071e3]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-8 text-[19px] font-semibold tracking-[-0.02em]">
                        {persona.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#6e6e73]">
                        {persona.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="security"
          className="scroll-mt-16 bg-black px-6 py-24 text-white sm:py-32"
        >
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2997ff]">
                  Security &amp; privacy
                </p>
                <h2 className="mt-4 text-[clamp(2.6rem,5.4vw,4.6rem)] font-semibold leading-[1.01] tracking-[-0.045em]">
                  Private by architecture.
                  <br />
                  <span className="text-white/40">Accountable by default.</span>
                </h2>
                <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/55">
                  Democratic participation only works when people feel safe. Every
                  layer of CampusVoice protects identity, integrity and
                  accountability.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-white/[0.12] bg-white/[0.12] lg:grid-cols-3">
                {SECURITY.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="bg-[#0a0a0a] p-8">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-[#2997ff]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-8 text-[20px] font-semibold tracking-[-0.025em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-white/50">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.1] pt-8 text-[11px] font-medium uppercase tracking-[0.13em] text-white/35">
              {['Argon2id', 'HttpOnly sessions', 'SHA-256 ballots', 'RBAC', 'Audit log'].map(
                (item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#2997ff]" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
                  How it works
                </p>
                <h2 className="mt-4 text-[clamp(2.6rem,5.4vw,4.6rem)] font-semibold leading-[1.01] tracking-[-0.045em]">
                  Raise it. Vote on it.
                  <br />
                  <span className="text-[#86868b]">See it through.</span>
                </h2>
              </div>
            </Reveal>

            <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, index) => (
                <Reveal key={step.number} delay={index * 80}>
                  <div className="border-t border-black/[0.12] pt-6">
                    <p className="text-[12px] font-semibold tracking-[0.12em] text-[#0071e3]">
                      {step.number}
                    </p>
                    <h3 className="mt-5 text-[24px] font-semibold tracking-[-0.03em]">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[#6e6e73]">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-16 border-y border-black/[0.07] bg-[#f5f5f7] px-6 py-24 sm:py-32"
        >
          <div className="mx-auto grid max-w-content gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal>
              <div className="lg:sticky lg:top-24">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
                  Questions
                </p>
                <h2 className="mt-4 text-[clamp(2.4rem,4.6vw,3.8rem)] font-semibold leading-[1.03] tracking-[-0.045em]">
                  Questions,
                  <br />
                  <span className="text-[#86868b]">answered.</span>
                </h2>
                <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[#6e6e73]">
                  Can’t find what you need? Your institution’s registrar or
                  platform administrator can help.
                </p>
              </div>
            </Reveal>

            <div>
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b border-black/[0.1] first:border-t"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left">
                    <span className="text-[16px] font-medium tracking-[-0.01em]">
                      {faq.q}
                    </span>
                    <Plus className="h-5 w-5 shrink-0 text-[#86868b] transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="max-w-2xl pb-6 pr-8 text-[14px] leading-relaxed text-[#6e6e73]">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-24 text-center sm:py-32">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <h2 className="text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[1.01] tracking-[-0.05em]">
                Ready when your
                <br />
                campus is.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
                Join students, teachers and leaders building a more transparent
                campus — one vote, one proposal and one resolution at a time.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#0071e3] px-7 text-[15px] font-medium text-white transition-colors hover:bg-[#0077ed]"
                >
                  Create an account
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0071e3] hover:underline"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.15em] text-[#86868b]">
                No social login · Secure by design · Built for campuses
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-black/[0.07] bg-[#f5f5f7] px-6 pb-10 pt-14 text-[12px] text-[#6e6e73]">
        <div className="mx-auto max-w-content">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-[12px] leading-relaxed">
                Elections, concerns and proposals for modern campuses. Every
                voice recorded, every vote protected, every decision traceable.
              </p>
            </div>

            {[
              {
                title: 'Platform',
                links: [
                  { label: 'Overview', href: '#overview' },
                  { label: 'Elections', href: '#elections' },
                  { label: 'Proposals', href: '#proposals' },
                  { label: 'Security', href: '#security' },
                ],
              },
              {
                title: 'Access',
                links: [
                  { label: 'Sign in', href: '/login' },
                  { label: 'Create account', href: '/register' },
                  { label: 'Reset password', href: '/forgot-password' },
                ],
              },
              {
                title: 'Support',
                links: [
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Support', href: '/dashboard/support' },
                  { label: 'Notifications', href: '/dashboard/notifications' },
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-semibold text-[#1d1d1f]">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-[#1d1d1f] hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/[0.08] pt-6 sm:flex-row sm:items-center">
            <p>
              Copyright © {new Date().getFullYear()} CampusVoice. All rights
              reserved.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="hover:text-[#1d1d1f]">Privacy</span>
              <span className="hover:text-[#1d1d1f]">Terms</span>
              <span className="hover:text-[#1d1d1f]">Accessibility</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
