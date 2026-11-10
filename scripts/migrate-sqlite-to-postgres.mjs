import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as PostgresClient } from "../generated/prisma/client.ts";
import { PrismaClient as SqliteClient } from "../generated/prisma-sqlite/client.ts";
import { databaseModels } from "./database-models.mjs";

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

try {
  const occupiedModels = [];

  for (const model of databaseModels) {
    const count = await target[model].count();
    if (count > 0) occupiedModels.push(`${model} (${count})`);
  }

  if (occupiedModels.length > 0) {
    throw new Error(
      `The PostgreSQL target is not empty: ${occupiedModels.join(", ")}. ` +
        "Migration stopped without changing it.",
    );
  }

  const sourceRows = new Map();
  for (const model of databaseModels) {
    sourceRows.set(model, await source[model].findMany());
  }

  await target.$transaction(
    async (transaction) => {
      for (const model of databaseModels) {
        const rows = sourceRows.get(model);
        if (rows.length > 0) {
          await transaction[model].createMany({ data: rows });
        }
      }
    },
    { timeout: 120_000 },
  );

  console.log("SQLite to PostgreSQL migration completed.");
  for (const model of databaseModels) {
    console.log(`${model}: ${sourceRows.get(model).length}`);
  }
} finally {
  await Promise.allSettled([source.$disconnect(), target.$disconnect()]);
}
