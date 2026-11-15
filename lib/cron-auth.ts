import { timingSafeEqual } from "node:crypto";

export function isCronAuthorized(request: Request, expected = process.env.CRON_SECRET) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
