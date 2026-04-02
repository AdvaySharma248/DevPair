import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { env } from "../config/env.ts";
import { AppError } from "./errors.ts";

function getFirebaseAdminApp() {
  if (
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_CLIENT_EMAIL ||
    !env.FIREBASE_PRIVATE_KEY
  ) {
    throw new AppError(
      "Firebase authentication is not configured on the server",
      500,
    );
  }

  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    return await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    throw new AppError("Invalid Firebase authentication token", 401);
  }
}
