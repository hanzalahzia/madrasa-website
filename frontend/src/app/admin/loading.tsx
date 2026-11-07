export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="relative overflow-hidden rounded-3xl bg-brand-950 px-6 py-8 sm:px-8">
        <div aria-hidden className="pattern-islamic absolute inset-0 opacity-[0.12]" />
        <div className="relative space-y-3">
          <div className="h-3 w-28 animate-pulse rounded-full bg-gold-400/30" />
          <div className="h-9 w-2/3 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-white/10" />
          <div className="flex gap-2 pt-2">
            <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-brand-950/10 bg-white/70 p-5 shadow-card">
            <div className="h-3 w-24 animate-pulse rounded-full bg-brand-950/10" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-brand-950/10" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-brand-950/5" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-80 animate-pulse rounded-2xl border border-brand-950/10 bg-white/70" />
        <div className="h-80 animate-pulse rounded-2xl border border-brand-950/10 bg-white/70" />
      </div>
    </div>
  );
}
