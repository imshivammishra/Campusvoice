'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CornerDownLeft, Search } from 'lucide-react';
import { Kbd } from '@/components/ui';
import { cn } from '@/lib/utils';

export type CommandItem = {
  name: string;
  href: string;
  section: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function CommandPalette({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((current) =>
          filtered.length ? (current + 1) % filtered.length : 0,
        );
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((current) =>
          filtered.length ? (current - 1 + filtered.length) % filtered.length : 0,
        );
      }
      if (event.key === 'Enter' && filtered[active]) {
        event.preventDefault();
        router.push(filtered[active].href);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, filtered, onClose, open, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-[#1d1d1f]/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-[22px] border border-white/60 material-thick shadow-lift"
      >
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4">
          <Search className="h-4 w-4 shrink-0 text-[#86868b]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, tools and settings…"
            className="h-12 w-full bg-transparent text-[14px] text-[#1d1d1f] outline-none placeholder:text-[#a1a1aa]"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-[#6e6e73]">
              No matches for “{query}”. Try elections, proposals or support.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === active;
              return (
                <button
                  key={`${item.href}-${item.name}`}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors',
                    isActive ? 'bg-[#0071e3]/10' : 'hover:bg-black/[0.045]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors',
                      isActive
                        ? 'bg-[#0071e3] text-white shadow-[0_2px_6px_-2px_rgba(0,113,227,0.6)]'
                        : 'border border-black/[0.06] bg-white text-[#6e6e73]',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#1d1d1f]">
                      {item.name}
                    </span>
                    <span className="block text-[10.5px] text-[#86868b]">
                      {item.section}
                    </span>
                  </span>
                  {isActive ? (
                    <ArrowUpRight className="h-4 w-4 text-[#0071e3]" />
                  ) : (
                    <span className="font-mono text-[10px] text-[#a1a1aa]">
                      {item.href}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.06] bg-white/40 px-4 py-2.5 text-[10.5px] text-[#86868b]">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="h-3 w-3" />
              </Kbd>{' '}
              open
            </span>
          </span>
          <span>CampusVoice</span>
        </div>
      </div>
    </div>
  );
}
