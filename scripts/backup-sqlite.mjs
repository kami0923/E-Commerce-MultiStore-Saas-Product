import Database from "better-sqlite3";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("prisma", "work", "meridian.db");
const directory = resolve("backups");
await mkdir(directory, { recursive: true });
const stamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const target = resolve(directory, `meridian-${stamp}.db`);
const database = new Database(source, { readonly: true, fileMustExist: true });
try { await database.backup(target); console.log(`Backup created: ${target}`); } finally { database.close(); }
