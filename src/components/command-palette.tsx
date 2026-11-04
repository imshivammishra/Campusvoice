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
        className="absolute inset-0 bg-[#171611]/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl overflow-hidden rounded-[2px] border border-[#171611]/25 bg-[#f8f6f0] shadow-[0_30px_90px_-32px_rgba(23,22,17,0.6)]"
      >
        <div className="flex items-center gap-3 border-b border-[#171611]/15 px-4">
          <Search className="h-4 w-4 shrink-0 text-[#7a7365]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the record…"
            className="h-14 w-full bg-transparent text-[14px] text-[#171611] outline-none placeholder:text-[#a29a8b]"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-[#7a7365]">
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
                    'flex w-full items-center gap-3 border-b border-[#171611]/10 px-4 py-2.5 text-left transition-colors last:border-0',
                    isActive ? 'bg-[#a33a1b]/[0.07]' : 'hover:bg-[#e9e4d8]/60',
                  )}
                >
                  <span className="w-5 shrink-0 font-mono text-[8px] text-[#a29a8b]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center border',
                      isActive
                        ? 'border-[#a33a1b] bg-[#a33a1b] text-white'
                        : 'border-[#171611]/15 text-[#7a7365]',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-editorial text-[15px] font-semibold text-[#171611]">
                      {item.name}
                    </span>
                    <span className="block font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-[#a29a8b]">
                      {item.section}
                    </span>
                  </span>
                  {isActive ? (
                    <ArrowUpRight className="h-4 w-4 text-[#a33a1b]" />
                  ) : (
                    <span className="font-mono text-[8px] text-[#a29a8b]">
                      {item.href}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#171611]/15 bg-[#e9e4d8] px-4 py-2.5 font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-[#7a7365]">
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
          <span>CampusVoice / Index</span>
        </div>
      </div>
    </div>
  );
}
