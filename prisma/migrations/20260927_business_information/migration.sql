ALTER TABLE "Store"
  ADD COLUMN "businessName" TEXT,
  ADD COLUMN "businessType" TEXT,
  ADD COLUMN "businessDescription" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "rut" TEXT,
  ADD COLUMN "country" TEXT DEFAULT 'Chile',
  ADD COLUMN "region" TEXT,
  ADD COLUMN "commune" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "businessInfoCompletedAt" TIMESTAMP(3);
