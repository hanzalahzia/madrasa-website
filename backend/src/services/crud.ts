import { Router } from "express";
import type { Request } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError, asyncHandler, paginationMeta, validateBody } from "../utils/http.js";
import { writeAudit } from "../utils/audit.js";

interface CrudOptions {
  model: any;
  entityName: string;
  schema: ZodTypeAny;
  sort?: Record<string, 1 | -1>;
  searchFields?: string[];
  beforeCreate?: (req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (req: Request, doc: any) => Promise<void> | void;
  afterCreate?: (req: Request, doc: any) => Promise<void> | void;
  afterUpdate?: (req: Request, doc: any) => Promise<void> | void;
}

export function crudRouter(options: CrudOptions) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
      const limit = Math.min(200, Math.max(1, Number.parseInt(String(req.query.limit || "100"), 10) || 100));
      const filter: Record<string, unknown> = {};
      const search = String(req.query.q || "").trim();
      if (search && options.searchFields?.length) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = options.searchFields.map((field) => ({ [field]: pattern }));
      }
      const [items, total] = await Promise.all([
        options.model
          .find(filter)
          .sort(options.sort || { createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        options.model.countDocuments(filter)
      ]);
      res.json({ items, pagination: paginationMeta(total, page, limit) });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const doc = await options.model.findById(req.params.id).lean();
      if (!doc) throw new ApiError(404, `${options.entityName} not found.`);
      res.json(doc);
    })
  );

  router.post(
    "/",
    validateBody(options.schema),
    asyncHandler(async (req, res) => {
      const extras = options.beforeCreate ? await options.beforeCreate(req) : {};
      const doc = await options.model.create({ ...req.body, ...extras });
      await writeAudit(req, `${options.entityName.toLowerCase()}.create`, options.entityName, String(doc._id));
      if (options.afterCreate) await options.afterCreate(req, doc);
      res.status(201).json(doc);
    })
  );

  router.put(
    "/:id",
    validateBody(options.schema),
    asyncHandler(async (req, res) => {
      const extras = options.beforeUpdate ? await options.beforeUpdate(req) : {};
      const updates = { ...req.body, ...extras };
      const doc = await options.model.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!doc) throw new ApiError(404, `${options.entityName} not found.`);
      await writeAudit(req, `${options.entityName.toLowerCase()}.update`, options.entityName, String(doc._id));
      if (options.afterUpdate) await options.afterUpdate(req, doc);
      res.json(doc);
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const doc = await options.model.findById(req.params.id);
      if (!doc) throw new ApiError(404, `${options.entityName} not found.`);
      if (options.beforeDelete) await options.beforeDelete(req, doc);
      await options.model.findByIdAndDelete(req.params.id);
      await writeAudit(req, `${options.entityName.toLowerCase()}.delete`, options.entityName, String(doc._id));
      res.json({ message: `${options.entityName} removed.` });
    })
  );

  return router;
}
