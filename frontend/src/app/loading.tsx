export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/15" />
        <span className="absolute inset-2 rounded-full border border-gold-500/25" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/30 bg-white shadow-glow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={process.env.NEXT_PUBLIC_LOGO_URL || "/branding/emblem-placeholder.svg"}
            alt=""
            className="h-10 w-10 animate-pulse object-contain"
          />
        </span>
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-semibold text-brand-950">Madrasa Miftah ul Uloom</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted">Preparing your page…</p>
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-brand-950/5">
        <span className="block h-full w-full animate-[shimmer_1.4s_linear_infinite] rounded-full bg-[linear-gradient(90deg,transparent,rgba(200,164,93,0.9),transparent)] bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
