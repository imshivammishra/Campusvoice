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
          'group relative flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[13px] font-medium transition-all duration-200',
          isActive
            ? 'bg-[#0071e3]/10 text-[#0071e3]'
            : 'text-[#424245] hover:bg-black/[0.045] hover:text-[#1d1d1f]',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] transition-colors',
            isActive
              ? 'bg-[#0071e3] text-white'
              : 'text-[#86868b] group-hover:text-[#1d1d1f]',
          )}
        >
          <Icon className="h-[15px] w-[15px]" />
        </span>
        <span className="flex-1">{item.name}</span>
        {item.name === 'Notifications' && unread > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    );
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="h-11 w-11" />
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#6e6e73]">
            <Spinner className="h-3.5 w-3.5" />
            Loading workspace…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-[#1d1d1f]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#1d1d1f]/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-[256px] flex-col border-r border-[#e5e5ea] bg-white transition-transform duration-300 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo href="/dashboard" />
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.06] hover:text-[#1d1d1f] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pt-1">
          <Link
            href="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e5ea] bg-white p-2.5 transition-colors hover:bg-[#f5f5f7]"
          >
            <Avatar
              name={user?.fullName || user?.username}
              className="h-9 w-9 shrink-0 text-[12px]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight text-[#1d1d1f]">
                {user?.fullName || user?.username}
              </p>
              <p className="mt-0.5 truncate text-[10.5px] text-[#6e6e73]">
                {roleLabel(user?.role)}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#a1a1aa]" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
            Workspace
          </p>
          <div className="space-y-0.5">{workspace.map(renderNavItem)}</div>

          <p className="px-2.5 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
            Services
          </p>
          <div className="space-y-0.5">{services.map(renderNavItem)}</div>

          {admin.length > 0 && (
            <>
              <p className="px-2.5 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                Administration
              </p>
              <div className="space-y-0.5">{admin.map(renderNavItem)}</div>
            </>
          )}
        </nav>

        <div className="p-3">
          <div className="rounded-[14px] border border-[#e5e5ea] bg-[#f7f7f8] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
              <ShieldCheck className="h-3 w-3" />
              Ballot privacy
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#86868b]">
              Votes are separated from identities. Every administrative action
              is written to the audit log.
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 py-1.5">
            <span className="text-[10px] text-[#a1a1aa]">CampusVoice v1.0</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-[#6e6e73] transition-colors hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#e5e5ea] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6e6e73] transition-colors hover:bg-[#f0f0f2] hover:text-[#1d1d1f] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 text-[12px] sm:flex">
              <Link
                href="/dashboard"
                className="font-medium text-[#86868b] transition-colors hover:text-[#0071e3]"
              >
                Workspace
              </Link>
              <span className="text-[#c7c7cc]">/</span>
              <span className="truncate font-semibold text-[#1d1d1f]">
                {activeItem?.name || 'Overview'}
              </span>
            </div>

            <span className="truncate text-[13px] font-semibold text-[#1d1d1f] sm:hidden">
              {activeItem?.name || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 w-[232px] items-center gap-2 rounded-full border border-[#e5e5ea] bg-[#f5f5f7] px-3.5 text-[12px] text-[#86868b] transition-colors hover:bg-[#efeff1] md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search the record</span>
              <span className="flex items-center gap-0.5">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>

            <button
              onClick={() => setCommandOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6e6e73] transition-colors hover:bg-[#f0f0f2] hover:text-[#1d1d1f] md:hidden"
              aria-label="Open command palette"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <Link
              href="/dashboard/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6e6e73] transition-colors hover:bg-[#f0f0f2] hover:text-[#1d1d1f]"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#ff3b30] px-0.5 text-[9px] font-semibold text-white ring-2 ring-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <div className="hidden h-6 w-px bg-[#e5e5ea] sm:block" />

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-[#f0f0f2]"
            >
              <Avatar
                name={user?.fullName || user?.username}
                className="h-8 w-8 text-[11px]"
              />
              <span className="hidden min-w-0 md:block">
                <span className="block max-w-[140px] truncate text-[12px] font-medium leading-tight text-[#1d1d1f]">
                  {user?.fullName || user?.username}
                </span>
                <span className="block text-[10px] leading-tight text-[#86868b]">
                  {roleLabel(user?.role)}
                </span>
              </span>
            </Link>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto bg-white">
          <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
