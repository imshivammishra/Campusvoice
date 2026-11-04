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
  Settings,
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
    roles: [...STUDENT_ROLES, 'TEACHER', ...AUTHORITY],
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
  {
    name: 'Students',
    href: '/dashboard/students',
    icon: UsersRound,
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
  { name: 'CR Voting', href: '/dashboard/election/start', icon: Vote },
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
          'group flex items-center gap-x-2.5 rounded-md px-2.5 py-[6px] text-[11px] font-medium transition-colors',
          isActive
            ? 'bg-[#0a223a] text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
            : 'text-zinc-700 hover:bg-zinc-100 hover:text-[#0a223a]',
        )}
      >
        <Icon
          className={cn(
            'h-[15px] w-[15px] shrink-0 transition-colors',
            isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-700',
          )}
        />
        <span className="flex-1 truncate">{item.name}</span>
        {item.name === 'Notifications' && unread > 0 && (
          <span
            className={cn(
              'flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[10px] font-bold',
              isActive ? 'bg-white text-[#0a223a]' : 'bg-[#0a223a] text-white',
            )}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex h-[58px] shrink-0 items-center justify-between border-b-2 border-zinc-200 px-4">
        <Logo href="/" />
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-[#0a223a] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-zinc-400">
          Workspace
        </p>
        <div className="space-y-0.5">{workspace.map(renderNavItem)}</div>

        <p className="px-2.5 pb-1.5 pt-5 text-[9px] font-bold uppercase tracking-[0.13em] text-zinc-400">
          Services
        </p>
        <div className="space-y-0.5">{services.map(renderNavItem)}</div>

        {admin.length > 0 && (
          <>
            <p className="px-2.5 pb-1.5 pt-5 text-[9px] font-bold uppercase tracking-[0.13em] text-zinc-400">
              Administration
            </p>
            <div className="space-y-0.5">{admin.map(renderNavItem)}</div>
          </>
        )}
      </nav>

      <div className="border-t-2 border-zinc-200 p-3">
        <Link
          href="/dashboard/profile"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 p-2 transition-colors hover:border-[#d4d4d8] hover:bg-[#fafafa]"
        >
          <Avatar
            name={user?.fullName || user?.username}
            className="h-8 w-8 shrink-0 rounded-md text-[11px]"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold leading-tight text-[#0a223a]">
              {user?.fullName || user?.username}
            </p>
            <p className="mt-0.5 truncate text-[9.5px] text-zinc-500">
              {roleLabel(user?.role)}
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-[#f4f4f5] hover:text-[#0a223a]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <LogoMark hard className="h-10 w-10" />
          <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-500">
            <Spinner className="h-3.5 w-3.5" />
            Loading workspace…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-[#0a223a]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-[248px] flex-col border-r-2 border-zinc-200 bg-white transition-transform duration-200 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[58px] shrink-0 items-center justify-between gap-3 border-b-2 border-zinc-200 bg-white px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[#0a223a] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>

            <nav className="hidden min-w-0 items-center gap-1.5 text-[12px] sm:flex">
              <Link
                href="/dashboard"
                className="font-semibold text-zinc-400 transition-colors hover:text-zinc-700"
              >
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
              <span className="truncate font-bold text-[#0a223a]">
                {activeItem?.name || 'Overview'}
              </span>
            </nav>

            <span className="truncate text-[13px] font-bold text-[#0a223a] sm:hidden">
              {activeItem?.name || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden h-8 w-[220px] items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-[12px] text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-white md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search…</span>
              <span className="flex items-center gap-0.5">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>

            <button
              onClick={() => setCommandOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[#0a223a] md:hidden"
              aria-label="Open command palette"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/dashboard/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[#0a223a]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded bg-[#0a223a] px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/admin"
              className="hidden h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[#0a223a] sm:flex"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <div className="hidden h-6 w-px bg-zinc-200 sm:block" />

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-md p-0.5 pr-2 transition-colors hover:bg-zinc-100"
            >
              <Avatar
                name={user?.fullName || user?.username}
                className="h-7 w-7 rounded-md text-[10.5px]"
              />
              <span className="hidden min-w-0 md:block">
                <span className="block max-w-[130px] truncate text-[11px] font-bold leading-tight text-[#0a223a]">
                  {user?.fullName || user?.username}
                </span>
                <span className="block text-[10px] font-medium leading-tight text-zinc-400">
                  {roleLabel(user?.role)}
                </span>
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 bg-zinc-100">
          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
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
