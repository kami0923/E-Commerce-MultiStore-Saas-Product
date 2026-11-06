import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(projectRoot, "prisma", "work", "meridian.db");
const prismaCli = resolve(projectRoot, "node_modules", "prisma", "build", "index.js");

mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("foreign_keys = ON");

const existingTable = database
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user'")
  .get();

if (existingTable) {
  console.log(`Database is already initialized at ${databasePath}`);
  database.close();
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
  {
    cwd: projectRoot,
    env: process.env,
    encoding: "utf8",
  },
);

if (result.status !== 0) {
  database.close();
  throw new Error(result.stderr || result.stdout || "Unable to generate the SQLite schema.");
}

const schemaStart = result.stdout.indexOf("-- CreateTable");
if (schemaStart === -1) {
  database.close();
  throw new Error("Prisma did not return a database schema.");
}

const schemaSql = result.stdout.slice(schemaStart);

try {
  database.exec("BEGIN;\n" + schemaSql + "\nCOMMIT;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS "_meridian_schema" (
      "version" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO "_meridian_schema" ("version") VALUES ('initial-auth-tenancy');
  `);
  console.log(`Initialized Meridian's local database at ${databasePath}`);
} catch (error) {
  if (database.inTransaction) database.exec("ROLLBACK;");
  throw error;
} finally {
  database.close();
}
