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
    'bg-[#0071e3] text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-[#0077ed] active:bg-[#0064cc] focus-visible:ring-[#0071e3]/30',
  secondary:
    'border-[#d4d4d8] bg-white text-[#09090b] hover:border-[#a1a1aa] hover:bg-[#fafafa] active:bg-[#f4f4f5] focus-visible:ring-[#09090b]/15',
  outline:
    'border-[#d4d4d8] bg-white text-[#09090b] hover:border-[#09090b] hover:bg-[#fafafa] active:bg-[#f4f4f5] focus-visible:ring-[#09090b]/15',
  ghost:
    'text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#09090b] active:bg-[#e4e4e7] focus-visible:ring-[#09090b]/10',
  destructive:
    'bg-[#d70015] text-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] hover:bg-[#991b1b] active:bg-[#7f1d1d] focus-visible:ring-[#d70015]/25',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-5 text-[13.5px]',
  icon: 'h-9 w-9 p-0',
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
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-transparent font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40',
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
        'rounded-[16px] border border-[#e4e4e7] bg-white text-[#09090b] shadow-[0_1px_1px_rgba(9,9,11,0.02)]',
        hover &&
          'transition-colors duration-150 hover:border-[#a1a1aa] hover:bg-[#fefefe]',
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
    <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-[14.5px] font-semibold leading-tight tracking-[-0.01em] text-[#09090b]',
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
      className={cn('text-[12.5px] leading-relaxed text-[#71717a]', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-5 pt-0', className)}
      {...props}
    />
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
  default: 'border-[#e4e4e7] bg-[#fafafa] text-[#52525b]',
  secondary: 'border-[#e4e4e7] bg-white text-[#71717a]',
  success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#248a3d]',
  warning: 'border-[#fde68a] bg-[#fffbeb] text-[#b25000]',
  danger: 'border-[#fecaca] bg-[#fef2f2] text-[#d70015]',
  info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#0071e3]',
  outline: 'border-[#d4d4d8] bg-transparent text-[#3f3f46]',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[10px] border px-2 py-0.5 text-[10.5px] font-medium capitalize leading-4',
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
  certified: 'success',
  pending: 'warning',
  in_review: 'warning',
  review: 'warning',
  voting: 'info',
  voting_active: 'info',
  nomination: 'info',
  scheduled: 'info',
  draft: 'secondary',
  closed: 'secondary',
  archived: 'secondary',
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
/*  Page header                                                                */
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
    <div className="flex flex-col gap-4 border-b border-[#e4e4e7] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#0071e3]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-semibold leading-[1.06] tracking-[-0.03em] text-[#09090b] sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#71717a]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                  */
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
    <div className="rounded-[16px] border border-[#e4e4e7] bg-white p-5 transition-colors duration-150 hover:border-[#a1a1aa]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-medium text-[#71717a]">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[#e4e4e7] bg-[#fafafa] text-[#0071e3]">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-[#09090b]">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta && (
          <span className="text-[11px] font-medium text-[#248a3d]">
            {delta}
          </span>
        )}
        {hint && (
          <p className="text-[11.5px] leading-snug text-[#a1a1aa]">{hint}</p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                */
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
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed border-[#d4d4d8] bg-[#fafafa] p-10 text-center shadow-none">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#e4e4e7] bg-white text-[#0071e3]">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <p className="text-[14.5px] font-semibold text-[#09090b]">{title}</p>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#71717a]">
            {description}
          </p>
        )}
      </div>
      {action}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading                                                                    */
/* -------------------------------------------------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-[12px] bg-[#f4f4f5]', className)}
    />
  );
}

export function CardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
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
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
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
/*  Avatar                                                                     */
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
        'inline-flex items-center justify-center rounded-[12px] bg-[#0071e3] text-[12px] font-semibold uppercase text-white',
        className,
      )}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form controls                                                              */
/* -------------------------------------------------------------------------- */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-[12px] border border-[#d4d4d8] bg-white px-3 text-[13.5px] text-[#09090b] shadow-[0_1px_1px_rgba(9,9,11,0.02)] outline-none transition-[border-color,box-shadow] placeholder:text-[#a1a1aa] focus:border-[#09090b] focus:ring-[3px] focus:ring-[#09090b]/[0.08] disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:opacity-60',
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
      'min-h-[96px] w-full rounded-[12px] border border-[#d4d4d8] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[#09090b] shadow-[0_1px_1px_rgba(9,9,11,0.02)] outline-none transition-[border-color,box-shadow] placeholder:text-[#a1a1aa] focus:border-[#09090b] focus:ring-[3px] focus:ring-[#09090b]/[0.08] disabled:bg-[#fafafa] disabled:opacity-60',
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
      'h-10 w-full rounded-[12px] border border-[#d4d4d8] bg-white px-3 text-[13.5px] text-[#09090b] shadow-[0_1px_1px_rgba(9,9,11,0.02)] outline-none transition-[border-color,box-shadow] focus:border-[#09090b] focus:ring-[3px] focus:ring-[#09090b]/[0.08] disabled:bg-[#fafafa] disabled:opacity-60',
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
      className={cn('text-[12.5px] font-medium text-[#3f3f46]', className)}
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
    <div className="space-y-1.5">
      {label && (
        <Label>
          {label}
          {required && <span className="ml-0.5 text-[#d70015]">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11.5px] leading-relaxed text-[#a1a1aa]">{hint}</p>
      )}
      {error && <p className="text-[11.5px] text-[#d70015]">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal                                                                      */
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
        className="absolute inset-0 animate-in fade-in bg-[#09090b]/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-[16px] border border-[#e4e4e7] bg-white shadow-[0_4px_16px_rgba(9,9,11,0.08),0_32px_64px_-24px_rgba(9,9,11,0.28)]',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e4e4e7] p-5">
          <div>
            <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.015em] text-[#09090b]">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#71717a]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#71717a] transition-colors hover:bg-[#f4f4f5] hover:text-[#09090b]"
            aria-label="Close"
          >
            <X className="h-[17px] w-[17px]" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[#e4e4e7] bg-[#fafafa] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                      */
/* -------------------------------------------------------------------------- */

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-[#e4e4e7] bg-white">
      <table className={cn('w-full text-[12.5px]', className)} {...props} />
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-[#e4e4e7] bg-[#fafafa] text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">
      {children}
    </thead>
  );
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-4 py-3 font-medium', className)} {...props} />
  );
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-[#f4f4f5] transition-colors last:border-0 hover:bg-[#fafafa]',
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
      className={cn('px-4 py-3 align-middle text-[#18181b]', className)}
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
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-full bg-[#f4f4f5]',
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-[#0071e3] transition-all duration-700',
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
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[10px] border border-[#e4e4e7] bg-[#fafafa] px-1 text-[10px] font-medium text-[#71717a]">
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
        <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#71717a]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#09090b] sm:text-[42px]">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-pretty text-[14px] leading-relaxed text-[#52525b] sm:text-[15px]',
            align === 'center' && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
