import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().min(1).default("devpair_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  FIREBASE_PROJECT_ID: z.string().trim().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().trim().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().trim().min(1).optional(),
  JUDGE0_BASE_URL: z.string().trim().url().optional(),
  JUDGE0_API_KEY: z.string().trim().min(1).optional(),
  JUDGE0_API_KEY_HEADER: z.string().trim().min(1).optional(),
  JUDGE0_LANGUAGE_IDS_JSON: z.string().trim().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid backend environment configuration:",
    parsedEnv.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  isProduction: parsedEnv.data.NODE_ENV === "production",
  judge0BaseUrl: parsedEnv.data.JUDGE0_BASE_URL?.replace(/\/+$/, "") ?? null,
  judge0ApiKeyHeader:
    parsedEnv.data.JUDGE0_API_KEY_HEADER?.trim() || "X-Auth-Token",
  allowedCorsOrigins: parsedEnv.data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionCookieSameSite: (parsedEnv.data.NODE_ENV === "production"
    ? "none"
    : "lax") as "none" | "lax",
  sessionTtlMs: parsedEnv.data.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
} as const;
