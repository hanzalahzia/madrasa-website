import path from "node:path";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import mongoose from "mongoose";
import { env, uploadRoot } from "./config/env.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { originGuard } from "./middleware/security.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { portalRouter } from "./routes/portal.js";
import { adminRouter } from "./routes/admin/index.js";
import { ApiError } from "./utils/http.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.isProduction) app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false
    })
  );
  app.use(compression({ threshold: 512, level: 6 }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(originGuard);
  app.use(generalLimiter);

  app.use("/uploads/public", express.static(path.resolve(uploadRoot, "public"), { maxAge: "7d" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/portal", portalRouter);
  app.use("/api/admin", adminRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found." });
  });

  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof ApiError) {
        return res.status(error.status).json({
          message: error.message,
          ...(error.details ? { details: error.details } : {})
        });
      }

      if (error instanceof multer.MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "The uploaded file is too large."
            : "The upload could not be processed.";
        return res.status(400).json({ message });
      }

      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
          message: "Please check the submitted information.",
          details: Object.values(error.errors).map((entry) => ({
            path: entry.path,
            message: entry.message
          }))
        });
      }

      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "An invalid identifier or value was supplied." });
      }

      if (typeof error === "object" && error !== null && (error as any).code === 11000) {
        const field = Object.keys((error as any).keyPattern || {})[0];
        return res.status(409).json({
          message: field ? `A record with this ${field} already exists.` : "A duplicate record already exists."
        });
      }

      if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({ message: "The request body is not valid JSON." });
      }

      console.error("Unhandled API error", error instanceof Error ? error.stack : error);
      return res.status(500).json({ message: "An unexpected error occurred." });
    }
  );

  return app;
}
