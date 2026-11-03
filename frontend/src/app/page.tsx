'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  FileText,
  Gavel,
  Lock,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Governance', href: '#governance' },
  { label: 'Security', href: '#security' },
];

const STEPS = [
  {
    title: 'Raise a Concern',
    description:
      'Students and teachers submit concerns through their dashboard. Every voice is formally recorded and routed.',
    icon: FileText,
  },
  {
    title: 'Vote Anonymously',
    description:
      'Participate in CR elections and proposal voting with ballots stored separately from your identity.',
    icon: Vote,
  },
  {
    title: 'Drive Change',
    description:
      'Approved proposals reach management with formal response deadlines and tracked implementation.',
    icon: Gavel,
  },
];

const SECURITY = [
  {
    title: 'Anonymous Voting',
    description:
      'Ballots are stored separately from voter identity. No administrator can access individual choices.',
    icon: Vote,
  },
  {
    title: 'Secure Authentication',
    description:
      'Argon2id password hashing, JWT tokens in HttpOnly cookies, rate limiting and account lockout.',
    icon: Lock,
  },
  {
    title: 'Immutable Audit Trail',
    description:
      'Every credential change and governance action is recorded in a tamper-evident audit system.',
    icon: ScrollText,
  },
];

const STATS = [
  { value: '11', label: 'Governance roles' },
  { value: '2', label: 'Independent communities' },
  { value: '100%', label: 'Anonymous ballots' },
  { value: '24/7', label: 'Audit logging' },
];

function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-sm font-bold text-white shadow-sm">
        CV
      </span>
      <span className="text-lg font-semibold tracking-tight">CampusVoice</span>
    </Link>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? 'glass' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <Logo />
            <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Access CampusVoice
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="glass border-t border-border md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button className="mt-2 w-full">Access CampusVoice</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-36">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Democratic governance for colleges
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Your Voice Deserves
            <br />
            More Than a <span className="text-gradient">Hearing.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
            A transparent college governance platform where students and teachers
            participate in decisions, raise concerns, vote anonymously and drive
            meaningful institutional improvements.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Access CampusVoice
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore how it works
              </Button>
            </a>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-card p-6">
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-border bg-secondary/40 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              From concern to resolution, transparently
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <div
                key={item.title}
                className="group relative rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="absolute right-6 top-6 text-5xl font-bold text-secondary">
                  0{index + 1}
                </span>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance */}
      <section id="governance" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Governance
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Two independent governance communities
            </h2>
            <p className="mt-4 text-muted-foreground">
              Students and teachers each govern independently, then connect to a
              shared institutional accountability system.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Student Governance</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Elect Class Representatives, submit concerns, vote on
                    proposals and track resolutions end to end.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Teacher Governance</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Independent faculty proposals, departmental voting and formal
                    management accountability reviews.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-radial-fade" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/90 to-violet-600 p-10 text-white shadow-lg">
              <ShieldCheck className="h-10 w-10" />
              <blockquote className="mt-6 text-xl font-medium leading-relaxed">
                &ldquo;Your College. Your Voice. Your Decision.&rdquo;
              </blockquote>
              <p className="mt-4 text-sm text-white/80">
                Every proposal that passes a democratic vote is escalated through a
                transparent hierarchy with enforced response deadlines — so
                collective decisions reach the people who can act on them.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-6 text-center">
                <div>
                  <p className="text-2xl font-semibold">CR</p>
                  <p className="text-xs text-white/70">Elections</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">HOD</p>
                  <p className="text-xs text-white/70">Escalation</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">Board</p>
                  <p className="text-xs text-white/70">Accountability</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section
        id="security"
        className="border-t border-border bg-secondary/40 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Security &amp; privacy
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for trust at every layer
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {SECURITY.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
              >
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-violet-600 px-8 py-16 text-center text-white shadow-lg">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to make your voice count?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Sign in with your institutional account to participate in your
            college&apos;s democratic governance.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Access CampusVoice
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CampusVoice. Democratic college
            governance. No social login — secure by design.
          </p>
        </div>
      </footer>
    </div>
  );
}
