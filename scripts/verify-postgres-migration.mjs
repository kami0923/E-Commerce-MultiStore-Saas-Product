import "dotenv/config";

import { createHash } from "node:crypto";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as PostgresClient } from "../generated/prisma/client.ts";
import { PrismaClient as SqliteClient } from "../generated/prisma-sqlite/client.ts";
import { databaseModels, excludedMigrationModels } from "./database-models.mjs";

const targetUrl = process.env.DATABASE_URL;

if (!targetUrl?.startsWith("postgres")) {
  throw new Error("DATABASE_URL must point to the target PostgreSQL database.");
}

const source = new SqliteClient({
  adapter: new PrismaBetterSqlite3({
    url: "file:./prisma/work/meridian.db",
  }),
});

const target = new PostgresClient({
  adapter: new PrismaPg({ connectionString: targetUrl }),
});

function normalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

function fingerprint(rows) {
  const canonicalRows = rows
    .map((row) => JSON.stringify(normalize(row)))
    .sort((left, right) => left.localeCompare(right));

  return createHash("sha256").update(canonicalRows.join("\n")).digest("hex");
}

let failed = false;

try {
  for (const model of databaseModels) {
    const [sourceRows, targetRows] = await Promise.all([
      source[model].findMany(),
      target[model].findMany(),
    ]);

    const countsMatch = sourceRows.length === targetRows.length;
    const dataMatches = fingerprint(sourceRows) === fingerprint(targetRows);
    const passed = countsMatch && dataMatches;

    console.log(
      `${passed ? "PASS" : "FAIL"} ${model}: ` +
        `${sourceRows.length} SQLite / ${targetRows.length} PostgreSQL`,
    );

    if (!passed) failed = true;
  }

  for (const model of excludedMigrationModels) {
    const [sourceCount, targetCount] = await Promise.all([
      source[model].count(),
      target[model].count(),
    ]);
    const passed = targetCount === 0;
    console.log(
      `${passed ? "PASS" : "FAIL"} ${model}: ` +
        `${sourceCount} intentionally excluded / ${targetCount} PostgreSQL`,
    );
    if (!passed) failed = true;
  }

  if (failed) {
    throw new Error("PostgreSQL verification failed. The application was not switched.");
  }

  console.log("All PostgreSQL row counts and content fingerprints match SQLite.");
} finally {
  await Promise.allSettled([source.$disconnect(), target.$disconnect()]);
}
