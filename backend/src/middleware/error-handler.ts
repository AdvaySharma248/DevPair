import type { NextFunction, Request, Response } from "express";
import { getErrorResponse } from "../lib/errors.ts";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const { statusCode, body } = getErrorResponse(error);
  response.status(statusCode).json(body);
}
