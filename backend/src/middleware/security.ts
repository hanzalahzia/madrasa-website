import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

export function originGuard(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  if (!env.corsOrigins.includes(origin)) {
    return next(new ApiError(403, "Request origin is not allowed."));
  }
  next();
}
