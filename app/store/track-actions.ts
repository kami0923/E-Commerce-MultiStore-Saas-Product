"use server";

import { z } from "zod";
import { db } from "@/lib/db";

type TrackedOrder = { id: string; orderNumber: string; status: string; currency: string; subtotalMinor: number; discountMinor: number; shippingMinor: number; taxMinor: number; totalMinor: number; placedAt: string; storeName: string; items: { productName: string; variantName: string; quantity: number; totalMinor: number }[]; returnRequest?: { status: string; reason: string } | null };
export type TrackOrderState = { status: "idle" | "error" | "success"; message?: string; order?: TrackedOrder };

const lookup = z.object({ storeSlug: z.string().min(1), orderNumber: z.string().trim().min(5).max(80).transform(value => value.toUpperCase()), email: z.email().trim().toLowerCase() });

export async function trackOrderAction(_state: TrackOrderState, formData: FormData): Promise<TrackOrderState> {
  const parsed = lookup.safeParse({ storeSlug: formData.get("storeSlug"), orderNumber: formData.get("orderNumber"), email: formData.get("email") });
  if (!parsed.success) return { status: "error", message: "Enter the order number and email used at checkout." };
  const order = await db.order.findFirst({ where: { orderNumber: parsed.data.orderNumber, customerEmail: parsed.data.email, store: { slug: parsed.data.storeSlug, status: "ACTIVE" } }, select: { id: true, orderNumber: true, status: true, currency: true, subtotalMinor: true, discountMinor: true, shippingMinor: true, taxMinor: true, totalMinor: true, placedAt: true, store: { select: { name: true } }, items: { select: { productName: true, variantName: true, quantity: true, totalMinor: true } }, returnRequests: { where: { customerEmail: parsed.data.email }, take: 1, select: { status: true, reason: true } } } });
  if (!order) return { status: "error", message: "No matching order was found. Check both details and try again." };
  return { status: "success", order: { ...order, storeName: order.store.name, placedAt: order.placedAt.toISOString(), returnRequest: order.returnRequests[0] ?? null, items: order.items } };
}

export async function requestReturnAction(_state: TrackOrderState, formData: FormData): Promise<TrackOrderState> {
  const parsed = lookup.extend({ reason: z.string().trim().min(3).max(100), note: z.string().trim().max(500).optional() }).safeParse({ storeSlug: formData.get("storeSlug"), orderNumber: formData.get("orderNumber"), email: formData.get("email"), reason: formData.get("reason"), note: formData.get("note") || undefined });
  if (!parsed.success) return { status: "error", message: "Add a return reason and verify your order details." };
  const order = await db.order.findFirst({ where: { orderNumber: parsed.data.orderNumber, customerEmail: parsed.data.email, store: { slug: parsed.data.storeSlug, status: "ACTIVE" } }, select: { id: true, tenantId: true, storeId: true, orderNumber: true } });
  if (!order) return { status: "error", message: "The order could not be verified." };
  await db.$transaction(async tx => { const request = await tx.returnRequest.upsert({ where: { orderId_customerEmail: { orderId: order.id, customerEmail: parsed.data.email } }, create: { tenantId: order.tenantId, storeId: order.storeId, orderId: order.id, customerEmail: parsed.data.email, reason: parsed.data.reason, note: parsed.data.note }, update: { reason: parsed.data.reason, note: parsed.data.note, status: "REQUESTED" } }); await tx.notificationOutbox.create({ data: { tenantId: order.tenantId, storeId: order.storeId, orderId: order.id, channel: "EMAIL", recipient: parsed.data.email, template: "return_requested", payload: { orderNumber: order.orderNumber, returnRequestId: request.id } } }); await tx.auditLog.create({ data: { tenantId: order.tenantId, storeId: order.storeId, action: "return.customer_requested", entityType: "ReturnRequest", entityId: request.id, summary: `Customer requested a return for ${order.orderNumber}` } }); });
  return trackOrderAction({ status: "idle" }, formData);
}
