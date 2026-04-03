import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.ts";
import { AppError } from "../lib/errors.ts";
import { requireAuth } from "../middleware/auth.ts";
import { executeCode } from "../services/code-execution.service.ts";

export const runCodeRouter = Router();

const RUN_CODE_RATE_LIMIT_WINDOW_MS = 60_000;
const RUN_CODE_RATE_LIMIT_MAX = 10;
const runCodeRateLimitMap = new Map<string, number[]>();

function enforceRunCodeRateLimit(userId: string) {
  const now = Date.now();
  const recentTimestamps = (runCodeRateLimitMap.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RUN_CODE_RATE_LIMIT_WINDOW_MS,
  );

  if (recentTimestamps.length >= RUN_CODE_RATE_LIMIT_MAX) {
    runCodeRateLimitMap.set(userId, recentTimestamps);
    throw new AppError("Too many code execution requests. Please wait a moment.", 429);
  }

  recentTimestamps.push(now);
  runCodeRateLimitMap.set(userId, recentTimestamps);
}

runCodeRouter.use(requireAuth);

runCodeRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    enforceRunCodeRateLimit(request.auth!.user.id);
    const result = await executeCode(request.body);
    response.json(result);
  }),
);
