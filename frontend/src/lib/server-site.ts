import { cache } from "react";
import type { HomePayload, PublicSettings } from "./types";

export type SiteMetaSettings = Pick<
  PublicSettings,
  "siteName" | "logoUrl" | "tagline" | "heroTitle" | "heroSubtitle" | "heroImage" | "aboutShort" | "socials"
>;

export const FALLBACK_SITE: SiteMetaSettings = {
  siteName: "Madrasa Miftah ul Uloom",
  logoUrl: "",
  tagline: { en: "Knowledge, character and service" },
  heroTitle: { en: "Knowledge that shapes character, service that serves the community" },
  heroSubtitle: {
    en: "A centre of Islamic learning offering structured programmes in Qur'an, Arabic and the Islamic sciences, with a commitment to scholarship, character and service."
  },
  heroImage: "",
  aboutShort: {
    en: "An institution dedicated to authentic Islamic learning and the formation of upright character."
  },
  socials: {}
};

export function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function apiBaseUrl() {
  return (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
}

export function absoluteUrl(value: string | undefined | null) {
  if (!value) return "";
  try {
    return new URL(value, `${siteBaseUrl()}/`).toString();
  } catch {
    return "";
  }
}

export function english(value: { en?: string; ur?: string; ar?: string } | undefined | null) {
  return value?.en || value?.ur || value?.ar || "";
}

async function fetchSiteSettings(): Promise<PublicSettings | null> {
  try {
    const response = await fetch(`${apiBaseUrl()}/api/public/settings`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return null;
    return (await response.json()) as PublicSettings;
  } catch {
    return null;
  }
}

export const getSiteSettings = cache(fetchSiteSettings);

async function fetchHomeData(): Promise<HomePayload | null> {
  try {
    const response = await fetch(`${apiBaseUrl()}/api/public/home`, {
      next: { revalidate: 20 },
      signal: AbortSignal.timeout(3500)
    });
    if (!response.ok) return null;
    return (await response.json()) as HomePayload;
  } catch {
    return null;
  }
}

export const getHomeData = cache(fetchHomeData);
