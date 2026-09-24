CREATE TABLE "AIActivityLog" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'EXECUTED',
  "summary" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIActivityLog_storeId_createdAt_idx" ON "AIActivityLog"("storeId","createdAt");
CREATE INDEX "AIActivityLog_userId_createdAt_idx" ON "AIActivityLog"("userId","createdAt");
CREATE INDEX "AIActivityLog_status_idx" ON "AIActivityLog"("status");
ALTER TABLE "AIActivityLog" ADD CONSTRAINT "AIActivityLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIActivityLog" ADD CONSTRAINT "AIActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
