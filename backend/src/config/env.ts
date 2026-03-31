import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().min(1).default("devpair_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
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
  allowedCorsOrigins: parsedEnv.data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionCookieSameSite: (parsedEnv.data.NODE_ENV === "production"
    ? "none"
    : "lax") as "none" | "lax",
  sessionTtlMs: parsedEnv.data.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
} as const;
