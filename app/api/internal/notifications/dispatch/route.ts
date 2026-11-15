import { isCronAuthorized } from "@/lib/cron-auth";
import { dispatchPendingNotifications } from "@/lib/notification-dispatcher";

export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await dispatchPendingNotifications();
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
