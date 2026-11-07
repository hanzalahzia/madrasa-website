"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-red-700">Something went wrong</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-brand-950">We could not load this page</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Please retry in a moment. If the problem continues, contact the madrasa office and quote reference{" "}
          <span className="font-mono text-xs text-brand-950">{error.digest || "unavailable"}</span>.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-950 px-5 text-sm font-semibold text-ivory transition hover:bg-brand-900"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-brand-950/15 bg-white px-5 text-sm font-semibold text-brand-950 transition hover:border-brand-950/30"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
