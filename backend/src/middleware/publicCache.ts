import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

interface CachedResponse {
  body: string;
  etag: string;
  contentType: string;
  expiresAt: number;
}

const store = new Map<string, CachedResponse>();
const MAX_ENTRIES = 250;

function remember(key: string, entry: CachedResponse) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, entry);
}

export function clearPublicCache() {
  store.clear();
}

export function publicResponseCache(ttlSeconds = 20) {
  const ttl = Math.max(1, ttlSeconds) * 1000;

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" || process.env.NODE_ENV === "test") return next();

    const key = req.originalUrl;
    const cached = store.get(key);
    res.setHeader("Vary", "Accept-Encoding");

    if (cached && cached.expiresAt > Date.now()) {
      const clientEtag = req.headers["if-none-match"];
      if (clientEtag && clientEtag.split(",").some((value) => value.trim() === cached.etag)) {
        res.status(304).end();
        return;
      }
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}, stale-while-revalidate=120`);
      res.setHeader("ETag", cached.etag);
      res.status(200).send(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = JSON.stringify(body);
        const etag = `"${crypto.createHash("sha1").update(payload).digest("base64url")}"`;
        remember(key, {
          body: payload,
          etag,
          contentType: "application/json; charset=utf-8",
          expiresAt: Date.now() + ttl
        });
        res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}, stale-while-revalidate=120`);
        res.setHeader("ETag", etag);
      }
      return originalJson(body);
    }) as Response["json"];

    next();
  };
}
