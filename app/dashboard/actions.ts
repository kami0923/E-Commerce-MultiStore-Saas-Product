"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePlatformAdmin, requireTenantPermission } from "@/data/auth";
import { canCreateStore } from "@/data/subscription-limits";
import { getRequestOrigin } from "@/lib/request-origin";
import { provisionBusiness } from "@/lib/business-provisioning";

export type CommerceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string[]>;
  invitationUrl?: string;
};

const vertical = z.enum(["CLOTHING", "SHOES", "JEWELLERY", "COSMETICS", "MULTI_CATEGORY"]);
const storefrontTheme = z.enum(["atelier", "market", "luxe"]);

const businessSchema = z.object({
  name: z.string().trim().min(2, "Enter a business name.").max(100),
  ownerEmail: z.email("Enter a valid owner email.").trim().toLowerCase(),
  countryCode: z.enum(["PK", "INTL"]),
  baseCurrency: z.enum(["PKR", "USD"]),
  defaultLocale: z.enum(["en", "ur"]),
  verticals: z.array(vertical).min(1, "Select at least one store vertical."),
});

const storeSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2, "Enter a store name.").max(100),
  vertical,
  currency: z.enum(["PKR", "USD"]),
  defaultLocale: z.enum(["en", "ur"]),
  themeKey: storefrontTheme,
});

const storeStatusSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED"]),
});

const archiveStoreSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().min(1),
  confirmation: z.string().trim().min(1),
});

export type StoreArchiveState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function slugify(value: string) {
  const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 52) || "store";
  return `${base}-${randomUUID().slice(0, 6)}`;
}

export async function createBusinessAction(_state: CommerceActionState, formData: FormData): Promise<CommerceActionState> {
  const actor = await requirePlatformAdmin();
  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    ownerEmail: formData.get("ownerEmail"),
    countryCode: formData.get("countryCode"),
    baseCurrency: formData.get("baseCurrency"),
    defaultLocale: formData.get("defaultLocale"),
    verticals: formData.getAll("verticals"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const { name, ownerEmail, countryCode, baseCurrency, defaultLocale, verticals } = parsed.data;
  const appUrl = await getRequestOrigin();
  try {
    const result = await provisionBusiness({ actor, appUrl, name, ownerEmail, countryCode, baseCurrency, defaultLocale, verticals });
    revalidatePath("/dashboard"); revalidatePath("/dashboard/businesses"); revalidatePath("/dashboard/stores");
    return { status: "success", message: `${name} was created and its owner invitation was queued by email.`, invitationUrl: result.invitationUrl };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The business could not be created. Please try again." };
  }
}

export async function createStoreAction(_state: CommerceActionState, formData: FormData): Promise<CommerceActionState> {
  const parsed = storeSchema.safeParse({
    tenantId: formData.get("tenantId"),
    name: formData.get("name"),
    vertical: formData.get("vertical"),
    currency: formData.get("currency"),
    defaultLocale: formData.get("defaultLocale"),
    themeKey: formData.get("themeKey"),
  });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const scope = await requireTenantPermission(parsed.data.tenantId, "stores.create");
  const capacity = await canCreateStore(parsed.data.tenantId);
  if (!capacity.allowed) return { status: "error", message: capacity.message };

  try {
    const store = await db.store.create({
      data: { ...parsed.data, slug: slugify(parsed.data.name), status: "ACTIVE", enabledLocales: ["en", "ur"] },
    });
    await db.auditLog.create({
      data: { tenantId: parsed.data.tenantId, storeId: store.id, actorId: scope.user.id, action: "store.created", entityType: "Store", entityId: store.id, summary: `Created store ${store.name}` },
    });
  } catch {
    return { status: "error", message: "The store could not be created." };
  }

  revalidatePath("/dashboard/stores");
  return { status: "success", message: `${parsed.data.name} was created with its public website ready.` };
}

export async function setStoreStatusAction(formData: FormData) {
  const parsed = storeStatusSchema.safeParse({
    tenantId: formData.get("tenantId"),
    storeId: formData.get("storeId"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid store status request.");

  const scope = await requireTenantPermission(parsed.data.tenantId, "stores.manage", parsed.data.storeId);
  const store = await db.store.findFirst({
    where: { id: parsed.data.storeId, tenantId: parsed.data.tenantId },
    select: { id: true, name: true, slug: true },
  });
  if (!store) throw new Error("Store not found.");

  await db.$transaction([
    db.store.update({ where: { id: store.id }, data: { status: parsed.data.status } }),
    db.auditLog.create({
      data: {
        tenantId: parsed.data.tenantId,
        storeId: store.id,
        actorId: scope.user.id,
        action: parsed.data.status === "ACTIVE" ? "store.published" : "store.paused",
        entityType: "Store",
        entityId: store.id,
        summary: `${parsed.data.status === "ACTIVE" ? "Published" : "Paused"} ${store.name}`,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stores");
  revalidatePath(`/store/${store.slug}`);
}

export async function archiveStoreAction(_state: StoreArchiveState, formData: FormData): Promise<StoreArchiveState> {
  const actor = await requirePlatformAdmin();
  const parsed = archiveStoreSchema.safeParse({
    tenantId: formData.get("tenantId"),
    storeId: formData.get("storeId"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return { status: "error", message: "Enter the exact store name to confirm archival." };

  const store = await db.store.findFirst({
    where: { id: parsed.data.storeId, tenantId: parsed.data.tenantId },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!store) return { status: "error", message: "Store not found." };
  if (store.status === "ARCHIVED") return { status: "error", message: "This store is already archived." };
  if (parsed.data.confirmation !== store.name) return { status: "error", message: `Type “${store.name}” exactly to confirm.` };

  const openOrders = await db.order.count({
    where: { storeId: store.id, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] } },
  });
  if (openOrders > 0) {
    return { status: "error", message: `Resolve or cancel ${openOrders} open order${openOrders === 1 ? "" : "s"} before archiving this store.` };
  }

  await db.$transaction([
    db.store.update({ where: { id: store.id }, data: { status: "ARCHIVED" } }),
    db.auditLog.create({
      data: {
        tenantId: parsed.data.tenantId,
        storeId: store.id,
        actorId: actor.id,
        action: "store.archived",
        entityType: "Store",
        entityId: store.id,
        summary: `Archived ${store.name} without deleting its history`,
        changes: { previousStatus: store.status, status: "ARCHIVED" },
      },
    }),
  ]);

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/store/${store.slug}`);
  return { status: "success", message: `${store.name} was archived safely.` };
}

export async function restoreArchivedStoreAction(formData: FormData) {
  const actor = await requirePlatformAdmin();
  const parsed = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1) }).parse({
    tenantId: formData.get("tenantId"),
    storeId: formData.get("storeId"),
  });
  const store = await db.store.findFirst({
    where: { id: parsed.storeId, tenantId: parsed.tenantId, status: "ARCHIVED" },
    select: { id: true, name: true, slug: true },
  });
  if (!store) throw new Error("Archived store not found.");

  await db.$transaction([
    db.store.update({ where: { id: store.id }, data: { status: "PAUSED" } }),
    db.auditLog.create({
      data: {
        tenantId: parsed.tenantId,
        storeId: store.id,
        actorId: actor.id,
        action: "store.restored",
        entityType: "Store",
        entityId: store.id,
        summary: `Restored ${store.name} as a paused store`,
        changes: { previousStatus: "ARCHIVED", status: "PAUSED" },
      },
    }),
  ]);

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/store/${store.slug}`);
}
