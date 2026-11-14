-- Phase 2: commercially enforceable product and media allowances.
-- Defaults preserve every existing subscription plan during deployment.
ALTER TABLE "SubscriptionPlan"
  ADD COLUMN "productLimit" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "mediaStorageMb" INTEGER NOT NULL DEFAULT 250;

UPDATE "SubscriptionPlan"
SET "productLimit" = 1000,
    "mediaStorageMb" = 2048
WHERE "code" IN ('PK-GROWTH', 'INTL-GROWTH');
