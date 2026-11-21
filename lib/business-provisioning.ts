import "server-only";

import { randomUUID } from "node:crypto";
import type { StoreVertical } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { generateInvitationToken } from "@/lib/invitations";
import { scheduleNotificationDispatch } from "@/lib/notification-jobs";

import { recommendedTheme } from "@/lib/storefront-themes";
function slugify(value: string) { const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 52) || "store"; return `${base}-${randomUUID().slice(0, 6)}`; }

export async function provisionBusiness(input: { actor: { id: string; name: string }; appUrl: string; name: string; ownerEmail: string; countryCode: "PK" | "INTL"; baseCurrency: "PKR" | "USD"; defaultLocale: "en" | "ur"; verticals: StoreVertical[]; applicationId?: string }) {
  const initialPlan = await db.subscriptionPlan.findFirst({ where: { market: input.countryCode === "PK" ? "PK" : "INTL", active: true, storeLimit: { gte: input.verticals.length } }, orderBy: { monthlyMinor: "asc" }, select: { id: true, name: true } });
  if (!initialPlan) throw new Error(`No active subscription supports ${input.verticals.length} stores in this market.`);
  const { token, tokenHash } = generateInvitationToken();
  const invitationUrl = `${input.appUrl.replace(/\/$/, "")}/invite/${token}`;
  const existingStoreCount = await db.store.count();
  const result = await db.$transaction(async tx => {
    if (input.applicationId) {
      const claim = await tx.merchantApplication.updateMany({ where: { id: input.applicationId, status: { in: ["PENDING", "UNDER_REVIEW"] }, approvedTenantId: null }, data: { status: "UNDER_REVIEW", reviewedById: input.actor.id } });
      if (claim.count !== 1) throw new Error("This application has already been reviewed.");
    }
    const tenant = await tx.tenant.create({ data: { name: input.name, slug: slugify(input.name), status: "TRIAL", countryCode: input.countryCode, baseCurrency: input.baseCurrency, defaultLocale: input.defaultLocale } });
    const stores = [];
    for (const [index, storeVertical] of input.verticals.entries()) stores.push(await tx.store.create({ data: { tenantId: tenant.id, name: input.verticals.length === 1 ? input.name : `${input.name} ${storeVertical.toLowerCase().replace("_", " ")}`, slug: slugify(`${input.name}-${storeVertical}`), vertical: storeVertical, currency: input.baseCurrency, defaultLocale: input.defaultLocale, enabledLocales: ["en", "ur"], status: "ACTIVE", themeKey: recommendedTheme(storeVertical, existingStoreCount + index) } }));
    for (const store of stores) {
      await tx.shippingProfile.create({ data: { tenantId: tenant.id, storeId: store.id, name: input.countryCode === "PK" ? "Pakistan standard" : "International standard", countryCode: input.countryCode === "PK" ? "PK" : "INTL", rateMinor: input.countryCode === "PK" ? 25000 : 1000, freeAboveMinor: input.countryCode === "PK" ? 500000 : 10000, estimatedDays: input.countryCode === "PK" ? "2–5 business days" : "5–10 business days" } });
      await tx.paymentConnection.create({ data: { tenantId: tenant.id, storeId: store.id, provider: "CASH_ON_DELIVERY", displayName: "Cash on delivery", status: "CONNECTED", enabled: true, testMode: false } });
    }
    const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 14);
    await tx.tenantSubscription.create({ data: { tenantId: tenant.id, planId: initialPlan.id, status: "TRIALING", currentPeriodEnd: trialEnd } });
    const invitation = await tx.invitation.create({ data: { tenantId: tenant.id, invitedById: input.actor.id, email: input.ownerEmail, role: "OWNER", tokenHash, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) } });
    await tx.notificationOutbox.create({ data: { tenantId: tenant.id, storeId: stores[0].id, channel: "EMAIL", recipient: input.ownerEmail, template: "owner_invitation", payload: { invitationUrl, role: "OWNER", expiresAt: invitation.expiresAt.toISOString(), inviterName: input.actor.name } } });
    await tx.auditLog.create({ data: { tenantId: tenant.id, actorId: input.actor.id, action: input.applicationId ? "merchant_application.approved" : "tenant.created", entityType: "Tenant", entityId: tenant.id, summary: `${input.applicationId ? "Approved and provisioned" : "Created"} ${input.name} with ${stores.length} store${stores.length === 1 ? "" : "s"}`, changes: input.applicationId ? { applicationId: input.applicationId } : undefined } });
    if (input.applicationId) await tx.merchantApplication.update({ where: { id: input.applicationId }, data: { status: "APPROVED", reviewedById: input.actor.id, reviewedAt: new Date(), approvedTenantId: tenant.id } });
    return { tenantId: tenant.id, storeCount: stores.length, planName: initialPlan.name };
  });
  scheduleNotificationDispatch();
  return { ...result, invitationUrl };
}
