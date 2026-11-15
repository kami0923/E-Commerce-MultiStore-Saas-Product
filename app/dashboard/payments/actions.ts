"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";
import { paymentBalance, refundableAmount } from "@/lib/payments";

const provider = z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "PAYFAST", "EASYPAISA", "JAZZCASH", "STRIPE"]);
const base = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1), orderId: z.string().min(1), amount: z.coerce.number().positive().max(100_000_000), provider, providerReference: z.string().trim().max(160).optional(), note: z.string().trim().max(300).optional() });

function refreshPayments() {
  revalidatePath("/dashboard/payments"); revalidatePath("/dashboard/orders"); revalidatePath("/dashboard/analytics"); revalidatePath("/dashboard");
}

export async function recordPaymentAction(formData: FormData) {
  const value = base.parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), orderId: formData.get("orderId"), amount: formData.get("amount"), provider: formData.get("provider"), providerReference: formData.get("providerReference") || undefined, note: formData.get("note") || undefined });
  const scope = await requireTenantPermission(value.tenantId, "orders.manage", value.storeId);
  await db.$transaction(async tx => {
    const order = await tx.order.findFirst({ where: { id: value.orderId, tenantId: value.tenantId, storeId: value.storeId, status: { not: "CANCELLED" } }, include: { paymentTransactions: true } });
    if (!order) throw new Error("Order not found or no longer payable.");
    const amountMinor = Math.round(value.amount * 100);
    const balance = paymentBalance(order.paymentTransactions);
    const outstanding = Math.max(0, order.totalMinor - balance.net);
    if (amountMinor > outstanding) throw new Error(`Payment exceeds the outstanding amount of ${(outstanding / 100).toFixed(2)} ${order.currency}.`);
    const pending = order.paymentTransactions.find(item => item.type === "PAYMENT" && item.status === "PENDING" && item.provider === value.provider);
    const transaction = pending
      ? await tx.paymentTransaction.update({ where: { id: pending.id }, data: { amountMinor, status: "SUCCEEDED", actorId: scope.user.id, providerReference: value.providerReference, note: value.note || "Payment confirmed", processedAt: new Date() } })
      : await tx.paymentTransaction.create({ data: { tenantId: value.tenantId, storeId: value.storeId, orderId: order.id, actorId: scope.user.id, provider: value.provider, type: "PAYMENT", status: "SUCCEEDED", amountMinor, currency: order.currency, providerReference: value.providerReference, note: value.note || "Payment confirmed", processedAt: new Date() } });
    await tx.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "payment.recorded", entityType: "PaymentTransaction", entityId: transaction.id, summary: `Recorded ${value.provider.replaceAll("_", " ").toLowerCase()} payment for ${order.orderNumber}`, changes: { amountMinor, provider: value.provider, providerReference: value.providerReference } } });
  });
  refreshPayments();
}

export async function recordRefundAction(formData: FormData) {
  const value = base.parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), orderId: formData.get("orderId"), amount: formData.get("amount"), provider: formData.get("provider"), providerReference: formData.get("providerReference") || undefined, note: formData.get("note") || undefined });
  const scope = await requireTenantPermission(value.tenantId, "orders.refund", value.storeId);
  await db.$transaction(async tx => {
    const order = await tx.order.findFirst({ where: { id: value.orderId, tenantId: value.tenantId, storeId: value.storeId }, include: { paymentTransactions: true } });
    if (!order) throw new Error("Order not found.");
    const amountMinor = Math.round(value.amount * 100);
    const refundable = refundableAmount(order.paymentTransactions);
    if (amountMinor > refundable) throw new Error(`Refund exceeds the refundable amount of ${(refundable / 100).toFixed(2)} ${order.currency}.`);
    const transaction = await tx.paymentTransaction.create({ data: { tenantId: value.tenantId, storeId: value.storeId, orderId: order.id, actorId: scope.user.id, provider: value.provider, type: "REFUND", status: "SUCCEEDED", amountMinor, currency: order.currency, providerReference: value.providerReference, note: value.note || "Refund confirmed", processedAt: new Date() } });
    const after = refundable - amountMinor;
    if (after === 0) await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    await tx.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "payment.refunded", entityType: "PaymentTransaction", entityId: transaction.id, summary: `Recorded refund for ${order.orderNumber}`, changes: { amountMinor, provider: value.provider, providerReference: value.providerReference } } });
  });
  refreshPayments();
}
