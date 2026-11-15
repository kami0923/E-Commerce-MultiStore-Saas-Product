import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";
import { grossProfit, reportStart, type ReportRange } from "@/lib/reporting";

type RevenueOrder = {
  status: string;
  subtotalMinor: number;
  discountMinor: number;
  totalMinor: number;
  placedAt: Date;
  items: { productName: string; quantity: number; totalMinor: number; variant: { costMinor: number | null } | null }[];
};

export async function getAnalyticsWorkspace(range: ReportRange = "12m") {
  const scope = await getAuthorizedStoreScope("analytics.view");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const stores = await db.store.findMany({ where: storeWhere, orderBy: { createdAt: "asc" }, select: { id: true, name: true, currency: true } });
  const currency = stores[0]?.currency ?? "PKR";
  const start = reportStart(range);
  const [orders, inventory] = await Promise.all([
    db.order.findMany({
      where: { store: storeWhere, currency, ...(start ? { placedAt: { gte: start } } : {}) },
      orderBy: { placedAt: "asc" },
      select: { id: true, status: true, subtotalMinor: true, discountMinor: true, totalMinor: true, placedAt: true, items: { select: { productName: true, quantity: true, totalMinor: true, variant: { select: { costMinor: true } } } } },
    }),
    db.inventoryItem.findMany({ where: { store: storeWhere }, select: { onHand: true, reserved: true, reorderPoint: true } }),
  ]);
  const revenueOrders = orders.filter(order => !["CANCELLED", "REFUNDED"].includes(order.status));
  const totalSalesMinor = revenueOrders.reduce((sum, order) => sum + order.totalMinor, 0);
  const netMerchandiseMinor = revenueOrders.reduce((sum, order) => sum + order.subtotalMinor - order.discountMinor, 0);
  const costMinor = revenueOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.variant?.costMinor ?? 0) * item.quantity, 0), 0);
  const unitsSold = revenueOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const costedUnits = revenueOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.variant?.costMinor === null || !item.variant ? 0 : item.quantity), 0), 0);
  const { profitMinor, marginPercent } = grossProfit(netMerchandiseMinor, costMinor);
  const trend = buildTrend(revenueOrders, range, start);
  const current = trend.at(-1)?.valueMinor ?? 0;
  const previous = trend.at(-2)?.valueMinor ?? 0;
  const growth = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(status => ({ status, count: orders.filter(order => order.status === status).length }));
  const products = new Map<string, { quantity: number; revenueMinor: number }>();
  for (const order of revenueOrders) for (const item of order.items) { const existing = products.get(item.productName) ?? { quantity: 0, revenueMinor: 0 }; existing.quantity += item.quantity; existing.revenueMinor += item.totalMinor; products.set(item.productName, existing); }
  const topProducts = [...products.entries()].map(([name, values]) => ({ name, ...values })).sort((a, b) => b.revenueMinor - a.revenueMinor).slice(0, 5);
  const availableStock = inventory.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0);
  const lowStock = inventory.filter(item => item.onHand - item.reserved <= item.reorderPoint).length;
  return { range, currency, stores: stores.length, totalSalesMinor, netMerchandiseMinor, costMinor, profitMinor, marginPercent, costCoveragePercent: unitsSold ? Math.round(costedUnits / unitsSold * 100) : 100, orderCount: orders.length, averageOrderMinor: revenueOrders.length ? Math.round(totalSalesMinor / revenueOrders.length) : 0, delivered: statuses.find(item => item.status === "DELIVERED")?.count ?? 0, growth, trend, statuses, topProducts, availableStock, lowStock };
}

function buildTrend(orders: RevenueOrder[], range: ReportRange, start?: Date) {
  if (range === "12m") {
    const anchor = start ?? new Date();
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(anchor.getFullYear(), anchor.getMonth() + index, 1);
      const matching = orders.filter(order => order.placedAt.getFullYear() === date.getFullYear() && order.placedAt.getMonth() === date.getMonth());
      return bucket(`${date.getFullYear()}-${date.getMonth()}`, date.toLocaleDateString("en", { month: "short" }), matching);
    });
  }
  if (range === "30d" || range === "90d") {
    const anchor = start ?? new Date();
    const size = range === "30d" ? 5 : 15;
    return Array.from({ length: 6 }, (_, index) => {
      const from = new Date(anchor); from.setDate(from.getDate() + index * size);
      const to = new Date(from); to.setDate(to.getDate() + size);
      const matching = orders.filter(order => order.placedAt >= from && order.placedAt < to);
      return bucket(from.toISOString().slice(0, 10), from.toLocaleDateString("en", { day: "numeric", month: "short" }), matching);
    });
  }
  const years = [...new Set(orders.map(order => order.placedAt.getFullYear()))].sort();
  if (!years.length) years.push(new Date().getFullYear());
  return years.map(year => bucket(String(year), String(year), orders.filter(order => order.placedAt.getFullYear() === year)));
}

function bucket(key: string, label: string, orders: RevenueOrder[]) {
  return { key, label, valueMinor: orders.reduce((sum, order) => sum + order.totalMinor, 0), orders: orders.length };
}
