"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";

const identity = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1) });

export async function createPromotionAction(formData: FormData) {
  const [tenantId, storeId] = String(formData.get("storeKey") || "").split(":");
  const parsed = identity.extend({ code: z.string().trim().min(2).max(30).transform(value => value.toUpperCase().replace(/\s+/g, "")), name: z.string().trim().min(2).max(80), discountType: z.enum(["PERCENT", "FIXED"]), value: z.coerce.number().positive().max(1000000), minSubtotal: z.union([z.literal(""), z.coerce.number().min(0)]), maxUses: z.union([z.literal(""), z.coerce.number().int().positive()]) }).parse({ tenantId, storeId, code: formData.get("code"), name: formData.get("name"), discountType: formData.get("discountType"), value: formData.get("value"), minSubtotal: formData.get("minSubtotal") || "", maxUses: formData.get("maxUses") || "" });
  const scope = await requireTenantPermission(parsed.tenantId, "orders.manage", parsed.storeId);
  if (parsed.discountType === "PERCENT" && parsed.value > 100) throw new Error("Percentage discounts cannot exceed 100%.");
  const promotion = await db.promotion.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, code: parsed.code, name: parsed.name, discountType: parsed.discountType, value: parsed.discountType === "FIXED" ? Math.round(parsed.value * 100) : Math.round(parsed.value), minSubtotalMinor: parsed.minSubtotal === "" ? null : Math.round(parsed.minSubtotal * 100), maxUses: parsed.maxUses === "" ? null : parsed.maxUses } });
  await db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "promotion.created", entityType: "Promotion", entityId: promotion.id, summary: `Created promotion ${promotion.code}` } });
  revalidatePath("/dashboard/customer-care");
}

export async function createTaxRuleAction(formData: FormData) {
  const [tenantId, storeId] = String(formData.get("storeKey") || "").split(":");
  const parsed = identity.extend({ name: z.string().trim().min(2).max(80), countryCode: z.string().trim().min(2).max(8).transform(value => value.toUpperCase()), rate: z.coerce.number().min(0).max(100), included: z.enum(["true", "false"]) }).parse({ tenantId, storeId, name: formData.get("name"), countryCode: formData.get("countryCode"), rate: formData.get("rate"), included: formData.get("included") });
  const scope = await requireTenantPermission(parsed.tenantId, "orders.manage", parsed.storeId);
  const rule = await db.taxRule.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, name: parsed.name, countryCode: parsed.countryCode, rateBps: Math.round(parsed.rate * 100), included: parsed.included === "true" } });
  await db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "tax.rule_created", entityType: "TaxRule", entityId: rule.id, summary: `Created tax rule ${rule.name}` } });
  revalidatePath("/dashboard/customer-care");
}

export async function updateReturnStatusAction(formData: FormData) {
  const parsed = identity.extend({ returnId: z.string().min(1), status: z.enum(["APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]) }).parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), returnId: formData.get("returnId"), status: formData.get("status") });
  const scope = await requireTenantPermission(parsed.tenantId, "orders.refund", parsed.storeId);
  const request = await db.returnRequest.findFirst({ where: { id: parsed.returnId, tenantId: parsed.tenantId, storeId: parsed.storeId }, include: { order: { select: { id: true, orderNumber: true } } } });
  if (!request) throw new Error("Return request not found.");
  await db.$transaction(async tx => { await tx.returnRequest.update({ where: { id: request.id }, data: { status: parsed.status } }); if (parsed.status === "REFUNDED") await tx.order.update({ where: { id: request.order.id }, data: { status: "REFUNDED" } }); await tx.notificationOutbox.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, orderId: request.order.id, channel: "EMAIL", recipient: request.customerEmail, template: "return_status", payload: { orderNumber: request.order.orderNumber, returnStatus: parsed.status } } }); await tx.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "return.status_updated", entityType: "ReturnRequest", entityId: request.id, summary: `${request.order.orderNumber} return marked ${parsed.status.toLowerCase()}` } }); });
  revalidatePath("/dashboard/customer-care"); revalidatePath("/dashboard/orders");
}
