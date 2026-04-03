import type { DevPairServer } from "./types.ts";
import { ensureSocketJoinedSession } from "./session-room.ts";
import { upsertSessionDraftForUser } from "../services/session.service.ts";
import {
  parseCodeChangeEventPayload,
  parseExecutionResultEventPayload,
} from "./validation.ts";

export function registerEditorHandlers(io: DevPairServer) {
  io.on("connection", (socket) => {
    socket.on("code-change", async (payload) => {
      try {
        const data = parseCodeChangeEventPayload(payload);
        const joinedSession = await ensureSocketJoinedSession(socket, data.sessionId, false);
        await upsertSessionDraftForUser(
          data.sessionId,
          socket.data.user,
          data.language,
          data.code,
        );

        socket.to(joinedSession.room).emit("code-update", {
          code: data.code,
          language: data.language,
        });
        console.log("Code update sent", data.sessionId, data.language);
      } catch {
        // Ignore code sync errors to keep the editor responsive.
      }
    });

    socket.on("execution-result", async (payload) => {
      try {
        const data = parseExecutionResultEventPayload(payload);
        const joinedSession = await ensureSocketJoinedSession(socket, data.sessionId, false);

        socket.to(joinedSession.room).emit("execution-result", {
          sessionId: data.sessionId,
          result: data.result,
        });
        console.log("Execution result sent", data.sessionId, data.result.status);
      } catch {
        // Ignore execution sync errors to keep the runner responsive.
      }
    });
  });
}
