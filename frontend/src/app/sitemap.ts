import type { MetadataRoute } from "next";
import { apiBaseUrl, siteBaseUrl } from "@/lib/server-site";

export const revalidate = 3600;

type Entry = {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
  startDate?: string;
};

type Listed<T> = {
  items?: T[];
  pagination?: { pages?: number };
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function dateValue(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const [programs, events, books] = await Promise.all([
    getJson<Entry[]>("/api/public/programs"),
    getJson<Entry[]>("/api/public/events"),
    getJson<Listed<Entry>>("/api/public/books?limit=100&sort=newest")
  ]);

  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/mission-vision`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/management`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/programs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/admissions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/admissions/track`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/faculty`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/facilities`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/gallery`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/events`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/announcements`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faqs`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/books`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 }
  ];

  for (const program of programs || []) {
    if (!program.slug) continue;
    routes.push({
      url: `${base}/programs/${program.slug}`,
      lastModified: dateValue(program.updatedAt || program.createdAt),
      changeFrequency: "monthly",
      priority: 0.7
    });
  }

  for (const event of events || []) {
    if (!event.slug) continue;
    routes.push({
      url: `${base}/events/${event.slug}`,
      lastModified: dateValue(event.updatedAt || event.startDate),
      changeFrequency: "monthly",
      priority: 0.6
    });
  }

  for (const book of books?.items || []) {
    if (!book.slug) continue;
    routes.push({
      url: `${base}/books/${book.slug}`,
      lastModified: dateValue(book.updatedAt || book.createdAt),
      changeFrequency: "monthly",
      priority: 0.5
    });
  }

  return routes;
}
