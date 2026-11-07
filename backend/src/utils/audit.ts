import type { Request } from "express";
import { clearPublicCache } from "../middleware/publicCache.js";
import { AuditLog } from "../models/index.js";

export async function writeAudit(
  req: Request,
  action: string,
  entity: string,
  entityId: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  clearPublicCache();
  try {
    await AuditLog.create({
      actor: req.user?.id || null,
      actorEmail: req.user?.email || "",
      action,
      entity,
      entityId,
      meta,
      ip: req.ip || ""
    });
  } catch (error) {
    console.error("Failed to write audit log", error instanceof Error ? error.message : error);
  }
}
