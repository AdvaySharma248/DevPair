import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.ts";
import { simulateCodeExecution } from "../services/code-execution.service.ts";

export const runCodeRouter = Router();

runCodeRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const result = simulateCodeExecution(request.body);
    response.json(result);
  }),
);
