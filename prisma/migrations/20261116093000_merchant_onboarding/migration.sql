CREATE TYPE "MerchantApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "MerchantApplication" (
  "id" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  "phone" TEXT,
  "companyWebsite" TEXT,
  "description" TEXT,
  "countryCode" TEXT NOT NULL DEFAULT 'PK',
  "baseCurrency" TEXT NOT NULL DEFAULT 'PKR',
  "defaultLocale" TEXT NOT NULL DEFAULT 'en',
  "verticals" JSONB NOT NULL,
  "status" "MerchantApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "trackingTokenHash" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "reviewNotes" TEXT,
  "reviewedById" TEXT,
  "approvedTenantId" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MerchantApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantApplication_trackingTokenHash_key" ON "MerchantApplication"("trackingTokenHash");
CREATE UNIQUE INDEX "MerchantApplication_approvedTenantId_key" ON "MerchantApplication"("approvedTenantId");
CREATE INDEX "MerchantApplication_status_submittedAt_idx" ON "MerchantApplication"("status", "submittedAt");
CREATE INDEX "MerchantApplication_ownerEmail_status_idx" ON "MerchantApplication"("ownerEmail", "status");
CREATE INDEX "MerchantApplication_ipAddress_createdAt_idx" ON "MerchantApplication"("ipAddress", "createdAt");
ALTER TABLE "MerchantApplication" ADD CONSTRAINT "MerchantApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantApplication" ADD CONSTRAINT "MerchantApplication_approvedTenantId_fkey" FOREIGN KEY ("approvedTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
