import { copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const currentEnvPath = resolve(projectRoot, ".env");
const postgresEnvPath = resolve(projectRoot, ".env.postgres");
const stamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const backupPath = resolve(projectRoot, "backups", `.env.before-postgres-${stamp}`);

const [currentEnv, postgresEnv] = await Promise.all([
  readFile(currentEnvPath, "utf8"),
  readFile(postgresEnvPath, "utf8"),
]);

const postgresDatabaseLine = postgresEnv
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATABASE_URL="));

if (!postgresDatabaseLine) {
  throw new Error(".env.postgres does not contain DATABASE_URL.");
}

const nextEnv = currentEnv.replace(/^DATABASE_URL=.*$/m, postgresDatabaseLine);
if (nextEnv === currentEnv) {
  throw new Error("The current .env DATABASE_URL could not be replaced.");
}

const temporaryPath = `${currentEnvPath}.next`;
await copyFile(currentEnvPath, backupPath);
await writeFile(temporaryPath, nextEnv, { encoding: "utf8", mode: 0o600 });
await rename(temporaryPath, currentEnvPath);

console.log(`PostgreSQL activated. Previous environment saved at ${backupPath}`);
