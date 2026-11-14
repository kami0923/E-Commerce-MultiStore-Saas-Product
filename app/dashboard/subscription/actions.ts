"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/data/auth";
import { formatStorage, getTenantSubscriptionCapacity } from "@/data/subscription-limits";
import { db } from "@/lib/db";
import { planCapacityConflicts } from "@/lib/subscription-policy";

export type SubscriptionActionState = { status: "idle" | "success" | "error"; message?: string };

export async function assignSubscriptionAction(_state: SubscriptionActionState, formData: FormData): Promise<SubscriptionActionState> {
  const actor = await requirePlatformAdmin();
  const parsed = z.object({ tenantId: z.string().min(1), planId: z.string().min(1) }).safeParse({ tenantId: formData.get("tenantId"), planId: formData.get("planId") });
  if (!parsed.success) return { status: "error", message: "Select a valid business and plan." };

  const [capacity, plan] = await Promise.all([
    getTenantSubscriptionCapacity(parsed.data.tenantId),
    db.subscriptionPlan.findFirst({ where: { id: parsed.data.planId, active: true } }),
  ]);
  if (!capacity || !plan) return { status: "error", message: "The business or plan is no longer available." };
  const expectedMarket = capacity.countryCode === "PK" ? "PK" : "INTL";
  if (plan.market !== expectedMarket) return { status: "error", message: "Choose a plan priced for this business market." };

  const fit = planCapacityConflicts(capacity.usage, plan);
  const conflicts = [
    fit.stores ? `${capacity.usage.stores} active stores` : null,
    fit.staff ? `${capacity.usage.staff} allocated team seats` : null,
    fit.products ? `${capacity.usage.products} products` : null,
    fit.media ? `${formatStorage(capacity.usage.mediaBytes)} of media` : null,
  ].filter(Boolean);
  if (conflicts.length > 0) return { status: "error", message: `This plan is too small for the current usage: ${conflicts.join(", ")}. Reduce usage or choose a larger plan.` };

  const start = new Date();
  const end = new Date(start); end.setDate(end.getDate() + 30);
  const previousPlan = capacity.subscription?.plan.name;
  const subscription = await db.tenantSubscription.upsert({
    where: { tenantId: parsed.data.tenantId },
    create: { id: randomUUID(), tenantId: parsed.data.tenantId, planId: plan.id, status: "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end },
    update: { planId: plan.id, status: "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end },
  });
  await db.auditLog.create({ data: { tenantId: parsed.data.tenantId, actorId: actor.id, action: "subscription.plan_assigned", entityType: "TenantSubscription", entityId: subscription.id, summary: `Assigned ${plan.name} monthly plan`, changes: { previousPlan, nextPlan: plan.name, currentPeriodEnd: end.toISOString() } } });
  revalidateSubscriptionPages();
  return { status: "success", message: `${capacity.name} is now on ${plan.name} through ${end.toLocaleDateString("en-PK")}.` };
}

export async function setSubscriptionStatusAction(_state: SubscriptionActionState, formData: FormData): Promise<SubscriptionActionState> {
  const actor = await requirePlatformAdmin();
  const parsed = z.object({ tenantId: z.string().min(1), status: z.enum(["ACTIVE", "PAST_DUE", "CANCELLED"]) }).safeParse({ tenantId: formData.get("tenantId"), status: formData.get("status") });
  if (!parsed.success) return { status: "error", message: "The requested subscription state is invalid." };
  const existing = await db.tenantSubscription.findUnique({ where: { tenantId: parsed.data.tenantId }, select: { id: true, status: true, tenant: { select: { name: true } } } });
  if (!existing) return { status: "error", message: "Assign a plan before changing subscription access." };
  const end = new Date(); end.setDate(end.getDate() + 30);
  await db.$transaction([
    db.tenantSubscription.update({ where: { id: existing.id }, data: parsed.data.status === "ACTIVE" ? { status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: end } : { status: parsed.data.status } }),
    db.auditLog.create({ data: { tenantId: parsed.data.tenantId, actorId: actor.id, action: "subscription.status_changed", entityType: "TenantSubscription", entityId: existing.id, summary: `Changed subscription from ${existing.status} to ${parsed.data.status}` } }),
  ]);
  revalidateSubscriptionPages();
  return { status: "success", message: `${existing.tenant.name} subscription is now ${parsed.data.status.replace("_", " ").toLowerCase()}.` };
}

export async function updateSubscriptionPlanAction(_state: SubscriptionActionState, formData: FormData): Promise<SubscriptionActionState> {
  const actor = await requirePlatformAdmin();
  const parsed = z.object({
    planId: z.string().min(1),
    monthlyPrice: z.coerce.number().min(0).max(1_000_000),
    storeLimit: z.coerce.number().int().min(1).max(1000),
    staffLimit: z.coerce.number().int().min(1).max(10000),
    productLimit: z.coerce.number().int().min(1).max(10_000_000),
    mediaStorageMb: z.coerce.number().int().min(50).max(1_000_000),
  }).safeParse({
    planId: formData.get("planId"), monthlyPrice: formData.get("monthlyPrice"), storeLimit: formData.get("storeLimit"),
    staffLimit: formData.get("staffLimit"), productLimit: formData.get("productLimit"), mediaStorageMb: formData.get("mediaStorageMb"),
  });
  if (!parsed.success) return { status: "error", message: "Enter valid pricing and positive limits for every allowance." };

  const subscribers = await db.tenantSubscription.findMany({ where: { planId: parsed.data.planId }, select: { tenantId: true } });
  const plan = await db.subscriptionPlan.update({ where: { id: parsed.data.planId }, data: { monthlyMinor: Math.round(parsed.data.monthlyPrice * 100), storeLimit: parsed.data.storeLimit, staffLimit: parsed.data.staffLimit, productLimit: parsed.data.productLimit, mediaStorageMb: parsed.data.mediaStorageMb } });
  if (subscribers.length > 0) {
    await db.auditLog.createMany({ data: subscribers.map(({ tenantId }) => ({ tenantId, actorId: actor.id, action: "subscription.plan_updated", entityType: "SubscriptionPlan", entityId: plan.id, summary: `Updated ${plan.name} pricing and allowances`, changes: parsed.data })) });
  }
  revalidateSubscriptionPages();
  return { status: "success", message: `${plan.name} pricing and allowances were updated.` };
}

function revalidateSubscriptionPages() {
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/commerce-setup");
  revalidatePath("/dashboard");
}
