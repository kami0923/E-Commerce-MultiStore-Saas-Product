"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";

const schema = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1), defaultLocale: z.enum(["en", "ur"]), enabledLocales: z.array(z.enum(["en", "ur"])), themeKey: z.enum(["atelier", "market", "luxe"]).optional(), customDomain: z.string().trim().max(253).optional() });

export async function updateStoreSettingsAction(formData: FormData) {
  const result = schema.safeParse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), defaultLocale: formData.get("defaultLocale"), enabledLocales: formData.getAll("enabledLocale"), themeKey: formData.get("themeKey") || undefined, customDomain: formData.get("customDomain") });
  if (!result.success) redirect("/dashboard/settings?error=invalid");
  const parsed = result.data;
  const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
  const store = await db.store.findFirst({ where: { id: parsed.storeId, tenantId: parsed.tenantId }, select: { id: true, name: true, slug: true, themeKey: true } });
  if (!store) throw new Error("Store not found.");
  const enabledLocales = parsed.enabledLocales.length > 0 ? [...new Set(parsed.enabledLocales)] : [parsed.defaultLocale];
  if (!enabledLocales.includes(parsed.defaultLocale)) enabledLocales.push(parsed.defaultLocale);
  const customDomain = parsed.customDomain?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") || null;
  if (customDomain && !/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(customDomain)) redirect("/dashboard/settings?error=domain");
  const themeKey = scope.platformAccess && parsed.themeKey ? parsed.themeKey : store.themeKey;
  try {
    await db.$transaction(async tx => {
      await tx.store.update({ where: { id: store.id }, data: { defaultLocale: parsed.defaultLocale, enabledLocales, customDomain, themeKey } });
      await tx.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: store.id, actorId: scope.user.id, action: "store.settings_updated", entityType: "Store", entityId: store.id, summary: `Updated storefront settings for ${store.name}`, changes: { defaultLocale: parsed.defaultLocale, enabledLocales, customDomain, themeKey } } });
    });
  } catch {
    redirect("/dashboard/settings?error=save");
  }
  revalidatePath("/dashboard/settings");
  revalidatePath(`/store/${store.slug}`);
  redirect("/dashboard/settings?saved=1");
}
