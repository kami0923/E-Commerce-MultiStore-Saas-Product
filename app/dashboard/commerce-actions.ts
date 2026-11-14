"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { canCreateProduct } from "@/data/subscription-limits";
import { db } from "@/lib/db";

export type CommerceModuleState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

const id = z.string().min(1);
const money = z.coerce.number().finite().min(0);

function slugify(value: string) {
  const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 55) || "item";
  return `${base}-${randomUUID().slice(0, 6)}`;
}

async function verifiedStore(tenantId: string, storeId: string) {
  const store = await db.store.findFirst({ where: { id: storeId, tenantId }, select: { id: true, tenantId: true, currency: true } });
  if (!store) throw new Error("The selected store does not belong to this business.");
  return store;
}

const categorySchema = z.object({
  tenantId: id,
  storeId: id,
  name: z.string().trim().min(2, "Enter a category name.").max(80),
  description: z.string().trim().max(300).optional(),
  parentId: z.string().optional(),
});

export async function createCategoryAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = categorySchema.safeParse({
    tenantId: formData.get("tenantId"),
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const { tenantId, storeId, name, description, parentId } = parsed.data;
  const scope = await requireTenantPermission(tenantId, "products.manage", storeId);
  await verifiedStore(tenantId, storeId);
  if (parentId) {
    const parent = await db.category.findFirst({ where: { id: parentId, tenantId, storeId }, select: { id: true } });
    if (!parent) return { status: "error", message: "The parent category is outside the selected store." };
  }

  try {
    const category = await db.category.create({ data: { tenantId, storeId, name, slug: slugify(name), description, parentId } });
    await db.auditLog.create({
      data: { tenantId, storeId, actorId: scope.user.id, action: "category.created", entityType: "Category", entityId: category.id, summary: `Created category ${name}` },
    });
  } catch {
    return { status: "error", message: "The category could not be created." };
  }

  revalidatePath("/dashboard/catalog");
  return { status: "success", message: `${name} was added to the category library.` };
}

const productSchema = z.object({
  tenantId: id,
  storeId: id,
  name: z.string().trim().min(2, "Enter a product name.").max(120),
  description: z.string().trim().max(2000).optional(),
  brand: z.string().trim().max(80).optional(),
  productType: z.string().trim().max(80).optional(),
  categoryId: z.string().optional(),
  variantTitle: z.string().trim().min(1, "Enter a variant title.").max(80),
  sku: z.string().trim().min(2, "Enter a SKU.").max(80).toUpperCase(),
  price: money,
  cost: money.optional(),
  initialStock: z.coerce.number().int().min(0).max(1_000_000),
  reorderPoint: z.coerce.number().int().min(0).max(1_000_000),
  status: z.enum(["DRAFT", "ACTIVE"]),
  mediaIds: z.array(id).max(8),
});

export async function createProductAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = productSchema.safeParse({
    tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), name: formData.get("name"),
    description: formData.get("description") || undefined, brand: formData.get("brand") || undefined,
    productType: formData.get("productType") || undefined, categoryId: formData.get("categoryId") || undefined,
    variantTitle: formData.get("variantTitle"), sku: formData.get("sku"), price: formData.get("price"),
    cost: formData.get("cost") || undefined, initialStock: formData.get("initialStock"),
    reorderPoint: formData.get("reorderPoint"), status: formData.get("status"), mediaIds: formData.getAll("mediaId"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  const scope = await requireTenantPermission(value.tenantId, "products.manage", value.storeId);
  await verifiedStore(value.tenantId, value.storeId);
  const capacity = await canCreateProduct(value.tenantId);
  if (!capacity.allowed) return { status: "error", message: capacity.message };
  if (value.categoryId) {
    const category = await db.category.findFirst({ where: { id: value.categoryId, tenantId: value.tenantId, storeId: value.storeId }, select: { id: true } });
    if (!category) return { status: "error", message: "The selected category is outside this store." };
  }
  if (value.mediaIds.length > 0) {
    const validMedia = await db.mediaAsset.count({ where: { id: { in: value.mediaIds }, tenantId: value.tenantId, storeId: value.storeId } });
    if (validMedia !== new Set(value.mediaIds).size) return { status: "error", message: "One or more selected images are outside this store." };
  }

  try {
    await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId: value.tenantId, storeId: value.storeId, name: value.name, slug: slugify(value.name),
          description: value.description, brand: value.brand, productType: value.productType, status: value.status,
          attributes: {},
        },
      });
      const variant = await tx.productVariant.create({
        data: {
          tenantId: value.tenantId, productId: product.id, sku: value.sku, title: value.variantTitle,
          priceMinor: Math.round(value.price * 100), costMinor: value.cost === undefined ? null : Math.round(value.cost * 100), attributes: {},
        },
      });
      await tx.inventoryItem.create({
        data: { tenantId: value.tenantId, storeId: value.storeId, variantId: variant.id, locationKey: "main", onHand: value.initialStock, reorderPoint: value.reorderPoint },
      });
      if (value.categoryId) await tx.productCategory.create({ data: { tenantId: value.tenantId, productId: product.id, categoryId: value.categoryId } });
      for (const [index, mediaAssetId] of [...new Set(value.mediaIds)].entries()) await tx.productMedia.create({ data: { productId: product.id, mediaAssetId, sortOrder: index, isPrimary: index === 0 } });
      await tx.auditLog.create({
        data: {
          tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "product.created",
          entityType: "Product", entityId: product.id, summary: `Created ${value.name} (${value.sku})`,
          changes: { initialStock: value.initialStock, priceMinor: Math.round(value.price * 100), status: value.status },
        },
      });
    });
  } catch {
    return { status: "error", message: "The product could not be created. Check that the SKU is unique within the business." };
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  return { status: "success", message: `${value.name} was added without altering any existing products.` };
}

