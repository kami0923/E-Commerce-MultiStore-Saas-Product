import Database from "better-sqlite3";
import { resolve } from "node:path";

const database = new Database(resolve("prisma", "work", "meridian.db"));
try {
  const columns = database.prepare('PRAGMA table_info("Invitation")').all();
  if (!columns.some(column => column.name === "storeIds")) database.exec(`ALTER TABLE "Invitation" ADD COLUMN "storeIds" JSONB NOT NULL DEFAULT '[]';`);
  database.exec(`INSERT OR IGNORE INTO "_meridian_schema" ("version") VALUES ('team-invitation-store-scope');`);
  console.log("Applied store-scoped team invitation migration.");
} finally { database.close(); }
