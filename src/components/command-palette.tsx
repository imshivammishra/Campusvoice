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
        className="absolute inset-0 bg-[#09090b]/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-[6px] border border-[#e4e4e7] bg-white shadow-[0_4px_16px_rgba(9,9,11,0.08),0_32px_64px_-24px_rgba(9,9,11,0.28)]"
      >
        <div className="flex items-center gap-3 border-b border-[#e4e4e7] px-4">
          <Search className="h-4 w-4 shrink-0 text-[#a1a1aa]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, tools and settings…"
            className="h-12 w-full bg-transparent text-[13.5px] text-[#09090b] outline-none placeholder:text-[#a1a1aa]"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-[#71717a]">
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
                    'flex w-full items-center gap-3 rounded-[4px] px-2.5 py-2 text-left transition-colors',
                    isActive ? 'bg-[#f4f4f5]' : 'hover:bg-[#fafafa]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] transition-colors',
                      isActive
                        ? 'bg-[#09090b] text-white'
                        : 'border border-[#e4e4e7] bg-white text-[#71717a]',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-[#09090b]">
                      {item.name}
                    </span>
                    <span className="block text-[10.5px] text-[#a1a1aa]">
                      {item.section}
                    </span>
                  </span>
                  {isActive ? (
                    <ArrowUpRight className="h-4 w-4 text-[#0f4c81]" />
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

        <div className="flex items-center justify-between border-t border-[#e4e4e7] bg-[#fafafa] px-4 py-2.5 text-[10.5px] text-[#a1a1aa]">
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
          <span>HUConnect</span>
        </div>
      </div>
    </div>
  );
}
