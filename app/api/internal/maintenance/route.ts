import { isCronAuthorized } from "@/lib/cron-auth";
import { runPlatformMaintenance } from "@/lib/platform-operations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runPlatformMaintenance();
  return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
