import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.ts";
import { requireAuth } from "../middleware/auth.ts";
import { updateCurrentUser } from "../services/auth.service.ts";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.patch(
  "/me",
  asyncHandler(async (request, response) => {
    const user = await updateCurrentUser(request.auth!.user.id, request.body);
    response.json({ user });
  }),
);
