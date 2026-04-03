CREATE TABLE "SessionDraft" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionDraft_sessionId_language_key" ON "SessionDraft"("sessionId", "language");
CREATE INDEX "SessionDraft_sessionId_idx" ON "SessionDraft"("sessionId");

ALTER TABLE "SessionDraft"
ADD CONSTRAINT "SessionDraft_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
