"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";

const storeIdentity = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1) });
const provider = z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "PAYFAST", "EASYPAISA", "JAZZCASH", "STRIPE"]);

export async function createShippingProfileAction(formData: FormData) {
  const parsed = storeIdentity.extend({ name: z.string().trim().min(2).max(60), countryCode: z.string().trim().min(2).max(8).transform(value => value.toUpperCase()), city: z.string().trim().max(80).optional(), rate: z.coerce.number().min(0).max(1000000), freeAbove: z.union([z.literal(""), z.coerce.number().positive().max(10000000)]), estimatedDays: z.string().trim().min(2).max(40) }).parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), name: formData.get("name"), countryCode: formData.get("countryCode"), city: formData.get("city") || undefined, rate: formData.get("rate"), freeAbove: formData.get("freeAbove") || "", estimatedDays: formData.get("estimatedDays") });
  const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
  const store = await db.store.findFirst({ where: { id: parsed.storeId, tenantId: parsed.tenantId }, select: { id: true, name: true, currency: true, slug: true } });
  if (!store) throw new Error("Store not found.");
  await db.$transaction(async tx => {
    const profile = await tx.shippingProfile.create({ data: { id: randomUUID(), tenantId: parsed.tenantId, storeId: parsed.storeId, name: parsed.name, countryCode: parsed.countryCode, city: parsed.city || null, rateMinor: Math.round(parsed.rate * 100), freeAboveMinor: parsed.freeAbove === "" ? null : Math.round(parsed.freeAbove * 100), estimatedDays: parsed.estimatedDays } });
    await tx.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "shipping.profile_created", entityType: "ShippingProfile", entityId: profile.id, summary: `Added ${profile.name} delivery to ${store.name}` } });
  });
  revalidatePath("/dashboard/commerce-setup"); revalidatePath(`/store/${store.slug}/checkout`);
}

export async function setShippingProfileStateAction(formData: FormData) {
  const parsed = storeIdentity.extend({ profileId: z.string().min(1), enabled: z.enum(["true", "false"]) }).parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), profileId: formData.get("profileId"), enabled: formData.get("enabled") });
  const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
  const profile = await db.shippingProfile.findFirst({ where: { id: parsed.profileId, tenantId: parsed.tenantId, storeId: parsed.storeId }, select: { id: true, name: true, store: { select: { slug: true } } } });
  if (!profile) throw new Error("Delivery profile not found.");
  const enabled = parsed.enabled === "true";
  await db.$transaction([db.shippingProfile.update({ where: { id: profile.id }, data: { enabled } }), db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: enabled ? "shipping.profile_enabled" : "shipping.profile_disabled", entityType: "ShippingProfile", entityId: profile.id, summary: `${enabled ? "Enabled" : "Disabled"} ${profile.name} delivery` } })]);
  revalidatePath("/dashboard/commerce-setup"); revalidatePath(`/store/${profile.store.slug}/checkout`);
}

export async function connectPaymentProviderAction(formData: FormData) {
  const parsed = storeIdentity.extend({ provider, displayName: z.string().trim().min(2).max(60), accountReference: z.string().trim().max(120).optional(), testMode: z.enum(["true", "false"]) }).parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), provider: formData.get("provider"), displayName: formData.get("displayName"), accountReference: formData.get("accountReference") || undefined, testMode: formData.get("testMode") || "true" });
  const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
  const isOffline = ["CASH_ON_DELIVERY", "BANK_TRANSFER"].includes(parsed.provider);
  const status = isOffline ? "CONNECTED" : parsed.accountReference ? "PENDING" : "NOT_CONNECTED";
  const connection = await db.paymentConnection.upsert({ where: { storeId_provider: { storeId: parsed.storeId, provider: parsed.provider } }, create: { id: randomUUID(), tenantId: parsed.tenantId, storeId: parsed.storeId, provider: parsed.provider, displayName: parsed.displayName, accountReference: parsed.accountReference, testMode: parsed.testMode === "true", status, enabled: isOffline }, update: { displayName: parsed.displayName, accountReference: parsed.accountReference, testMode: parsed.testMode === "true", status, enabled: isOffline } });
  await db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "payment.connection_updated", entityType: "PaymentConnection", entityId: connection.id, summary: `${parsed.displayName} payment setup ${status.toLowerCase().replaceAll("_", " ")}` } });
  revalidatePath("/dashboard/commerce-setup");
}
