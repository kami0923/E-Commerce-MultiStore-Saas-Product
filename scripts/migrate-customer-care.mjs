import Database from "better-sqlite3";
import { resolve } from "node:path";

const database = new Database(resolve("prisma", "work", "meridian.db"));
database.pragma("foreign_keys = ON");
const columns = database.prepare(`PRAGMA table_info("Order")`).all();
try {
  database.exec("BEGIN;");
  if (!columns.some(column => column.name === "customerId")) database.exec(`ALTER TABLE "Order" ADD COLUMN "customerId" TEXT`);
  if (!columns.some(column => column.name === "promotionCode")) database.exec(`ALTER TABLE "Order" ADD COLUMN "promotionCode" TEXT`);
  database.exec(`
    CREATE TABLE IF NOT EXISTS "Customer" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"storeId" TEXT NOT NULL,"email" TEXT NOT NULL,"name" TEXT,"phone" TEXT,"orderCount" INTEGER NOT NULL DEFAULT 0,"totalSpentMinor" INTEGER NOT NULL DEFAULT 0,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE);
    CREATE UNIQUE INDEX IF NOT EXISTS "Customer_storeId_email_key" ON "Customer"("storeId","email");
    CREATE INDEX IF NOT EXISTS "Customer_tenantId_storeId_updatedAt_idx" ON "Customer"("tenantId","storeId","updatedAt");
    CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");
    CREATE TABLE IF NOT EXISTS "Promotion" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"storeId" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"discountType" TEXT NOT NULL,"value" INTEGER NOT NULL,"minSubtotalMinor" INTEGER,"maxUses" INTEGER,"usedCount" INTEGER NOT NULL DEFAULT 0,"startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"endsAt" DATETIME,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Promotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "Promotion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE);
    CREATE UNIQUE INDEX IF NOT EXISTS "Promotion_storeId_code_key" ON "Promotion"("storeId","code");
    CREATE INDEX IF NOT EXISTS "Promotion_tenantId_storeId_active_idx" ON "Promotion"("tenantId","storeId","active");
    CREATE TABLE IF NOT EXISTS "TaxRule" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"storeId" TEXT NOT NULL,"name" TEXT NOT NULL,"countryCode" TEXT NOT NULL,"rateBps" INTEGER NOT NULL,"included" BOOLEAN NOT NULL DEFAULT false,"enabled" BOOLEAN NOT NULL DEFAULT true,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "TaxRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "TaxRule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE);
    CREATE UNIQUE INDEX IF NOT EXISTS "TaxRule_storeId_name_key" ON "TaxRule"("storeId","name");
    CREATE INDEX IF NOT EXISTS "TaxRule_tenantId_storeId_enabled_idx" ON "TaxRule"("tenantId","storeId","enabled");
    CREATE TABLE IF NOT EXISTS "ReturnRequest" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"storeId" TEXT NOT NULL,"orderId" TEXT NOT NULL,"customerEmail" TEXT NOT NULL,"reason" TEXT NOT NULL,"note" TEXT,"status" TEXT NOT NULL DEFAULT 'REQUESTED',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "ReturnRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "ReturnRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE);
    CREATE UNIQUE INDEX IF NOT EXISTS "ReturnRequest_orderId_customerEmail_key" ON "ReturnRequest"("orderId","customerEmail");
    CREATE INDEX IF NOT EXISTS "ReturnRequest_tenantId_storeId_status_idx" ON "ReturnRequest"("tenantId","storeId","status");
    CREATE TABLE IF NOT EXISTS "NotificationOutbox" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"storeId" TEXT NOT NULL,"orderId" TEXT,"channel" TEXT NOT NULL,"recipient" TEXT NOT NULL,"template" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'PENDING',"payload" JSONB NOT NULL,"lastError" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"sentAt" DATETIME,CONSTRAINT "NotificationOutbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "NotificationOutbox_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "NotificationOutbox_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE);
    CREATE INDEX IF NOT EXISTS "NotificationOutbox_tenantId_storeId_status_createdAt_idx" ON "NotificationOutbox"("tenantId","storeId","status","createdAt");
    INSERT OR IGNORE INTO "_meridian_schema" ("version") VALUES ('customer-care-v1');
    COMMIT;
  `);
  console.log("Applied customer profiles, promotions, tax, returns and notification outbox migration.");
} catch (error) { if (database.inTransaction) database.exec("ROLLBACK;"); throw error; } finally { database.close(); }
