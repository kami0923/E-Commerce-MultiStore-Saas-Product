"use server";

import { randomUUID } from "node:crypto";
import { del as deleteBlob, head } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";
import {
  deleteStoredMediaObject,
  resolveMediaStorageConfiguration,
  storeMediaObject,
  type StoredMediaObject,
} from "@/lib/media-storage";
import {
  MEDIA_ALLOWED_TYPES,
  MEDIA_EXTENSION_BY_TYPE,
  MEDIA_MAX_FILE_BYTES,
  MEDIA_MAX_FILES_PER_BATCH,
  MEDIA_MAX_SERVER_BATCH_BYTES,
} from "@/lib/media-limits";

export type MediaActionState = { status: "idle" | "success" | "error"; message?: string };
const allowedTypes = new Set<string>(MEDIA_ALLOWED_TYPES);

export async function uploadMediaAction(_state: MediaActionState, formData: FormData): Promise<MediaActionState> {
  const parsed = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1), altText: z.string().trim().max(160).optional() }).safeParse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), altText: formData.get("altText") || undefined });
  if (!parsed.success) return { status: "error", message: "Select a valid store before uploading." };
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) return { status: "error", message: "Choose at least one image." };
  if (files.length > MEDIA_MAX_FILES_PER_BATCH) return { status: "error", message: `Upload up to ${MEDIA_MAX_FILES_PER_BATCH} images at a time.` };
  if (files.reduce((total, file) => total + file.size, 0) > MEDIA_MAX_SERVER_BATCH_BYTES) return { status: "error", message: "Local uploads must be 4 MB or smaller. Production Vercel Blob uploads support larger batches." };
  for (const file of files) {
    if (!allowedTypes.has(file.type)) return { status: "error", message: `${file.name} is not a supported JPG, PNG, WebP or GIF image.` };
    if (file.size > MEDIA_MAX_FILE_BYTES) return { status: "error", message: `${file.name} is larger than 12 MB.` };
  }

  const { tenantId, storeId, altText } = parsed.data;
  const scope = await requireTenantPermission(tenantId, "products.manage", storeId);
  const store = await db.store.findFirst({ where: { id: storeId, tenantId }, select: { id: true, name: true } });
  if (!store) return { status: "error", message: "The selected store is unavailable." };
  const storage = resolveMediaStorageConfiguration();
  if (!storage.ready) return { status: "error", message: storage.message };
  const written: StoredMediaObject[] = [];

  try {
    await db.$transaction(async tx => {
      for (const file of files) {
        const filename = `${randomUUID()}.${MEDIA_EXTENSION_BY_TYPE[file.type as keyof typeof MEDIA_EXTENSION_BY_TYPE]}`;
        const stored = await storeMediaObject({ tenantId, storeId, filename, contentType: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
        written.push(stored);
        await tx.mediaAsset.create({ data: { tenantId, storeId, filename, originalName: file.name.slice(0, 180), mimeType: file.type, sizeBytes: file.size, url: stored.url, altText: altText || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") } });
      }
      await tx.auditLog.create({ data: { tenantId, storeId, actorId: scope.user.id, action: "media.uploaded", entityType: "MediaAsset", summary: `Uploaded ${files.length} image${files.length === 1 ? "" : "s"} to ${store.name}` } });
    });
  } catch {
    await Promise.all(written.map(item => deleteStoredMediaObject(item).catch(() => undefined)));
    return { status: "error", message: "The images could not be saved. No partial upload was kept." };
  }

  revalidatePath("/dashboard/media"); revalidatePath("/dashboard/catalog");
  return { status: "success", message: `${files.length} image${files.length === 1 ? "" : "s"} added to the media library.` };
}

const registeredBlobSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().min(1),
  altText: z.string().trim().max(160).optional(),
  assets: z.array(z.object({
    url: z.string().url(),
    pathname: z.string().min(1),
    originalName: z.string().min(1).max(180),
  })).min(1).max(MEDIA_MAX_FILES_PER_BATCH),
});

export async function registerBlobMediaBatchAction(input: unknown): Promise<MediaActionState> {
  const parsed = registeredBlobSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "The uploaded image details are invalid." };

  const { tenantId, storeId, altText, assets } = parsed.data;
  const storage = resolveMediaStorageConfiguration();
  if (!storage.ready || storage.provider !== "vercel-blob") {
    return { status: "error", message: "Vercel Blob is not the active media provider." };
  }

  const scope = await requireTenantPermission(tenantId, "products.manage", storeId);
  const store = await db.store.findFirst({ where: { id: storeId, tenantId }, select: { id: true, name: true } });
  if (!store) return { status: "error", message: "The selected store is unavailable." };

  const prefix = `tenants/${tenantId}/stores/${storeId}/`;
  const verified: { url: string; pathname: string; filename: string; originalName: string; mimeType: string; sizeBytes: number }[] = [];

  try {
    for (const asset of assets) {
      if (!asset.pathname.startsWith(prefix) || asset.pathname.slice(prefix.length).includes("/")) throw new Error("Unexpected Blob pathname.");
      const metadata = await head(asset.url);
      if (metadata.url !== asset.url || metadata.pathname !== asset.pathname) throw new Error("Blob metadata mismatch.");
      if (!allowedTypes.has(metadata.contentType) || metadata.size > MEDIA_MAX_FILE_BYTES) throw new Error("Blob type or size is invalid.");
      const filename = metadata.pathname.slice(prefix.length);
      if (!filename) throw new Error("Blob filename is missing.");
      verified.push({ url: metadata.url, pathname: metadata.pathname, filename, originalName: asset.originalName, mimeType: metadata.contentType, sizeBytes: metadata.size });
    }

    await db.$transaction(async tx => {
      for (const asset of verified) {
        await tx.mediaAsset.create({ data: { tenantId, storeId, filename: asset.filename, originalName: asset.originalName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, url: asset.url, altText: altText || asset.originalName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") } });
      }
      await tx.auditLog.create({ data: { tenantId, storeId, actorId: scope.user.id, action: "media.uploaded", entityType: "MediaAsset", summary: `Uploaded ${verified.length} image${verified.length === 1 ? "" : "s"} to ${store.name}` } });
    });
  } catch {
    await Promise.all(verified.map(asset => deleteBlob(asset.url).catch(() => undefined)));
    return { status: "error", message: "The images could not be registered. No verified partial upload was kept." };
  }

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/catalog");
  return { status: "success", message: `${verified.length} image${verified.length === 1 ? "" : "s"} added to the media library.` };
}
