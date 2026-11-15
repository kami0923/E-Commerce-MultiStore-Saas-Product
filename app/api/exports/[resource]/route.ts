import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";
import { parseReportRange, reportStart, toCsv } from "@/lib/reporting";

export const dynamic = "force-dynamic";

const resources = ["orders", "customers", "catalog", "inventory"] as const;
type Resource = (typeof resources)[number];

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource: requested } = await context.params;
  if (!resources.includes(requested as Resource)) return Response.json({ error: "Unknown export." }, { status: 404 });
  const resource = requested as Resource;
  const scope = await getAuthorizedStoreScope("customers.export");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const url = new URL(request.url);
  const range = parseReportRange(url.searchParams.get("range"));
  const start = reportStart(range);
  const csv = await createExport(resource, storeWhere, start);
  await recordExport(scope.user.id, resource, range, storeWhere);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="meridian-${resource}-${date}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

type StoreWhere = { OR: ({ tenantId: { in: string[] } } | { id: { in: string[] } })[] } | undefined;

async function createExport(resource: Resource, storeWhere: StoreWhere, start?: Date) {
  if (resource === "orders") {
    const rows = await db.order.findMany({ where: { store: storeWhere, ...(start ? { placedAt: { gte: start } } : {}) }, orderBy: { placedAt: "desc" }, take: 50_000, select: { orderNumber: true, placedAt: true, status: true, customerName: true, customerEmail: true, currency: true, subtotalMinor: true, discountMinor: true, shippingMinor: true, taxMinor: true, totalMinor: true, store: { select: { name: true } } } });
    return toCsv(["Store", "Order", "Placed at", "Status", "Customer", "Email", "Currency", "Subtotal", "Discount", "Shipping", "Tax", "Total"], rows.map(item => [item.store.name, item.orderNumber, item.placedAt, item.status, item.customerName, item.customerEmail, item.currency, item.subtotalMinor / 100, item.discountMinor / 100, item.shippingMinor / 100, item.taxMinor / 100, item.totalMinor / 100]));
  }
  if (resource === "customers") {
    const rows = await db.customer.findMany({ where: { store: storeWhere }, orderBy: { updatedAt: "desc" }, take: 50_000, select: { name: true, email: true, phone: true, orderCount: true, totalSpentMinor: true, createdAt: true, updatedAt: true, store: { select: { name: true, currency: true } } } });
    return toCsv(["Store", "Name", "Email", "Phone", "Orders", "Currency", "Total spent", "Customer since", "Last updated"], rows.map(item => [item.store.name, item.name, item.email, item.phone, item.orderCount, item.store.currency, item.totalSpentMinor / 100, item.createdAt, item.updatedAt]));
  }
  if (resource === "catalog") {
    const rows = await db.product.findMany({ where: { store: storeWhere }, orderBy: [{ store: { name: "asc" } }, { name: "asc" }], take: 50_000, select: { name: true, status: true, brand: true, productType: true, archivedAt: true, store: { select: { name: true, currency: true } }, variants: { orderBy: { createdAt: "asc" }, select: { sku: true, title: true, priceMinor: true, costMinor: true, active: true } } } });
    return toCsv(["Store", "Product", "Status", "Brand", "Type", "SKU", "Variant", "Currency", "Price", "Cost", "Variant active", "Archived"], rows.flatMap(product => product.variants.map(variant => [product.store.name, product.name, product.status, product.brand, product.productType, variant.sku, variant.title, product.store.currency, variant.priceMinor / 100, variant.costMinor === null ? "" : variant.costMinor / 100, variant.active, Boolean(product.archivedAt)])));
  }
  const rows = await db.inventoryItem.findMany({ where: { store: storeWhere }, orderBy: [{ store: { name: "asc" } }, { variant: { sku: "asc" } }], take: 50_000, select: { locationKey: true, onHand: true, reserved: true, incoming: true, reorderPoint: true, updatedAt: true, store: { select: { name: true } }, variant: { select: { sku: true, title: true, product: { select: { name: true } } } } } });
  return toCsv(["Store", "Product", "SKU", "Variant", "Location", "On hand", "Reserved", "Available", "Incoming", "Reorder point", "Updated at"], rows.map(item => [item.store.name, item.variant.product.name, item.variant.sku, item.variant.title, item.locationKey, item.onHand, item.reserved, Math.max(0, item.onHand - item.reserved), item.incoming, item.reorderPoint, item.updatedAt]));
}

async function recordExport(actorId: string, resource: Resource, range: string, storeWhere: StoreWhere) {
  const stores = await db.store.findMany({ where: storeWhere, select: { id: true, tenantId: true } });
  const tenants = new Map<string, number>();
  for (const store of stores) tenants.set(store.tenantId, (tenants.get(store.tenantId) ?? 0) + 1);
  if (!tenants.size) return;
  await db.auditLog.createMany({ data: [...tenants].map(([tenantId, storeCount]) => ({ tenantId, actorId, action: "data.exported", entityType: "Report", summary: `Exported ${resource} records`, changes: { resource, range, storeCount } })) });
}
