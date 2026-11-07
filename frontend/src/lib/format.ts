import { localeTags, statusKey, translate, type Locale, type Localized } from "./i18n";

export function formatDate(value: string | Date | null | undefined, locale: Locale, withTime = false): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(localeTags[locale], {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(withTime ? { hour: "numeric", minute: "2-digit" } : {})
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatNumber(value: number | null | undefined, locale: Locale): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  try {
    return new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: 2 }).format(value);
  } catch {
    return String(value);
  }
}

export function formatMoney(value: number | null | undefined, locale: Locale): string {
  const amount = formatNumber(Number(value) || 0, locale);
  if (locale === "ar") return `${amount} روبية`;
  if (locale === "ur") return `روپے ${amount}`;
  return `Rs ${amount}`;
}

export function formatStatus(value: string | undefined | null, locale: Locale): string {
  if (!value) return "—";
  const key = statusKey(value);
  const translated = translate(locale, key, "");
  if (translated && translated !== key) return translated;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function localizedText(value: Localized | string | null | undefined, locale: Locale, fallback = ""): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.ur || value.ar || fallback;
}

export function availabilityLabel(
  availability: "in_stock" | "low_stock" | "out_of_stock",
  locale: Locale
): string {
  const key = availability === "in_stock" ? "books.inStock" : availability === "low_stock" ? "books.lowStock" : "books.outOfStock";
  return translate(locale, key);
}
