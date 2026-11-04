import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Compact "HU" badge in the logo blue. Used for loaders / tight square spaces
 * where the full wordmark would not fit.
 */
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
        hard ? 'rounded-[10px]' : 'rounded-[8px]',
        hard
          ? 'bg-[#0a223a] text-white'
          : inverted
            ? 'bg-white text-[#0a223a]'
            : 'bg-[#0a223a] text-white',
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-[0.6em] font-bold leading-none tracking-[-0.05em]">
        HU
      </span>
    </span>
  );
}

/**
 * The HUConnect wordmark logo (brand SVG). Monochrome with a transparent
 * background, so it sits cleanly on light surfaces as-is; pass `light` to
 * invert it to white on dark surfaces.
 */
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
  /** Invert to a white wordmark for dark backgrounds. */
  light?: boolean;
  hard?: boolean;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center outline-none', className)}
      aria-label="HUConnect home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/branding/HUconnectLogo.svg"
        alt="HUConnect"
        className={cn(
          'h-[18px] w-auto object-contain',
          light && 'brightness-0 invert',
          markClassName,
        )}
      />
    </Link>
  );
}
