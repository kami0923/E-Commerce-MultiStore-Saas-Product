import type { MembershipRole } from "@/generated/prisma/client";

export const permissions = [
  "tenant.view",
  "tenant.manage",
  "stores.view",
  "stores.create",
  "stores.manage",
  "products.view",
  "products.manage",
  "inventory.view",
  "inventory.adjust",
  "orders.view",
  "orders.manage",
  "orders.refund",
  "customers.view",
  "customers.export",
  "finance.view",
  "analytics.view",
  "staff.view",
  "staff.manage",
  "audit.view",
] as const;

export type Permission = (typeof permissions)[number];

const all: Permission[] = [...permissions];
const rolePermissions: Record<MembershipRole, Permission[]> = {
  OWNER: all,
  ADMIN: all.filter((permission) => permission !== "tenant.manage"),
  MANAGER: ["tenant.view", "stores.view", "stores.manage", "products.view", "products.manage", "inventory.view", "inventory.adjust", "orders.view", "orders.manage", "customers.view", "analytics.view", "staff.view"],
  CATALOG_MANAGER: ["tenant.view", "stores.view", "products.view", "products.manage", "inventory.view"],
  INVENTORY_MANAGER: ["tenant.view", "stores.view", "products.view", "inventory.view", "inventory.adjust"],
  ORDER_MANAGER: ["tenant.view", "stores.view", "orders.view", "orders.manage", "orders.refund", "customers.view"],
  MARKETING_MANAGER: ["tenant.view", "stores.view", "products.view", "products.manage", "customers.view", "analytics.view"],
  ANALYST: ["tenant.view", "stores.view", "products.view", "inventory.view", "orders.view", "customers.view", "finance.view", "analytics.view"],
  SUPPORT: ["tenant.view", "stores.view", "products.view", "inventory.view", "orders.view", "customers.view"],
  VIEWER: ["tenant.view", "stores.view", "products.view", "inventory.view", "orders.view", "analytics.view"],
};

export function roleCan(role: MembershipRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function permissionsForRole(role: MembershipRole) {
  return rolePermissions[role];
}
