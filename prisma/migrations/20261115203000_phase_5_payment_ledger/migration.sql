CREATE TYPE "PaymentTransactionType" AS ENUM ('PAYMENT', 'REFUND');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "actorId" TEXT,
  "provider" "PaymentProvider" NOT NULL,
  "type" "PaymentTransactionType" NOT NULL DEFAULT 'PAYMENT',
  "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "providerReference" TEXT,
  "note" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentTransaction_tenantId_storeId_createdAt_idx" ON "PaymentTransaction"("tenantId", "storeId", "createdAt");
CREATE INDEX "PaymentTransaction_orderId_status_type_idx" ON "PaymentTransaction"("orderId", "status", "type");
CREATE INDEX "PaymentTransaction_providerReference_idx" ON "PaymentTransaction"("providerReference");
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
