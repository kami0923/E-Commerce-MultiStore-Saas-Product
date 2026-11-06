import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getAnalyticsWorkspace() {
  const scope = await getAuthorizedStoreScope("analytics.view");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const stores = await db.store.findMany({ where: storeWhere, orderBy: { createdAt: "asc" }, select: { id: true, name: true, currency: true } });
  const currency = stores[0]?.currency ?? "PKR";
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - 11);
  const [orders, inventory] = await Promise.all([
    db.order.findMany({ where: { store: storeWhere, currency, placedAt: { gte: start } }, orderBy: { placedAt: "asc" }, select: { id: true, status: true, totalMinor: true, placedAt: true, items: { select: { productName: true, quantity: true, totalMinor: true } } } }),
    db.inventoryItem.findMany({ where: { store: storeWhere }, select: { onHand: true, reserved: true, reorderPoint: true } }),
  ]);
  const revenueOrders = orders.filter(order => !["CANCELLED", "REFUNDED"].includes(order.status));
  const totalSalesMinor = revenueOrders.reduce((sum, order) => sum + order.totalMinor, 0);
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const monthOrders = revenueOrders.filter(order => order.placedAt.getFullYear() === date.getFullYear() && order.placedAt.getMonth() === date.getMonth());
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString("en", { month: "short" }), valueMinor: monthOrders.reduce((sum, order) => sum + order.totalMinor, 0), orders: monthOrders.length };
  });
  const current = monthly.at(-1)?.valueMinor ?? 0;
  const previous = monthly.at(-2)?.valueMinor ?? 0;
  const growth = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(status => ({ status, count: orders.filter(order => order.status === status).length }));
  const products = new Map<string, { quantity: number; revenueMinor: number }>();
  for (const order of revenueOrders) for (const item of order.items) { const existing = products.get(item.productName) ?? { quantity: 0, revenueMinor: 0 }; existing.quantity += item.quantity; existing.revenueMinor += item.totalMinor; products.set(item.productName, existing); }
  const topProducts = [...products.entries()].map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenueMinor - a.revenueMinor).slice(0, 5);
  const availableStock = inventory.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0);
  const lowStock = inventory.filter(item => item.onHand - item.reserved <= item.reorderPoint).length;
  return { currency, stores: stores.length, totalSalesMinor, orderCount: orders.length, averageOrderMinor: revenueOrders.length ? Math.round(totalSalesMinor / revenueOrders.length) : 0, delivered: statuses.find(item => item.status === "DELIVERED")?.count ?? 0, growth, monthly, statuses, topProducts, availableStock, lowStock };
}
