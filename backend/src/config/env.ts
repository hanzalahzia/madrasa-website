import "dotenv/config";
import { z } from "zod";

const boolString = z
  .string()
  .optional()
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default(""),
  USE_IN_MEMORY_DB: boolString,
  IN_MEMORY_DB_PATH: z.string().default(".data/mongo"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  UPLOAD_STORAGE_PATH: z.string().default("uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(20).default(5),
  DEFAULT_SHIPPING_FEE: z.coerce.number().min(0).default(250),
  DEFAULT_FREE_SHIPPING_ABOVE: z.coerce.number().min(0).default(5000),
  WHATSAPP_NUMBER: z.string().optional().default("923343595001"),
  SEED_ADMIN_NAME: z.string().default("Madrasa Administrator"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  SEED_ADMIN_PASSWORD: z.string().default(""),
  SEED_DEMO: z.string().optional().default("true")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  useInMemoryDb: parsed.data.MONGODB_URI
    ? false
    : parsed.data.NODE_ENV !== "production" && parsed.data.USE_IN_MEMORY_DB,
  corsOrigins: Array.from(
    new Set(
      [parsed.data.FRONTEND_URL, ...parsed.data.CORS_ORIGINS.split(",")]
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
  ),
  seedDemo: parsed.data.SEED_DEMO !== "false"
};

if (!env.useInMemoryDb && !parsed.data.MONGODB_URI) {
  throw new Error("MONGODB_URI is required unless USE_IN_MEMORY_DB=true in development");
}

if (env.isProduction && env.useInMemoryDb) {
  throw new Error("The in-memory database is not permitted in production");
}

export const uploadRoot = parsed.data.UPLOAD_STORAGE_PATH;
export const maxUploadBytes = parsed.data.MAX_UPLOAD_MB * 1024 * 1024;