const variantSchema = z.object({
  productId: id, tenantId: id, storeId: id,
  title: z.string().trim().min(1, "Enter a variant title.").max(80),
  sku: z.string().trim().min(2, "Enter a SKU.").max(80).toUpperCase(),
  price: money, cost: money.optional(),
  initialStock: z.coerce.number().int().min(0).max(1_000_000),
  reorderPoint: z.coerce.number().int().min(0).max(1_000_000),
});

export async function addVariantAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = variantSchema.safeParse({
    productId: formData.get("productId"), tenantId: formData.get("tenantId"), storeId: formData.get("storeId"),
    title: formData.get("title"), sku: formData.get("sku"), price: formData.get("price"), cost: formData.get("cost") || undefined,
    initialStock: formData.get("initialStock"), reorderPoint: formData.get("reorderPoint"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  const scope = await requireTenantPermission(value.tenantId, "products.manage", value.storeId);
  const product = await db.product.findFirst({ where: { id: value.productId, tenantId: value.tenantId, storeId: value.storeId, status: { not: "ARCHIVED" } }, select: { id: true, name: true } });
  if (!product) return { status: "error", message: "The product is unavailable or archived." };

  try {
    await db.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          tenantId: value.tenantId, productId: product.id, title: value.title, sku: value.sku,
          priceMinor: Math.round(value.price * 100), costMinor: value.cost === undefined ? null : Math.round(value.cost * 100), attributes: {},
        },
      });
      await tx.inventoryItem.create({
        data: { tenantId: value.tenantId, storeId: value.storeId, variantId: variant.id, locationKey: "main", onHand: value.initialStock, reorderPoint: value.reorderPoint },
      });
      await tx.auditLog.create({
        data: {
          tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "product.variant_added",
          entityType: "ProductVariant", entityId: variant.id, summary: `Added ${value.title} (${value.sku}) to ${product.name}`,
          changes: { initialStock: value.initialStock, priceMinor: Math.round(value.price * 100) },
        },
      });
    });
  } catch {
    return { status: "error", message: "The variant could not be added. Check that its SKU is unique within the business." };
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/inventory");
  return { status: "success", message: `${value.title} was added to ${product.name}.` };
}

export async function archiveProductAction(formData: FormData) {
  const parsed = z.object({ productId: id, tenantId: id, storeId: id }).parse({
    productId: formData.get("productId"), tenantId: formData.get("tenantId"), storeId: formData.get("storeId"),
  });
  const scope = await requireTenantPermission(parsed.tenantId, "products.manage", parsed.storeId);
  const product = await db.product.findFirst({ where: { id: parsed.productId, tenantId: parsed.tenantId, storeId: parsed.storeId }, select: { id: true, name: true, status: true } });
  if (!product) throw new Error("Product not found.");
  if (product.status !== "ARCHIVED") {
    await db.$transaction([
      db.product.update({ where: { id: product.id }, data: { status: "ARCHIVED", archivedAt: new Date() } }),
      db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "product.archived", entityType: "Product", entityId: product.id, summary: `Archived ${product.name} without deleting its history` } }),
    ]);
  }
  revalidatePath("/dashboard/catalog");
}

