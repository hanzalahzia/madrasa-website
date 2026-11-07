"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  dirFor,
  localizedValue,
  normalizeLocale,
  translate,
  type Locale,
  type Localized
} from "./i18n";

interface LanguageContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  localized: (value: Localized | string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  children
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    const value = normalizeLocale(next);
    document.cookie = `mmu_locale=${value}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(value);
  }, []);

  const t = useCallback((key: string, fallback?: string) => translate(locale, key, fallback), [locale]);
  const localized = useCallback(
    (value: Localized | string | null | undefined) => localizedValue(value, locale),
    [locale]
  );

  const contextValue = useMemo(
    () => ({ locale, dir: dirFor(locale), setLocale, t, localized }),
    [locale, setLocale, t, localized]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
