"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";
import { purchaseOrderStatus, remainingQuantity } from "@/lib/procurement";
import type { CommerceModuleState } from "@/app/dashboard/commerce-actions";

const id = z.string().min(1);
const optionalText = (max: number) => z.string().trim().max(max).optional();

function refreshProcurement() {
  revalidatePath("/dashboard/procurement");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
}

const supplierSchema = z.object({
  tenantId: id, storeId: id,
  name: z.string().trim().min(2, "Enter a supplier name.").max(120),
  email: z.union([z.email("Enter a valid email."), z.literal("")]).optional(),
  phone: optionalText(40), notes: optionalText(500),
});

export async function createSupplierAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = supplierSchema.safeParse({
    tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), name: formData.get("name"),
    email: formData.get("email") ?? "", phone: formData.get("phone") || undefined, notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  const store = await db.store.findFirst({ where: { id: value.storeId, tenantId: value.tenantId }, select: { id: true } });
  if (!store) return { status: "error", message: "The selected store is outside this business." };
  try {
    const supplier = await db.supplier.create({ data: { ...value, email: value.email || null } });
    await db.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "supplier.created", entityType: "Supplier", entityId: supplier.id, summary: `Created supplier ${supplier.name}` } });
    refreshProcurement();
    return { status: "success", message: `${supplier.name} is ready for purchase orders.` };
  } catch {
    return { status: "error", message: "That supplier already exists for this store or could not be created." };
  }
}

const supplierUpdateSchema = supplierSchema.extend({ supplierId: id });

export async function updateSupplierAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = supplierUpdateSchema.safeParse({
    supplierId: formData.get("supplierId"), tenantId: formData.get("tenantId"), storeId: formData.get("storeId"),
    name: formData.get("name"), email: formData.get("email") ?? "", phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const { supplierId, ...value } = parsed.data;
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  try {
    const changed = await db.supplier.updateMany({
      where: { id: supplierId, tenantId: value.tenantId, storeId: value.storeId },
      data: { name: value.name, email: value.email || null, phone: value.phone || null, notes: value.notes || null },
    });
    if (changed.count !== 1) return { status: "error", message: "Supplier not found in this store." };
    await db.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "supplier.updated", entityType: "Supplier", entityId: supplierId, summary: `Updated supplier ${value.name}` } });
    refreshProcurement();
    return { status: "success", message: `${value.name} was updated.` };
  } catch {
    return { status: "error", message: "The supplier could not be updated. Check that its name is unique in this store." };
  }
}

const supplierToggleSchema = z.object({ supplierId: id, tenantId: id, storeId: id, active: z.enum(["true", "false"]) });

export async function toggleSupplierAction(formData: FormData) {
  const value = supplierToggleSchema.parse(Object.fromEntries(formData));
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  const active = value.active === "true";
  const supplier = await db.supplier.findFirst({ where: { id: value.supplierId, tenantId: value.tenantId, storeId: value.storeId }, select: { name: true } });
  if (!supplier) throw new Error("Supplier not found in this store.");
  await db.$transaction([
    db.supplier.update({ where: { id: value.supplierId }, data: { active } }),
    db.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: active ? "supplier.activated" : "supplier.deactivated", entityType: "Supplier", entityId: value.supplierId, summary: `${active ? "Activated" : "Deactivated"} supplier ${supplier.name}` } }),
  ]);
  refreshProcurement();
}

const purchaseOrderSchema = z.object({
  tenantId: id, storeId: id, supplierId: id,
  expectedAt: z.string().optional(), notes: optionalText(500),
  variantIds: z.array(id).min(1),
  quantities: z.array(z.coerce.number().int().min(1).max(1_000_000)),
  unitCosts: z.array(z.coerce.number().finite().min(0).max(100_000_000)),
});

