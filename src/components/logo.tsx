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
        'inline-flex shrink-0 items-center justify-center rounded-[2px] border',
        inverted
          ? 'border-[#f8f6f0] bg-[#f8f6f0] text-[#171611]'
          : 'border-[#171611] bg-[#171611] text-[#f8f6f0]',
        className,
      )}
      aria-hidden="true"
    >
      <span className="font-editorial text-[0.63em] font-semibold leading-none tracking-[-0.04em]">
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
      <LogoMark
        inverted={light}
        className={cn('h-7 w-7', markClassName)}
      />
      {wordmark && (
        <span
          className={cn(
            'font-editorial text-[20px] font-semibold leading-none tracking-[-0.035em]',
            light ? 'text-[#f8f6f0]' : 'text-[#171611]',
          )}
        >
          CampusVoice
        </span>
      )}
    </Link>
  );
}
