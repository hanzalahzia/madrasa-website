import type { NextFunction, Request, Response } from "express";
import { User } from "../models/index.js";
import type { UserRole } from "../models/core.js";
import { SESSION_COOKIE, verifySession } from "../utils/auth.js";

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return next();
    const payload = verifySession(token);
    if (!payload) return next();
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.isActive) return next();
    req.user = {
      id: String(user._id),
      role: user.role as UserRole,
      name: user.name,
      email: user.email
    };
    next();
  } catch {
    next();
  }
}
