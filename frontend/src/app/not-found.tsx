import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_55%)]" />
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-950/5 text-brand-800">
          <Compass className="h-8 w-8" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-gold-700">404 · Page not found</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-brand-950">This page could not be found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page may have moved, or the link may be incorrect. Return to the homepage or explore our programmes and
          bookstore.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-950 px-5 text-sm font-semibold text-ivory transition hover:bg-brand-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-brand-950/15 bg-white px-5 text-sm font-semibold text-brand-950 transition hover:border-brand-950/30"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
