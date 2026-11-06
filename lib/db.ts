import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const db = prismaGlobal.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.prisma = db;
}