export async function createPurchaseOrderAction(_state: CommerceModuleState, formData: FormData): Promise<CommerceModuleState> {
  const parsed = purchaseOrderSchema.safeParse({
    tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), supplierId: formData.get("supplierId"),
    expectedAt: formData.get("expectedAt") || undefined, notes: formData.get("notes") || undefined,
    variantIds: formData.getAll("variantId"), quantities: formData.getAll("quantity"), unitCosts: formData.getAll("unitCost"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  if (value.variantIds.length !== value.quantities.length || value.variantIds.length !== value.unitCosts.length) return { status: "error", message: "Every line needs a product, quantity, and cost." };
  if (new Set(value.variantIds).size !== value.variantIds.length) return { status: "error", message: "Each product variant can appear only once on a purchase order." };
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  const [store, supplier, variants] = await Promise.all([
    db.store.findFirst({ where: { id: value.storeId, tenantId: value.tenantId }, select: { id: true, currency: true } }),
    db.supplier.findFirst({ where: { id: value.supplierId, tenantId: value.tenantId, storeId: value.storeId, active: true }, select: { id: true, name: true } }),
    db.productVariant.findMany({ where: { id: { in: value.variantIds }, tenantId: value.tenantId, product: { storeId: value.storeId } }, select: { id: true } }),
  ]);
  if (!store || !supplier || variants.length !== value.variantIds.length) return { status: "error", message: "The supplier or a product does not belong to the selected store." };

  const number = `PO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const order = await db.purchaseOrder.create({
    data: {
      tenantId: value.tenantId, storeId: value.storeId, supplierId: value.supplierId, number, currency: store.currency,
      expectedAt: value.expectedAt ? new Date(`${value.expectedAt}T12:00:00.000Z`) : null, notes: value.notes,
      lines: { create: value.variantIds.map((variantId, index) => ({ variantId, orderedQuantity: value.quantities[index], unitCostMinor: Math.round(value.unitCosts[index] * 100) })) },
    },
  });
  await db.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "purchase_order.created", entityType: "PurchaseOrder", entityId: order.id, summary: `Created draft ${number} for ${supplier.name}`, changes: { lineCount: value.variantIds.length } } });
  refreshProcurement();
  return { status: "success", message: `${number} was saved as a draft. Submit it when sent to the supplier.` };
}

const orderTransitionSchema = z.object({ purchaseOrderId: id, tenantId: id, storeId: id });

export async function submitPurchaseOrderAction(formData: FormData) {
  const value = orderTransitionSchema.parse(Object.fromEntries(formData));
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  await db.$transaction(async tx => {
    const order = await tx.purchaseOrder.findFirst({ where: { id: value.purchaseOrderId, tenantId: value.tenantId, storeId: value.storeId, status: "DRAFT" }, include: { lines: true } });
    if (!order) throw new Error("Only a draft purchase order can be submitted.");
    for (const line of order.lines) {
      await tx.inventoryItem.upsert({
        where: { tenantId_storeId_variantId_locationKey: { tenantId: value.tenantId, storeId: value.storeId, variantId: line.variantId, locationKey: "main" } },
        create: { tenantId: value.tenantId, storeId: value.storeId, variantId: line.variantId, incoming: line.orderedQuantity },
        update: { incoming: { increment: line.orderedQuantity } },
      });
    }
    await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: "ORDERED", orderedAt: new Date() } });
    await tx.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "purchase_order.submitted", entityType: "PurchaseOrder", entityId: order.id, summary: `Submitted ${order.number}; stock is now incoming` } });
  });
  refreshProcurement();
}

const receiveSchema = orderTransitionSchema.extend({ lineId: id, quantity: z.coerce.number().int().min(1).max(1_000_000) });

export async function receivePurchaseOrderLineAction(formData: FormData) {
  const value = receiveSchema.parse(Object.fromEntries(formData));
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  await db.$transaction(async tx => {
    const order = await tx.purchaseOrder.findFirst({
      where: { id: value.purchaseOrderId, tenantId: value.tenantId, storeId: value.storeId, status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] } },
      include: { lines: { include: { variant: { select: { sku: true } } } } },
    });
    const line = order?.lines.find(item => item.id === value.lineId);
    if (!order || !line) throw new Error("This purchase-order line is not available to receive.");
    const remaining = remainingQuantity(line);
    if (value.quantity > remaining) throw new Error(`Only ${remaining} units remain to be received.`);
    const inventory = await tx.inventoryItem.findUnique({ where: { tenantId_storeId_variantId_locationKey: { tenantId: value.tenantId, storeId: value.storeId, variantId: line.variantId, locationKey: "main" } } });
    if (!inventory) throw new Error("Inventory record not found.");
    const changed = await tx.inventoryItem.updateMany({
      where: { id: inventory.id, incoming: { gte: value.quantity } },
      data: { onHand: { increment: value.quantity }, incoming: { decrement: value.quantity } },
    });
    if (changed.count !== 1) throw new Error("Incoming stock changed while receiving. Refresh and try again.");
    await tx.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedQuantity: { increment: value.quantity } } });
    await tx.productVariant.update({ where: { id: line.variantId }, data: { costMinor: line.unitCostMinor } });
    const progress = order.lines.map(item => item.id === line.id ? { ...item, receivedQuantity: item.receivedQuantity + value.quantity } : item);
    const status = purchaseOrderStatus(progress);
    await tx.purchaseOrder.update({ where: { id: order.id }, data: { status, receivedAt: status === "RECEIVED" ? new Date() : null } });
    await tx.stockMovement.create({ data: { tenantId: value.tenantId, storeId: value.storeId, variantId: line.variantId, inventoryItemId: inventory.id, actorId: scope.user.id, type: "PURCHASE_RECEIPT", quantity: value.quantity, referenceType: "PurchaseOrder", referenceId: order.id, note: `Received against ${order.number}` } });
    await tx.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "purchase_order.received", entityType: "PurchaseOrder", entityId: order.id, summary: `Received ${value.quantity} × ${line.variant.sku} against ${order.number}`, changes: { quantity: value.quantity, status } } });
  });
  refreshProcurement();
}

export async function cancelPurchaseOrderAction(formData: FormData) {
  const value = orderTransitionSchema.parse(Object.fromEntries(formData));
  const scope = await requireTenantPermission(value.tenantId, "inventory.adjust", value.storeId);
  await db.$transaction(async tx => {
    const order = await tx.purchaseOrder.findFirst({ where: { id: value.purchaseOrderId, tenantId: value.tenantId, storeId: value.storeId, status: { in: ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"] } }, include: { lines: true } });
    if (!order) throw new Error("This purchase order can no longer be cancelled.");
    if (order.status !== "DRAFT") {
      for (const line of order.lines) {
        const inventory = await tx.inventoryItem.findUnique({ where: { tenantId_storeId_variantId_locationKey: { tenantId: value.tenantId, storeId: value.storeId, variantId: line.variantId, locationKey: "main" } } });
        if (inventory) await tx.inventoryItem.update({ where: { id: inventory.id }, data: { incoming: Math.max(0, inventory.incoming - remainingQuantity(line)) } });
      }
    }
    await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await tx.auditLog.create({ data: { tenantId: value.tenantId, storeId: value.storeId, actorId: scope.user.id, action: "purchase_order.cancelled", entityType: "PurchaseOrder", entityId: order.id, summary: `Cancelled ${order.number} and reversed remaining incoming stock` } });
  });
  refreshProcurement();
}
