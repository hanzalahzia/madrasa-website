import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} aria-hidden />;
}

export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-brand-950/15 bg-white/50 p-8 text-muted"
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/20" />
        <Spinner className="relative h-6 w-6 text-brand-700" />
      </span>
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-shimmer rounded-xl bg-brand-950/[0.06] bg-[length:700px_100%]", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(6,78,59,0.04) 0%, rgba(6,78,59,0.09) 50%, rgba(6,78,59,0.04) 100%)"
      }}
    />
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fadeUp flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-950/15 bg-white/60 px-6 py-14 text-center">
      <span className="rounded-full bg-brand-950/5 p-3 text-brand-700 ring-8 ring-brand-950/[0.02]">
        {icon || <Inbox className="h-6 w-6" />}
      </span>
      <h3 className="font-display text-xl font-semibold text-brand-950">{title}</h3>
      {description ? <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again"
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="animate-fadeUp flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-6 py-12 text-center">
      <span className="rounded-full bg-red-100 p-3 text-red-700 ring-8 ring-red-100/50">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h3 className="font-display text-xl font-semibold text-red-900">{title}</h3>
      {description ? <p className="max-w-md text-sm leading-relaxed text-red-800/80">{description}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
