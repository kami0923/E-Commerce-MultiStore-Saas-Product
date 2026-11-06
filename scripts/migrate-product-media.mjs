import Database from "better-sqlite3";
import { resolve } from "node:path";

const database = new Database(resolve("prisma", "work", "meridian.db"));
database.pragma("foreign_keys = ON");

try {
  database.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS "MediaAsset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "storeId" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "originalName" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "sizeBytes" INTEGER NOT NULL,
      "url" TEXT NOT NULL,
      "altText" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MediaAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MediaAsset_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_tenantId_storeId_filename_key" ON "MediaAsset"("tenantId", "storeId", "filename");
    CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_storeId_createdAt_idx" ON "MediaAsset"("tenantId", "storeId", "createdAt");

    CREATE TABLE IF NOT EXISTS "ProductMedia" (
      "productId" TEXT NOT NULL,
      "mediaAssetId" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isPrimary" BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY ("productId", "mediaAssetId"),
      CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ProductMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "ProductMedia_productId_sortOrder_idx" ON "ProductMedia"("productId", "sortOrder");

    INSERT OR IGNORE INTO "_meridian_schema" ("version") VALUES ('product-media-library');
    COMMIT;
  `);
  console.log("Applied product media library migration without modifying existing records.");
} catch (error) {
  if (database.inTransaction) database.exec("ROLLBACK;");
  throw error;
} finally {
  database.close();
}
