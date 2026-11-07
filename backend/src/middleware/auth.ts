import type { NextFunction, Request, Response } from "express";
import { User } from "../models/index.js";
import type { UserRole } from "../models/core.js";
import { SESSION_COOKIE, verifySession } from "../utils/auth.js";
import { ApiError, asyncHandler } from "../utils/http.js";

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.[SESSION_COOKIE] || bearer;
  if (!token) throw new ApiError(401, "Please sign in to continue.");

  const payload = verifySession(token);
  if (!payload) throw new ApiError(401, "Your session has expired. Please sign in again.");

  const user = await User.findById(payload.sub).lean();
  if (!user || !user.isActive) throw new ApiError(401, "This account is not available.");

  req.user = {
    id: String(user._id),
    role: user.role as UserRole,
    name: user.name,
    email: user.email
  };
  next();
});

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "Please sign in to continue."));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new ApiError(401, "Please sign in to continue."));
  if (req.user.role !== "super_admin") {
    return next(new ApiError(403, "Administrator access is required."));
  }
  next();
}
