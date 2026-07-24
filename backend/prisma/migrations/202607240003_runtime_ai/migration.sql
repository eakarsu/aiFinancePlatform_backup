CREATE TABLE IF NOT EXISTS "runtime_ai_results" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "providerReceipt" JSONB NOT NULL,
  "result" TEXT NOT NULL,
  "usage" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "runtime_ai_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "runtime_ai_results_userId_createdAt_idx"
  ON "runtime_ai_results"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "runtime_ai_results"
    ADD CONSTRAINT "runtime_ai_results_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
