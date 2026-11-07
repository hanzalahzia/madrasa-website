"use client";

import { Globe2 } from "lucide-react";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <label
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium",
        inverted ? "border-white/20 bg-white/5 text-ivory" : "border-brand-950/10 bg-white/60 text-brand-950"
      )}
    >
      <Globe2 className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{t("nav.language")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={cn(
          "cursor-pointer appearance-none bg-transparent pe-1 text-xs font-medium outline-none",
          inverted ? "text-ivory" : "text-brand-950"
        )}
        aria-label={t("nav.language")}
      >
        {locales.map((entry) => (
          <option key={entry} value={entry} className="bg-white text-ink">
            {compact ? entry.toUpperCase() : localeNames[entry]}
          </option>
        ))}
      </select>
    </label>
  );
}
