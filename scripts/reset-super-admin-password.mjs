import Database from "better-sqlite3";
import { hashPassword } from "better-auth/crypto";
import { resolve } from "node:path";

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive PowerShell or Command Prompt window.");
  }
  return new Promise((resolveInput, reject) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };
    const onData = character => {
      if (character === "\u0003") {
        finish();
        reject(new Error("Password reset cancelled."));
        return;
      }
      if (character === "\r" || character === "\n") {
        finish();
        resolveInput(value);
        return;
      }
      if (character === "\u0008" || character === "\u007f") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      if (character >= " ") {
        value += character;
        process.stdout.write("*");
      }
    };
    process.stdin.on("data", onData);
  });
}

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) throw new Error("Provide the Super Admin email after the command.");

const database = new Database(resolve("prisma", "work", "meridian.db"));
database.pragma("foreign_keys = ON");

try {
  const user = database.prepare("SELECT id, email, platformRole FROM user WHERE lower(email) = ?").get(email);
  if (!user || user.platformRole !== "SUPER_ADMIN") throw new Error("No Super Admin account was found for that email.");

  const password = await readSecret("New password (12–128 characters): ");
  const confirmation = await readSecret("Confirm new password: ");
  if (password.length < 12 || password.length > 128) throw new Error("Password must contain between 12 and 128 characters.");
  if (password !== confirmation) throw new Error("The two passwords did not match.");

  const passwordHash = await hashPassword(password);
  const account = database.prepare("SELECT id FROM account WHERE userId = ? AND providerId = 'credential'").get(user.id);
  if (!account) throw new Error("The Super Admin credential account is missing.");

  const update = database.transaction(() => {
    database.prepare("UPDATE account SET password = ?, updatedAt = ? WHERE id = ?").run(passwordHash, new Date().toISOString(), account.id);
    database.prepare("DELETE FROM session WHERE userId = ?").run(user.id);
  });
  update();
  console.log(`Password reset completed for ${user.email}. Existing sessions were signed out.`);
} finally {
  database.close();
}
