import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({
  className,
  inverted = false,
  hard = false,
}: {
  className?: string;
  inverted?: boolean;
  hard?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        hard ? 'rounded-[6px]' : 'rounded-[11px]',
        hard
          ? 'bg-[#09090b] text-white'
          : inverted
            ? 'bg-white text-[#0071e3]'
            : 'bg-[#0071e3] text-white',
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-[0.62em] font-semibold leading-none tracking-[-0.05em]">
        HU
      </span>
    </span>
  );
}

export function Logo({
  href = '/',
  className,
  light = false,
  hard = false,
  markClassName,
  wordmark = true,
}: {
  href?: string;
  className?: string;
  light?: boolean;
  hard?: boolean;
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
      aria-label="HUConnect home"
    >
      <LogoMark
        inverted={light}
        hard={hard}
        className={cn('h-7 w-7', markClassName)}
      />
      {wordmark && (
        <span
          className={cn(
            'text-[17px] font-semibold leading-none tracking-[-0.025em]',
            light ? 'text-white' : 'text-[#1d1d1f]',
            hard && 'text-[#09090b]',
          )}
        >
          HUConnect
        </span>
      )}
    </Link>
  );
}
