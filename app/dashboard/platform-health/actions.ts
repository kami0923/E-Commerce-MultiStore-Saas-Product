"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/data/auth";
import { runPlatformMaintenance } from "@/lib/platform-operations";

export async function runPlatformMaintenanceAction() {
  await requirePlatformAdmin();
  await runPlatformMaintenance();
  revalidatePath("/dashboard/platform-health");
  redirect("/dashboard/platform-health?maintained=1" as never);
}
