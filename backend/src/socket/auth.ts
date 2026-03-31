import { env } from "../config/env.ts";
import { AppError } from "../lib/errors.ts";
import { parseCookieHeader } from "../lib/security.ts";
import { serializeUser } from "../lib/serializers.ts";
import { getAuthSessionByToken } from "../services/auth.service.ts";
import type { DevPairSocket } from "./types.ts";

export async function attachAuthenticatedUser(socket: DevPairSocket) {
  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  const token = cookies[env.SESSION_COOKIE_NAME];
  const authSession = await getAuthSessionByToken(token);

  if (!authSession) {
    throw new AppError("Authentication required", 401);
  }

  socket.data.user = serializeUser(authSession.user);
  socket.data.joinedSessionIds = new Set<string>();
  socket.data.readySessionIds = new Set<string>();
}

export function toSocketError(error: unknown) {
  if (error instanceof AppError) {
    return new Error(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Socket connection failed");
}
