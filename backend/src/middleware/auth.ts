import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.ts";
import { getAuthSessionByToken } from "../services/auth.service.ts";
import { serializeUser } from "../lib/serializers.ts";

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const sessionToken = request.cookies?.[env.SESSION_COOKIE_NAME];
  const authSession = await getAuthSessionByToken(sessionToken);

  if (!authSession) {
    response.status(401).json({ error: "Authentication required" });
    return;
  }

  request.auth = {
    sessionId: authSession.id,
    user: serializeUser(authSession.user),
  };

  next();
}
