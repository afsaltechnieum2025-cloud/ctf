import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Softer callout — primary tint on panel */
export function YellowAccentBlock({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card/80 to-primary/[0.04] p-4 overflow-hidden',
        className,
      )}
    >
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-gradient-to-b from-primary to-accent" />
      <div className={cn('pl-3', contentClassName)}>{children}</div>
    </div>
  );
}

/** Stronger callout — accent-forward */
export function OrangeAccentBlock({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-primary/35 bg-gradient-to-br from-primary/12 via-accent/10 to-primary/8 p-4 overflow-hidden',
        className,
      )}
    >
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-gradient-to-b from-accent to-primary" />
      <div className={cn('pl-3', contentClassName)}>{children}</div>
    </div>
  );
}

export function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      {children}
    </p>
  );
}