const adjustmentSchema = z.object({
  inventoryId: id, tenantId: id, storeId: id,
  delta: z.coerce.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, "Enter a non-zero adjustment."),
  reason: z.string().trim().min(3, "Explain the adjustment.").max(160),
});

export async function adjustInventoryAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = adjustmentSchema.safeParse({
    inventoryId: formData.get("inventoryId"), tenantId: formData.get("tenantId"), storeId: formData.get("storeId"),
    delta: formData.get("delta"), reason: formData.get("reason"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);

  try {
    const result = await db.$transaction(async (tx) => {
      const before = await tx.inventoryItem.findFirst({
        where: { id: value.inventoryId, tenantId: value.tenantId, storeId: value.storeId },
        select: { id: true, onHand: true, reserved: true, variant: { select: { sku: true, product: { select: { name: true } } } } },
      });
      if (!before) throw new Error("Inventory item not found.");
      if (before.onHand + value.delta < before.reserved) throw new Error("Stock cannot be reduced below the quantity reserved by open orders.");
      const changed = await tx.inventoryItem.updateMany({
        where: { id: before.id, onHand: before.onHand, reserved: before.reserved }, data: { onHand: { increment: value.delta } },
      });
      if (changed.count !== 1) throw new Error("Stock changed during this adjustment. Please retry.");
      const after = before.onHand + value.delta;
      await tx.auditLog.create({
        data: {
          tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "inventory.adjusted",
          entityType: "InventoryItem", entityId: before.id, summary: `${before.variant.sku}: ${value.reason}`,
          changes: { before: before.onHand, delta: value.delta, after, reason: value.reason },
        },
      });
      return { after, label: before.variant.product.name };
    });
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard");
    return { status: "success", message: `${result.label} now has ${result.after} units on hand.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Inventory could not be adjusted." };
  }
}

const orderSchema = z.object({
  tenantId: id, storeId: id,
  customerName: z.string().trim().max(100).optional(),
  customerEmail: z.email("Enter a valid customer email.").trim().toLowerCase(),
  shippingAddress: z.string().trim().min(5, "Enter a delivery address.").max(500),
  discount: money, shipping: money, tax: money,
  variantIds: z.array(id).min(1, "Add at least one item."),
  quantities: z.array(z.coerce.number().int().min(1).max(10_000)),
});

export async function createOrderAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = orderSchema.safeParse({
    tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), customerName: formData.get("customerName") || undefined,
    customerEmail: formData.get("customerEmail"), shippingAddress: formData.get("shippingAddress"),
    discount: formData.get("discount") || 0, shipping: formData.get("shipping") || 0, tax: formData.get("tax") || 0,
    variantIds: formData.getAll("variantId"), quantities: formData.getAll("quantity"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  if (value.variantIds.length !== value.quantities.length) return { status: "error", message: "Every order item needs a quantity." };
  const scope = await requireTenantPermission(value.tenantId, "orders.manage", value.storeId);
  const store = await verifiedStore(value.tenantId, value.storeId);

  const requested = new Map<string, number>();
  value.variantIds.forEach((variantId, index) => requested.set(variantId, (requested.get(variantId) ?? 0) + value.quantities[index]));

  try {
    const orderNumber = await db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: [...requested.keys()] }, active: true, product: { tenantId: value.tenantId, storeId: value.storeId, status: "ACTIVE" } },
        select: { id: true, sku: true, title: true, priceMinor: true, product: { select: { name: true } }, inventory: { where: { storeId: value.storeId, locationKey: "main" }, select: { id: true, onHand: true, reserved: true } } },
      });
      if (variants.length !== requested.size) throw new Error("One or more selected variants are unavailable in this store.");

      let subtotalMinor = 0;
      for (const variant of variants) {
        const quantity = requested.get(variant.id) ?? 0;
        const inventory = variant.inventory[0];
        if (!inventory || inventory.onHand - inventory.reserved < quantity) throw new Error(`${variant.sku} does not have enough available stock.`);
        subtotalMinor += variant.priceMinor * quantity;
      }
      const discountMinor = Math.round(value.discount * 100);
      const shippingMinor = Math.round(value.shipping * 100);
      const taxMinor = Math.round(value.tax * 100);
      const totalMinor = subtotalMinor - discountMinor + shippingMinor + taxMinor;
      if (totalMinor < 0) throw new Error("The discount cannot exceed the order value.");

      const number = `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
      const order = await tx.order.create({
        data: {
          tenantId: value.tenantId, storeId: value.storeId, orderNumber: number, status: "PENDING", currency: store.currency,
          subtotalMinor, discountMinor, shippingMinor, taxMinor, totalMinor, customerEmail: value.customerEmail,
          customerName: value.customerName, shippingData: { address: value.shippingAddress },
        },
      });
      for (const variant of variants) {
        const quantity = requested.get(variant.id) ?? 0;
        await tx.orderItem.create({
          data: { tenantId: value.tenantId, orderId: order.id, variantId: variant.id, productName: variant.product.name, variantName: variant.title, sku: variant.sku, quantity, unitPriceMinor: variant.priceMinor, totalMinor: variant.priceMinor * quantity },
        });
        const inventory = variant.inventory[0];
        const reserved = await tx.inventoryItem.updateMany({
          where: { id: inventory.id, onHand: inventory.onHand, reserved: inventory.reserved },
          data: { reserved: { increment: quantity } },
        });
        if (reserved.count !== 1) throw new Error(`Stock for ${variant.sku} changed while the order was being created. Please retry.`);
      }
      await tx.auditLog.create({
        data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "order.created", entityType: "Order", entityId: order.id, summary: `Created ${number} for ${value.customerEmail}`, changes: { status: "PENDING", totalMinor } },
      });
      return number;
    });
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { status: "success", message: `${orderNumber} was created and its stock is reserved.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The order could not be created." };
  }
}

const transitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
} as const;

export async function transitionOrderAction(formData: FormData) {
  const parsed = z.object({
    orderId: id, tenantId: id, storeId: id,
    nextStatus: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  }).parse({ orderId: formData.get("orderId"), tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), nextStatus: formData.get("nextStatus") });
  const scope = await requireTenantPermission(parsed.tenantId, "orders.manage", parsed.storeId);

  await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: parsed.orderId, tenantId: parsed.tenantId, storeId: parsed.storeId },
      select: { id: true, orderNumber: true, status: true, customerEmail: true, items: { select: { variantId: true, quantity: true, sku: true } } },
    });
    if (!order) throw new Error("Order not found.");
    const allowed = transitions[order.status];
    if (!(allowed as readonly string[]).includes(parsed.nextStatus)) throw new Error(`An order cannot move from ${order.status} to ${parsed.nextStatus}.`);

    if (parsed.nextStatus === "SHIPPED" || parsed.nextStatus === "CANCELLED") {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const data = parsed.nextStatus === "SHIPPED"
          ? { onHand: { decrement: item.quantity }, reserved: { decrement: item.quantity } }
          : { reserved: { decrement: item.quantity } };
        const changed = await tx.inventoryItem.updateMany({
          where: {
            tenantId: parsed.tenantId, storeId: parsed.storeId, variantId: item.variantId, locationKey: "main",
            reserved: { gte: item.quantity }, ...(parsed.nextStatus === "SHIPPED" ? { onHand: { gte: item.quantity } } : {}),
          },
          data,
        });
        if (changed.count !== 1) throw new Error(`Inventory for ${item.sku} is inconsistent. Resolve stock before changing this order.`);
      }
    }

    const transitioned = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: parsed.nextStatus } });
    if (transitioned.count !== 1) throw new Error("The order status changed while this action was running. Please retry.");
    await tx.notificationOutbox.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, orderId: order.id, channel: "EMAIL", recipient: order.customerEmail, template: "order_status", payload: { orderNumber: order.orderNumber, status: parsed.nextStatus } } });
    await tx.auditLog.create({
      data: {
        tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "order.status_changed",
        entityType: "Order", entityId: order.id, summary: `${order.orderNumber}: ${order.status} → ${parsed.nextStatus}`,
        changes: { before: order.status, after: parsed.nextStatus },
      },
    });
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
}
