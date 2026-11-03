'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  ShieldCheck,
  ShieldPlus,
  UserCog,
  User as UserIcon,
  UserPlus,
  UsersRound,
  Vote,
  X,
} from 'lucide-react';
import { fetchCurrentUser, getStoredUser, logout, type AuthUser } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { Avatar, Spinner } from '@/components/ui';
import { canAccessAdmin } from '@/lib/rbac';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const STUDENT_ROLES = ['STUDENT', 'CLASS_REPRESENTATIVE'];
const AUTHORITY = [
  'HOD',
  'PRINCIPAL',
  'REGISTRAR',
  'PRO_VICE_CHANCELLOR',
  'VICE_CHAIRMAN',
  'CHAIRMAN',
  'SUPER_ADMIN',
];

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  // Student community
  { name: 'CR Election', href: '/dashboard/election', icon: Vote, roles: STUDENT_ROLES },
  { name: 'Concerns', href: '/dashboard/concerns', icon: FileText, roles: [...STUDENT_ROLES, ...AUTHORITY] },
  { name: 'Message CR', href: '/dashboard/cr-messages', icon: MessageSquare, roles: STUDENT_ROLES },
  // Teacher community
  { name: 'Teacher Proposals', href: '/dashboard/proposals', icon: Megaphone, roles: ['TEACHER', ...AUTHORITY] },
  { name: 'Voting', href: '/dashboard/voting', icon: Vote },
  { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

function navFor(role?: string): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
}

const ADMIN_NAV: NavItem[] = [
  { name: 'Admin Console', href: '/dashboard/admin', icon: ShieldCheck },
  { name: 'Users', href: '/dashboard/admin/users', icon: UserCog },
  { name: 'Bulk Students', href: '/dashboard/admin/students', icon: UsersRound },
  { name: 'Registrations', href: '/dashboard/admin/registrations', icon: UserPlus },
  { name: 'Organization', href: '/dashboard/admin/organization', icon: Building2 },
  { name: 'Roles & Access', href: '/dashboard/admin/rbac', icon: ShieldPlus },
];

function roleLabel(role?: string) {
  if (!role) return '';
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((u) => {
        if (!active) return;
        setUser(u);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const loadUnread = () => {
      apiRequest('/notifications')
        .then((d: any) => {
          if (!active) return;
          const list = d?.data || (Array.isArray(d) ? d : []);
          setUnread(list.filter((n: any) => !n.isRead).length);
        })
        .catch(() => {});
    };
    loadUnread();
    const t = setInterval(loadUnread, 20000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [ready, pathname]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [router]);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive =
      item.href === '/dashboard' || item.href === '/dashboard/admin'
        ? pathname === item.href
        : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        {item.name}
      </Link>
    );
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-white">
              CV
            </span>
            <span className="font-semibold tracking-tight">CampusVoice</span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Governance
          </p>
          {navFor(user?.role).map((item) => renderNavItem(item))}

          {canAccessAdmin(user?.permissions) && (
            <>
              <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </p>
              {ADMIN_NAV.map((item) => renderNavItem(item))}
            </>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar name={user?.username} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.fullName || user?.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel(user?.role)}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/70 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {roleLabel(user?.role)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/notifications"
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-2">
              <Avatar name={user?.username} className="h-8 w-8" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
