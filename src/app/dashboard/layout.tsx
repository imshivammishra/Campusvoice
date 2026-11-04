'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
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
import { Avatar, Kbd, Spinner } from '@/components/ui';
import { Logo, LogoMark } from '@/components/logo';
import { canAccessAdmin } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import {
  CommandPalette,
  type CommandItem,
} from '@/components/command-palette';

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

const WORKSPACE_NAV: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'CR Election',
    href: '/dashboard/election',
    icon: Vote,
    roles: STUDENT_ROLES,
  },
  {
    name: 'Concerns',
    href: '/dashboard/concerns',
    icon: FileText,
    roles: [...STUDENT_ROLES, ...AUTHORITY],
  },
  {
    name: 'Message CR',
    href: '/dashboard/cr-messages',
    icon: MessageSquare,
    roles: STUDENT_ROLES,
  },
  {
    name: 'Teacher Proposals',
    href: '/dashboard/proposals',
    icon: Megaphone,
    roles: ['TEACHER', ...AUTHORITY],
  },
  { name: 'Voting', href: '/dashboard/voting', icon: Vote },
];

const SERVICE_NAV: NavItem[] = [
  { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

const ADMIN_NAV: NavItem[] = [
  { name: 'Admin Console', href: '/dashboard/admin', icon: ShieldCheck },
  { name: 'Users', href: '/dashboard/admin/users', icon: UserCog },
  { name: 'Bulk Students', href: '/dashboard/admin/students', icon: UsersRound },
  {
    name: 'Registrations',
    href: '/dashboard/admin/registrations',
    icon: UserPlus,
  },
  {
    name: 'Organization',
    href: '/dashboard/admin/organization',
    icon: Building2,
  },
  { name: 'Roles & Access', href: '/dashboard/admin/rbac', icon: ShieldPlus },
];

function visibleNav(items: NavItem[], role?: string) {
  return items.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );
}

function roleLabel(role?: string) {
  if (!role) return 'Member';
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isItemActive(pathname: string, href: string) {
  return href === '/dashboard'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
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
  const [commandOpen, setCommandOpen] = useState(false);

  const workspace = useMemo(
    () => visibleNav(WORKSPACE_NAV, user?.role),
    [user?.role],
  );
  const services = useMemo(
    () => visibleNav(SERVICE_NAV, user?.role),
    [user?.role],
  );
  const admin = useMemo(
    () => (canAccessAdmin(user?.permissions) ? ADMIN_NAV : []),
    [user?.permissions],
  );

  const allNav = useMemo(
    () => [...workspace, ...services, ...admin],
    [workspace, services, admin],
  );

  const activeItem = useMemo(() => {
    return [...allNav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isItemActive(pathname, item.href));
  }, [allNav, pathname]);

  const commandItems: CommandItem[] = useMemo(
    () => [
      ...workspace.map((item) => ({
        name: item.name,
        href: item.href,
        section: 'Workspace',
        icon: item.icon,
      })),
      ...services.map((item) => ({
        name: item.name,
        href: item.href,
        section: 'Services',
        icon: item.icon,
      })),
      ...admin.map((item) => ({
        name: item.name,
        href: item.href,
        section: 'Administration',
        icon: item.icon,
      })),
    ],
    [workspace, services, admin],
  );

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((current) => {
        if (!active) return;
        setUser(current);
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
        .then((data: any) => {
          if (!active) return;
          const list = data?.data || (Array.isArray(data) ? data : []);
          setUnread(list.filter((item: any) => !item.isRead).length);
        })
        .catch(() => {});
    };
    loadUnread();
    const timer = setInterval(loadUnread, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ready, pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [router]);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'group flex items-center gap-3 border-l-2 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
          isActive
            ? 'border-[#c2542f] bg-white/[0.055] text-[#f8f6f0]'
            : 'border-transparent text-white/50 hover:border-white/20 hover:bg-white/[0.03] hover:text-white/85',
        )}
      >
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            isActive
              ? 'text-[#d07a58]'
              : 'text-white/35 group-hover:text-white/70',
          )}
        />
        <span className="flex-1">{item.name}</span>
        {item.name === 'Notifications' && unread > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center bg-[#a33a1b] px-1 font-mono text-[8px] font-medium text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    );
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1eee6]">
        <div className="flex flex-col items-center gap-5">
          <LogoMark className="h-12 w-12" />
          <div className="flex items-center gap-2 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-[#7a7365]">
            <Spinner className="h-3.5 w-3.5" />
            Opening the record…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f1eee6] text-[#171611]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#171611]/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-[252px] flex-col border-r border-[#171611] bg-[#161510] transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-white/10 px-5 pb-5 pt-6">
          <div className="flex items-start justify-between">
            <Logo light href="/dashboard" />
            <button
              className="p-1 text-white/40 transition-colors hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 font-mono text-[7px] font-medium uppercase tracking-[0.2em] text-white/30">
            Registrar&apos;s desk <span className="mx-1.5">/</span> 2026
          </p>
        </div>

        <div className="px-4 pt-4">
          <Link
            href="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 border border-white/10 p-3 transition-colors hover:border-white/25 hover:bg-white/[0.03]"
          >
            <Avatar
              name={user?.fullName || user?.username}
              className="h-9 w-9 shrink-0 border-white/20 bg-[#f8f6f0] text-[14px] text-[#171611]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-editorial text-[15px] font-semibold leading-tight text-white">
                {user?.fullName || user?.username}
              </p>
              <p className="mt-0.5 truncate font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-white/40">
                {roleLabel(user?.role)}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="pb-2 pl-1 font-mono text-[7px] font-medium uppercase tracking-[0.2em] text-white/25">
            Workspace
          </p>
          <div className="space-y-0.5">{workspace.map(renderNavItem)}</div>

          <p className="pb-2 pl-1 pt-7 font-mono text-[7px] font-medium uppercase tracking-[0.2em] text-white/25">
            Services
          </p>
          <div className="space-y-0.5">{services.map(renderNavItem)}</div>

          {admin.length > 0 && (
            <>
              <p className="pb-2 pl-1 pt-7 font-mono text-[7px] font-medium uppercase tracking-[0.2em] text-white/25">
                Administration
              </p>
              <div className="space-y-0.5">{admin.map(renderNavItem)}</div>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="border-l border-white/20 pl-3">
            <p className="font-mono text-[7px] font-medium uppercase tracking-[0.16em] text-white/35">
              Trust note
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">
              Ballots are separated from identities. Every administrative action
              is written to the record.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2.5 border-t border-white/10 pt-3">
            <p className="min-w-0 flex-1 truncate font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
              @{user?.username}
            </p>
            <button
              onClick={handleLogout}
              className="p-1.5 text-white/35 transition-colors hover:text-[#d07a58]"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[56px] shrink-0 items-center justify-between border-b border-[#cfc8b8] bg-[#f8f6f0]/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-[#5f5b4f] transition-colors hover:text-[#171611] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 font-mono text-[8px] font-medium uppercase tracking-[0.14em] sm:flex">
              <Link
                href="/dashboard"
                className="text-[#8a8274] transition-colors hover:text-[#171611]"
              >
                Workspace
              </Link>
              <span className="text-[#b3ab9c]">/</span>
              <span className="truncate text-[#171611]">
                {activeItem?.name || 'Overview'}
              </span>
            </div>

            <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.1em] sm:hidden">
              {activeItem?.name || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden h-8 items-center gap-2 border border-[#171611]/20 bg-transparent px-3 font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-[#7a7365] transition-colors hover:border-[#171611]/50 hover:text-[#171611] md:flex"
            >
              <Search className="h-3 w-3" />
              <span className="pr-8">Search the record</span>
              <span className="flex items-center gap-0.5">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>

            <button
              onClick={() => setCommandOpen(true)}
              className="p-1.5 text-[#5f5b4f] transition-colors hover:text-[#171611] md:hidden"
              aria-label="Open command palette"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            <div className="hidden items-center gap-1.5 border-l border-[#171611]/15 pl-3 font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-[#7a7365] lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2f5d3a]" />
              {roleLabel(user?.role)}
            </div>

            <Link
              href="/dashboard/notifications"
              className="relative p-1.5 text-[#5f5b4f] transition-colors hover:text-[#171611]"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center bg-[#a33a1b] px-0.5 font-mono text-[7px] font-medium text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/profile"
              className="ml-0.5 flex items-center transition-opacity hover:opacity-75"
            >
              <Avatar
                name={user?.fullName || user?.username}
                className="h-7 w-7 text-[11px]"
              />
            </Link>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto bg-[#f1eee6]">
          <div className="mx-auto max-w-[1220px] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        items={commandItems}
      />
    </div>
  );
}
