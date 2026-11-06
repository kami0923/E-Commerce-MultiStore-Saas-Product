"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { orderTotal, promotionDiscount, taxAmount } from "@/lib/pricing";

export type CheckoutState = { status: "idle" | "error" | "success"; message?: string; orderNumber?: string; paymentMethod?: string; errors?: Record<string, string[]> };

const checkoutSchema = z.object({
  storeSlug: z.string().min(1),
  customerName: z.string().trim().min(2, "Enter your full name.").max(100),
  customerEmail: z.email("Enter a valid email address.").trim().toLowerCase(),
  customerPhone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  address: z.string().trim().min(5, "Enter your delivery address.").max(300),
  city: z.string().trim().min(2, "Enter your city.").max(80),
  country: z.string().trim().min(2).max(80),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "PAYFAST", "EASYPAISA", "JAZZCASH", "STRIPE"]),
  couponCode: z.string().trim().max(30).transform(value => value.toUpperCase().replace(/\s+/g, "")).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(100) })).min(1, "Your bag is empty.").max(50),
  website: z.string().max(0).optional(),
});

export async function placePublicOrderAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let items: unknown = [];
  try { items = JSON.parse(String(formData.get("items") || "[]")); } catch { return { status: "error", message: "Your bag could not be read. Please refresh and try again." }; }
  const parsed = checkoutSchema.safeParse({
    storeSlug: formData.get("storeSlug"), customerName: formData.get("customerName"), customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"), address: formData.get("address"), city: formData.get("city"),
    country: formData.get("country"), paymentMethod: formData.get("paymentMethod"), couponCode: formData.get("couponCode") || undefined, notes: formData.get("notes") || undefined, items, website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors, message: "Please check the highlighted checkout details." };
  const value = parsed.data;
  const store = await db.store.findFirst({ where: { slug: value.storeSlug, status: "ACTIVE" }, select: { id: true, tenantId: true, currency: true, shippingProfiles: { where: { enabled: true } }, paymentConnections: { where: { enabled: true, status: "CONNECTED" }, select: { provider: true, displayName: true } }, promotions: { where: { active: true } }, taxRules: { where: { enabled: true } } } });
  if (!store) return { status: "error", message: "This store is not accepting orders right now." };
  const allowedPayments = store.paymentConnections.length ? store.paymentConnections : [{ provider: "CASH_ON_DELIVERY" as const, displayName: "Cash on delivery" }];
  const selectedPayment = allowedPayments.find(connection => connection.provider === value.paymentMethod);
  if (!selectedPayment) return { status: "error", message: "That payment method is not available for this store." };

  const requested = new Map<string, number>();
  for (const item of value.items) requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity);

  try {
    const orderNumber = await db.$transaction(async tx => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: [...requested.keys()] }, active: true, product: { tenantId: store.tenantId, storeId: store.id, status: "ACTIVE" } },
        select: { id: true, sku: true, title: true, priceMinor: true, product: { select: { name: true } }, inventory: { where: { storeId: store.id, locationKey: "main" }, select: { id: true, onHand: true, reserved: true } } },
      });
      if (variants.length !== requested.size) throw new Error("One or more items are no longer available.");
      let subtotalMinor = 0;
      for (const variant of variants) {
        const quantity = requested.get(variant.id) ?? 0;
        const inventory = variant.inventory[0];
        if (!inventory || inventory.onHand - inventory.reserved < quantity) throw new Error(`${variant.product.name} no longer has the requested quantity available.`);
        subtotalMinor += variant.priceMinor * quantity;
      }
      const matchingShipping = store.shippingProfiles.find(profile => profile.countryCode === value.country && profile.city?.toLowerCase() === value.city.toLowerCase()) || store.shippingProfiles.find(profile => profile.countryCode === value.country && !profile.city) || store.shippingProfiles.find(profile => profile.countryCode === "INTL" && !profile.city);
      const shippingMinor = matchingShipping && (!matchingShipping.freeAboveMinor || subtotalMinor < matchingShipping.freeAboveMinor) ? matchingShipping.rateMinor : 0;
      const now = new Date();
      const promotion = value.couponCode ? store.promotions.find(item => item.code === value.couponCode && item.startsAt <= now && (!item.endsAt || item.endsAt >= now) && (!item.maxUses || item.usedCount < item.maxUses) && (!item.minSubtotalMinor || subtotalMinor >= item.minSubtotalMinor)) : undefined;
      if (value.couponCode && !promotion) throw new Error("That promotion code is invalid, expired, or not available for this order.");
      const discountMinor = promotionDiscount(subtotalMinor, promotion);
      const discountedSubtotal = subtotalMinor - discountMinor;
      const taxRule = store.taxRules.find(item => item.countryCode === value.country) || store.taxRules.find(item => item.countryCode === "INTL");
      const taxMinor = taxAmount(discountedSubtotal, taxRule);
      const totalMinor = orderTotal({ subtotalMinor, discountMinor, shippingMinor, taxMinor, taxIncluded: taxRule?.included ?? false });
      const customer = await tx.customer.upsert({ where: { storeId_email: { storeId: store.id, email: value.customerEmail } }, create: { tenantId: store.tenantId, storeId: store.id, email: value.customerEmail, name: value.customerName, phone: value.customerPhone, orderCount: 1, totalSpentMinor: totalMinor }, update: { name: value.customerName, phone: value.customerPhone, orderCount: { increment: 1 }, totalSpentMinor: { increment: totalMinor } } });
      const number = `WEB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
      const order = await tx.order.create({ data: {
        tenantId: store.tenantId, storeId: store.id, orderNumber: number, status: "PENDING", currency: store.currency,
        customerId: customer.id, promotionCode: promotion?.code, subtotalMinor, discountMinor, shippingMinor, taxMinor, totalMinor, customerEmail: value.customerEmail, customerName: value.customerName,
        shippingData: { address: value.address, city: value.city, country: value.country, phone: value.customerPhone, notes: value.notes, paymentMethod: value.paymentMethod, paymentLabel: selectedPayment.displayName, shippingProfileId: matchingShipping?.id, shippingLabel: matchingShipping?.name },
      } });
      for (const variant of variants) {
        const quantity = requested.get(variant.id) ?? 0;
        await tx.orderItem.create({ data: { tenantId: store.tenantId, orderId: order.id, variantId: variant.id, productName: variant.product.name, variantName: variant.title, sku: variant.sku, quantity, unitPriceMinor: variant.priceMinor, totalMinor: variant.priceMinor * quantity } });
        const inventory = variant.inventory[0];
        const changed = await tx.inventoryItem.updateMany({ where: { id: inventory.id, onHand: inventory.onHand, reserved: inventory.reserved }, data: { reserved: { increment: quantity } } });
        if (changed.count !== 1) throw new Error(`Stock for ${variant.product.name} changed during checkout. Please retry.`);
      }
      if (promotion) await tx.promotion.update({ where: { id: promotion.id }, data: { usedCount: { increment: 1 } } });
      await tx.notificationOutbox.createMany({ data: [{ tenantId: store.tenantId, storeId: store.id, orderId: order.id, channel: "EMAIL", recipient: value.customerEmail, template: "order_confirmation", payload: { orderNumber: number, totalMinor, currency: store.currency } }, { tenantId: store.tenantId, storeId: store.id, orderId: order.id, channel: "WHATSAPP", recipient: value.customerPhone, template: "order_confirmation", payload: { orderNumber: number, totalMinor, currency: store.currency } }] });
      await tx.auditLog.create({ data: { tenantId: store.tenantId, storeId: store.id, action: "order.web_created", entityType: "Order", entityId: order.id, summary: `Public checkout created ${number}`, changes: { status: "PENDING", subtotalMinor, discountMinor, shippingMinor, taxMinor, totalMinor, promotionCode: promotion?.code, paymentMethod: value.paymentMethod } } });
      return number;
    });
    revalidatePath("/dashboard"); revalidatePath("/dashboard/orders"); revalidatePath("/dashboard/inventory"); revalidatePath("/dashboard/analytics");
    return { status: "success", orderNumber, paymentMethod: selectedPayment.displayName, message: "Your order has been placed successfully." };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Checkout could not be completed." }; }
}
