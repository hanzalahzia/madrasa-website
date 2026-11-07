import crypto from "node:crypto";
import { argon2id, argon2Verify } from "hash-wasm";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";
import type { UserRole } from "../models/core.js";

export const SESSION_COOKIE = "mmu_session";

export async function hashPassword(password: string): Promise<string> {
  return argon2id({
    password,
    salt: crypto.randomBytes(16),
    parallelism: 1,
    iterations: 2,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded"
  });
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash: passwordHash });
  } catch {
    return false;
  }
}

export interface SessionPayload {
  sub: string;
  role: UserRole;
  name: string;
  email: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.SESSION_SECRET, {
    expiresIn: `${env.SESSION_DAYS}d`,
    issuer: "madrasa-miftah-ul-uloom"
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, env.SESSION_SECRET, {
      issuer: "madrasa-miftah-ul-uloom"
    }) as jwt.JwtPayload & SessionPayload;
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/"
  });
}
