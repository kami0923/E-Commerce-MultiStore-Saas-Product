import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL_POOLED or DATABASE_URL must be configured.");
}

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };
const adapter = new PrismaPg({ connectionString: databaseUrl });

export const db = prismaGlobal.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.prisma = db;
}
