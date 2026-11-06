import Database from "better-sqlite3";
import { resolve } from "node:path";

const database = new Database(resolve("prisma", "work", "meridian.db"));
database.pragma("foreign_keys = ON");

try {
  database.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS "WhatsAppConnection" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "storeId" TEXT NOT NULL,
      "businessId" TEXT,
      "wabaId" TEXT,
      "phoneNumberId" TEXT,
      "displayPhoneNumber" TEXT,
      "verifiedName" TEXT,
      "qualityRating" TEXT,
      "tokenCiphertext" TEXT,
      "tokenIv" TEXT,
      "tokenTag" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "lastError" TEXT,
      "connectedAt" DATETIME,
      "lastVerifiedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "WhatsAppConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "WhatsAppConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppConnection_storeId_key" ON "WhatsAppConnection"("storeId");
    CREATE INDEX IF NOT EXISTS "WhatsAppConnection_tenantId_status_idx" ON "WhatsAppConnection"("tenantId", "status");
    INSERT OR IGNORE INTO "_meridian_schema" ("version") VALUES ('whatsapp-linking-v1');
    COMMIT;
  `);
  console.log("Applied merchant WhatsApp account linking migration.");
} catch (error) {
  if (database.inTransaction) database.exec("ROLLBACK;");
  throw error;
} finally {
  database.close();
}
