import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string | undefined | null): string {
  if (!name) return "MMU";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)._id || "");
  }
  return String(value);
}

export function nameOf(value: unknown, fallback = ""): string {
  if (!value) return fallback;
  if (typeof value === "string") return fallback;
  const record = value as Record<string, unknown>;
  const title = record.title || record.name;
  if (title && typeof title === "object") {
    const localized = title as Record<string, string>;
    return localized.en || localized.ur || localized.ar || fallback;
  }
  if (typeof title === "string") return title;
  if (typeof record.name === "string") return record.name;
  return fallback;
}

export function humanize(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function truncate(value: string | undefined | null, length = 140): string {
  if (!value) return "";
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function paragraphs(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}
