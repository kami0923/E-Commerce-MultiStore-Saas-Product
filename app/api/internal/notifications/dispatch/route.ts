import { timingSafeEqual } from "node:crypto";
import { dispatchPendingNotifications } from "@/lib/notification-dispatcher";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await dispatchPendingNotifications();
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
