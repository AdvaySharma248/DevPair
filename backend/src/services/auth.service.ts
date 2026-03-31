import argon2 from "argon2";
import { z } from "zod";
import type { AuthSession, User } from "@prisma/client";
import { env } from "../config/env.ts";
import { db } from "../lib/db.ts";
import { AppError } from "../lib/errors.ts";
import { serializeUser } from "../lib/serializers.ts";
import { createSessionToken, hashSessionToken } from "../lib/security.ts";

const signupSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().min(1, "Name is required").max(120),
  role: z.enum(["mentor", "student"]),
});

const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatar: z.string().trim().url().nullable().optional(),
  defaultLanguage: z
    .enum(["javascript", "typescript", "python", "java", "cpp"])
    .nullable()
    .optional(),
});

type SessionRecord = AuthSession & { user: User };

async function createDbSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + env.sessionTtlMs);

  const session = await db.authSession.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { session, token };
}

export async function signup(input: unknown) {
  const data = signupSchema.parse(input);

  const existingUser = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await argon2.hash(data.password);

  const user = await db.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: data.role.toUpperCase() as "MENTOR" | "STUDENT",
    },
  });

  const { token } = await createDbSession(user.id);

  return {
    user: serializeUser(user),
    token,
  };
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input);

  const user = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValidPassword = await argon2.verify(user.passwordHash, data.password);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const { token } = await createDbSession(user.id);

  return {
    user: serializeUser(user),
    token,
  };
}

export async function getAuthSessionByToken(token?: string): Promise<SessionRecord | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await db.authSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await db.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session;
}

export async function logout(token?: string) {
  if (!token) {
    return;
  }

  await db.authSession
    .deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    })
    .catch(() => undefined);
}

export async function updateCurrentUser(userId: string, input: unknown) {
  const data = updateProfileSchema.parse(input);

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      ...(data.defaultLanguage !== undefined
        ? { defaultLanguage: data.defaultLanguage }
        : {}),
    },
  });

  return serializeUser(updatedUser);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.sessionCookieSameSite,
    secure: env.isProduction,
    maxAge: env.sessionTtlMs,
    path: "/",
  };
}
