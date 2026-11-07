import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-950/10 bg-white/90 p-6 shadow-card backdrop-blur-sm transition-colors duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-xl font-semibold text-brand-950", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm leading-relaxed text-muted", className)} {...props}>
      {children}
    </p>
  );
}

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "gold" | "info";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-brand-950/5 text-brand-950 ring-brand-950/10",
  success: "bg-emerald-100 text-emerald-800 ring-emerald-700/20",
  warning: "bg-amber-100 text-amber-800 ring-amber-700/20",
  danger: "bg-red-100 text-red-800 ring-red-700/20",
  gold: "bg-gold-100 text-gold-800 ring-gold-600/30",
  info: "bg-sky-100 text-sky-800 ring-sky-700/20"
};

export function Badge({
  tone = "neutral",
  className,
  children
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const background: Record<BadgeTone, string> = {
    neutral: "from-brand-950/[0.03] to-transparent",
    success: "from-emerald-500/10 to-transparent",
    warning: "from-amber-500/10 to-transparent",
    danger: "from-red-500/10 to-transparent",
    gold: "from-gold-500/15 to-transparent",
    info: "from-sky-500/10 to-transparent"
  };
  const iconTone: Record<BadgeTone, string> = {
    neutral: "bg-brand-950/5 text-brand-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    gold: "bg-gold-100 text-gold-800",
    info: "bg-sky-100 text-sky-800"
  };
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-brand-950/10 bg-gradient-to-br p-5 shadow-card transition duration-300 ease-premium hover:-translate-y-1 hover:shadow-premium",
        background[tone],
        className
      )}
    >
      <span aria-hidden className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
        {icon ? (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105", iconTone[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
