import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const database = new Database(resolve("prisma", "work", "meridian.db"));
database.pragma("foreign_keys = ON");
try {
  database.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS "ShippingProfile" (
      "id" TEXT NOT NULL PRIMARY KEY, "tenantId" TEXT NOT NULL, "storeId" TEXT NOT NULL,
      "name" TEXT NOT NULL, "countryCode" TEXT NOT NULL, "city" TEXT, "rateMinor" INTEGER NOT NULL,
      "freeAboveMinor" INTEGER, "estimatedDays" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "ShippingProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ShippingProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "ShippingProfile_storeId_name_key" ON "ShippingProfile"("storeId", "name");
    CREATE INDEX IF NOT EXISTS "ShippingProfile_tenantId_storeId_enabled_idx" ON "ShippingProfile"("tenantId", "storeId", "enabled");
    CREATE TABLE IF NOT EXISTS "PaymentConnection" (
      "id" TEXT NOT NULL PRIMARY KEY, "tenantId" TEXT NOT NULL, "storeId" TEXT NOT NULL,
      "provider" TEXT NOT NULL, "displayName" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
      "accountReference" TEXT, "enabled" BOOLEAN NOT NULL DEFAULT false, "testMode" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "PaymentConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PaymentConnection_storeId_provider_key" ON "PaymentConnection"("storeId", "provider");
    CREATE INDEX IF NOT EXISTS "PaymentConnection_tenantId_storeId_enabled_idx" ON "PaymentConnection"("tenantId", "storeId", "enabled");
    CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
      "id" TEXT NOT NULL PRIMARY KEY, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "market" TEXT NOT NULL,
      "currency" TEXT NOT NULL, "monthlyMinor" INTEGER NOT NULL, "storeLimit" INTEGER NOT NULL, "staffLimit" INTEGER NOT NULL,
      "features" JSONB NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");
    CREATE TABLE IF NOT EXISTS "TenantSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY, "tenantId" TEXT NOT NULL, "planId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'TRIALING', "currentPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "currentPeriodEnd" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "TenantSubscription_tenantId_key" ON "TenantSubscription"("tenantId");
    CREATE INDEX IF NOT EXISTS "TenantSubscription_status_currentPeriodEnd_idx" ON "TenantSubscription"("status", "currentPeriodEnd");
    INSERT OR IGNORE INTO "SubscriptionPlan" ("id","code","name","market","currency","monthlyMinor","storeLimit","staffLimit","features","updatedAt") VALUES
      ('plan_pk_launch','PK-LAUNCH','Launch','PK','PKR',499900,1,3,'["Storefront","Orders","Inventory","Analytics"]',CURRENT_TIMESTAMP),
      ('plan_pk_growth','PK-GROWTH','Growth','PK','PKR',999900,3,10,'["3 stores","Team roles","Advanced analytics","Custom domain"]',CURRENT_TIMESTAMP),
      ('plan_intl_launch','INTL-LAUNCH','Launch International','INTL','USD',2900,1,3,'["Storefront","Orders","Inventory","Analytics"]',CURRENT_TIMESTAMP),
      ('plan_intl_growth','INTL-GROWTH','Growth International','INTL','USD',7900,5,15,'["5 stores","Team roles","Advanced analytics","Custom domain"]',CURRENT_TIMESTAMP);
    INSERT OR IGNORE INTO "_meridian_schema" ("version") VALUES ('commerce-setup-v1');
    COMMIT;
  `);
  const stores = database.prepare(`SELECT s.id, s.tenantId, s.currency, t.countryCode FROM Store s JOIN Tenant t ON t.id = s.tenantId`).all();
  const hasShipping = database.prepare(`SELECT 1 FROM ShippingProfile WHERE storeId = ? LIMIT 1`);
  const addShipping = database.prepare(`INSERT INTO ShippingProfile (id,tenantId,storeId,name,countryCode,rateMinor,freeAboveMinor,estimatedDays,enabled,updatedAt) VALUES (?,?,?,?,?,?,?,?,true,CURRENT_TIMESTAMP)`);
  const hasPayment = database.prepare(`SELECT 1 FROM PaymentConnection WHERE storeId = ? LIMIT 1`);
  const addPayment = database.prepare(`INSERT INTO PaymentConnection (id,tenantId,storeId,provider,displayName,status,enabled,testMode,updatedAt) VALUES (?,?,?,'CASH_ON_DELIVERY','Cash on delivery','CONNECTED',true,false,CURRENT_TIMESTAMP)`);
  const backfill = database.transaction(() => { for (const store of stores) { const pakistan = store.countryCode === "PK"; if (!hasShipping.get(store.id)) addShipping.run(randomUUID(), store.tenantId, store.id, pakistan ? "Pakistan standard" : "International standard", pakistan ? "PK" : "INTL", pakistan ? 25000 : 1000, pakistan ? 500000 : 10000, pakistan ? "2–5 business days" : "5–10 business days"); if (!hasPayment.get(store.id)) addPayment.run(randomUUID(), store.tenantId, store.id); } });
  backfill();
  const tenants = database.prepare(`SELECT id, countryCode FROM Tenant`).all();
  const hasSubscription = database.prepare(`SELECT 1 FROM TenantSubscription WHERE tenantId = ? LIMIT 1`);
  const planByCode = database.prepare(`SELECT id FROM SubscriptionPlan WHERE code = ?`);
  const addSubscription = database.prepare(`INSERT INTO TenantSubscription (id,tenantId,planId,status,currentPeriodEnd,updatedAt) VALUES (?,?,?,'TRIALING',datetime('now','+14 days'),CURRENT_TIMESTAMP)`);
  const backfillSubscriptions = database.transaction(() => { for (const tenant of tenants) { if (hasSubscription.get(tenant.id)) continue; const plan = planByCode.get(tenant.countryCode === "PK" ? "PK-LAUNCH" : "INTL-LAUNCH"); if (plan) addSubscription.run(randomUUID(), tenant.id, plan.id); } });
  backfillSubscriptions();
  console.log("Applied shipping, payment connection and subscription foundation migration.");
} catch (error) {
  if (database.inTransaction) database.exec("ROLLBACK;");
  throw error;
} finally { database.close(); }
