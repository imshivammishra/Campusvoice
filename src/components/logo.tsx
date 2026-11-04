import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[11px]',
        inverted ? 'bg-white text-[#0071e3]' : 'bg-[#0071e3] text-white',
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-[0.62em] font-semibold leading-none tracking-[-0.05em]">
        CV
      </span>
    </span>
  );
}

export function Logo({
  href = '/',
  className,
  light = false,
  markClassName,
  wordmark = true,
}: {
  href?: string;
  className?: string;
  light?: boolean;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-2.5 outline-none',
        className,
      )}
      aria-label="CampusVoice home"
    >
      <LogoMark inverted={light} className={cn('h-7 w-7', markClassName)} />
      {wordmark && (
        <span
          className={cn(
            'text-[17px] font-semibold leading-none tracking-[-0.025em]',
            light ? 'text-white' : 'text-[#1d1d1f]',
          )}
        >
          CampusVoice
        </span>
      )}
    </Link>
  );
}
