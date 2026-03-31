import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export function getErrorResponse(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "PrismaClientInitializationError"
  ) {
    return {
      statusCode: 503,
      body: {
        error:
          "Database unavailable. Check DATABASE_URL and ensure PostgreSQL is running.",
      },
    };
  }

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message },
    };
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid request data";
    return {
      statusCode: 400,
      body: { error: message },
    };
  }

  console.error("Unhandled backend error:", error);

  return {
    statusCode: 500,
    body: { error: "Internal server error" },
  };
}
