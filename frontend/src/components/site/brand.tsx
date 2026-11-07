"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { PublicSettings } from "@/lib/types";

export function Brand({
  compact = false,
  className,
  inverted = false
}: {
  compact?: boolean;
  className?: string;
  inverted?: boolean;
}) {
  const { t, localized } = useLanguage();
  const { data: settings } = useApi<PublicSettings>("/public/settings");
  const siteName = settings?.siteName || "Madrasa Miftah ul Uloom";
  const subtitle = localized(settings?.brandSubtitle) || "Knowledge · Character · Service";
  const logo = settings?.logoUrl || process.env.NEXT_PUBLIC_LOGO_URL || "/branding/emblem-placeholder.svg";

  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)} aria-label={`${siteName} ${t("nav.home")}`}>
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border",
          inverted ? "border-gold-400/50 bg-white/5" : "border-gold-600/30 bg-ivory"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`${siteName} emblem`} className="h-10 w-10 object-contain" />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-lg font-semibold tracking-wide sm:text-xl",
            inverted ? "text-ivory" : "text-brand-950"
          )}
        >
          {siteName}
        </span>
        {!compact ? (
          <span className={cn("block text-[10px] uppercase tracking-[0.28em]", inverted ? "text-gold-300" : "text-gold-700")}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
