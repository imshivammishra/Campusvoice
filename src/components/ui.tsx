import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-[#171611] text-[#f8f6f0] hover:bg-[#a33a1b] active:bg-[#8e3117] focus-visible:ring-[#a33a1b]/35',
  secondary:
    'border-[#c9c2b2] bg-transparent text-[#171611] hover:border-[#171611] hover:bg-[#e9e4d8] active:bg-[#e2dccd] focus-visible:ring-[#171611]/20',
  outline:
    'border-[#171611]/25 bg-[#f8f6f0] text-[#171611] hover:border-[#171611]/60 hover:bg-[#e9e4d8] focus-visible:ring-[#171611]/20',
  ghost:
    'text-[#a33a1b] hover:bg-[#e9e4d8] active:bg-[#e2dccd] focus-visible:ring-[#a33a1b]/25',
  destructive:
    'bg-[#8f1d13] text-white hover:bg-[#78170f] active:bg-[#65120c] focus-visible:ring-[#8f1d13]/40',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[9px]',
  md: 'h-10 px-4 text-[10px]',
  lg: 'h-12 px-6 text-[11px]',
  icon: 'h-10 w-10 p-0',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border border-transparent font-mono font-medium uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1eee6] disabled:pointer-events-none disabled:opacity-40',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[2px] border border-[#d8d2c3] bg-[#f8f6f0] text-card-foreground',
        hover &&
          'transition-colors duration-200 hover:border-[#a33a1b]/55 hover:bg-[#faf8f2]',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-editorial text-[20px] font-semibold leading-tight tracking-[-0.025em] text-[#171611]',
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-[13px] leading-relaxed text-[#5f5b4f]', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge                                                                       */
/* -------------------------------------------------------------------------- */

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

const badgeVariants: Record<BadgeVariant, string> = {
  default:
    'border-[#a33a1b]/30 bg-[#a33a1b]/10 text-[#8e3117]',
  secondary:
    'border-[#171611]/15 bg-transparent text-[#5f5b4f]',
  success:
    'border-[#2f5d3a]/25 bg-[#2f5d3a]/10 text-[#2f5d3a]',
  warning:
    'border-[#8a6116]/25 bg-[#8a6116]/10 text-[#7a5512]',
  danger:
    'border-[#8f1d13]/25 bg-[#8f1d13]/10 text-[#8f1d13]',
  info:
    'border-[#1f4f63]/25 bg-[#1f4f63]/10 text-[#1f4f63]',
  outline: 'border-[#171611]/30 text-[#171611]',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em]',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

const STATUS_MAP: Record<string, BadgeVariant> = {
  active: 'success',
  open: 'success',
  approved: 'success',
  resolved: 'success',
  passed: 'success',
  published: 'success',
  completed: 'success',
  pending: 'warning',
  in_review: 'warning',
  review: 'warning',
  voting: 'info',
  nomination: 'info',
  scheduled: 'info',
  draft: 'secondary',
  closed: 'secondary',
  expired: 'secondary',
  rejected: 'danger',
  failed: 'danger',
  deactivated: 'danger',
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const key = status.toLowerCase().replace(/\s+/g, '_');
  const variant = STATUS_MAP[key] ?? 'secondary';
  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}

/* -------------------------------------------------------------------------- */
/*  Page header                                                                 */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#cfc8b8] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#7a7365]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-editorial text-[34px] font-semibold leading-[1.02] tracking-[-0.035em] text-[#171611] sm:text-[42px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#5f5b4f]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                   */
/* -------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  delta?: string;
  tone?: 'indigo' | 'emerald' | 'amber' | 'sky';
}) {
  return (
    <div className="border-t border-[#171611] pt-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-[#7a7365]">
          {label}
        </p>
        {Icon && <Icon className="h-3.5 w-3.5 text-[#7a7365]" />}
      </div>
      <p className="mt-3 font-editorial text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#171611]">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta && (
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#2f5d3a]">
            {delta}
          </span>
        )}
        {hint && <p className="text-[11px] leading-snug text-[#7a7365]">{hint}</p>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed bg-transparent p-12 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center border border-[#171611]/20 text-[#7a7365]">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <p className="font-editorial text-[20px] font-semibold text-[#171611]">
          {title}
        </p>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-[#5f5b4f]">
            {description}
          </p>
        )}
      </div>
      {action}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading                                                                     */
/* -------------------------------------------------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-[1px] bg-[#e3ddcf]', className)}
    />
  );
}

export function CardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
          <Skeleton className="mt-6 h-2.5 w-full" />
          <Skeleton className="mt-2 h-2.5 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-4 h-2.5 w-full" />
          <Skeleton className="mt-2 h-2.5 w-3/4" />
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                      */
/* -------------------------------------------------------------------------- */

export function Avatar({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const label = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[2px] border border-[#171611]/15 bg-[#e7e2d5] font-editorial text-[13px] font-semibold text-[#171611]',
        className,
      )}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form controls                                                               */
/* -------------------------------------------------------------------------- */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full rounded-[2px] border border-[#c9c2b2] bg-[#f8f6f0] px-3 text-[14px] text-[#171611] outline-none transition-colors placeholder:text-[#948c7d] focus:border-[#171611] focus:ring-2 focus:ring-[#a33a1b]/10 disabled:cursor-not-allowed disabled:bg-[#e9e4d8] disabled:opacity-60',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[96px] w-full rounded-[2px] border border-[#c9c2b2] bg-[#f8f6f0] px-3 py-2.5 text-[14px] leading-relaxed text-[#171611] outline-none transition-colors placeholder:text-[#948c7d] focus:border-[#171611] focus:ring-2 focus:ring-[#a33a1b]/10 disabled:bg-[#e9e4d8] disabled:opacity-60',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full rounded-[2px] border border-[#c9c2b2] bg-[#f8f6f0] px-3 text-[14px] text-[#171611] outline-none transition-colors focus:border-[#171611] focus:ring-2 focus:ring-[#a33a1b]/10 disabled:bg-[#e9e4d8] disabled:opacity-60',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-[#5f5b4f]',
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="ml-0.5 text-[#a33a1b]">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11px] leading-relaxed text-[#7a7365]">{hint}</p>
      )}
      {error && <p className="text-[11px] text-[#8f1d13]">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal                                                                       */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#171611]/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-[2px] border border-[#171611]/25 bg-[#f8f6f0] shadow-[0_30px_90px_-32px_rgba(23,22,17,0.6)]',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#d8d2c3] p-6">
          <div>
            <h3 className="font-editorial text-[24px] font-semibold leading-tight tracking-[-0.025em]">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#5f5b4f]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-[2px] p-1.5 text-[#5f5b4f] transition-colors hover:bg-[#e9e4d8] hover:text-[#171611]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[#d8d2c3] bg-[#e9e4d8] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                        */
/* -------------------------------------------------------------------------- */

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto border border-[#d8d2c3] bg-[#f8f6f0]">
      <table className={cn('w-full text-[13px]', className)} {...props} />
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-[#171611]/20 bg-[#e9e4d8] text-left font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-[#5f5b4f]">
      {children}
    </thead>
  );
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 font-medium', className)} {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-[#171611]/10 transition-colors last:border-0 hover:bg-[#f3efe4]',
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-[#171611]', className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress                                                                   */
/* -------------------------------------------------------------------------- */

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn('h-1 w-full overflow-hidden bg-[#d8d2c3]', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full bg-[#171611] transition-all duration-700',
          indicatorClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Keyboard key                                                               */
/* -------------------------------------------------------------------------- */

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[2px] border border-[#171611]/20 bg-[#f8f6f0] px-1 font-mono text-[9px] font-medium text-[#5f5b4f]">
      {children}
    </kbd>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section heading                                                            */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[#7a7365]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-balance font-editorial text-[36px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[46px]">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-pretty text-[14px] leading-relaxed text-[#5f5b4f] sm:text-[15px]',
            align === 'center' && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
