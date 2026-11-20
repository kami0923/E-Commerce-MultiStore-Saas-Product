import { createHash, randomBytes } from "node:crypto";

export function createApplicationTrackingToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: applicationTokenHash(token) };
}

export function applicationTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function applicationReference(id: string) {
  return `MER-${id.slice(-8).toUpperCase()}`;
}
