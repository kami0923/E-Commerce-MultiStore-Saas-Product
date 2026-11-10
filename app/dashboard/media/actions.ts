"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del as deleteBlob, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { db } from "@/lib/db";

export type MediaActionState = { status: "idle" | "success" | "error"; message?: string };
const allowedTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export async function uploadMediaAction(_state: MediaActionState, formData: FormData): Promise<MediaActionState> {
  const parsed = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1), altText: z.string().trim().max(160).optional() }).safeParse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId"), altText: formData.get("altText") || undefined });
  if (!parsed.success) return { status: "error", message: "Select a valid store before uploading." };
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) return { status: "error", message: "Choose at least one image." };
  if (files.length > 10) return { status: "error", message: "Upload up to 10 images at a time." };
  if (files.reduce((total, file) => total + file.size, 0) > 4 * 1024 * 1024) return { status: "error", message: "Upload batches must be 4 MB or smaller." };
  for (const file of files) {
    if (!allowedTypes[file.type]) return { status: "error", message: `${file.name} is not a supported JPG, PNG, WebP or GIF image.` };
    if (file.size > 8 * 1024 * 1024) return { status: "error", message: `${file.name} is larger than 8 MB.` };
  }

  const { tenantId, storeId, altText } = parsed.data;
  const scope = await requireTenantPermission(tenantId, "products.manage", storeId);
  const store = await db.store.findFirst({ where: { id: storeId, tenantId }, select: { id: true, name: true } });
  if (!store) return { status: "error", message: "The selected store is unavailable." };
  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (process.env.VERCEL && !useBlob) return { status: "error", message: "Connect a Vercel Blob store before uploading production images." };
  const directory = path.join(process.cwd(), "public", "uploads", tenantId, storeId);
  if (!useBlob) await mkdir(directory, { recursive: true });
  const written: { kind: "blob" | "file"; location: string }[] = [];

  try {
    await db.$transaction(async tx => {
      for (const file of files) {
        const filename = `${randomUUID()}.${allowedTypes[file.type]}`;
        let url: string;
        if (useBlob) {
          const blob = await put(`uploads/${tenantId}/${storeId}/${filename}`, file, { access: "public", addRandomSuffix: false, contentType: file.type });
          url = blob.url;
          written.push({ kind: "blob", location: blob.url });
        } else {
          const diskPath = path.join(directory, filename);
          await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
          url = `/uploads/${tenantId}/${storeId}/${filename}`;
          written.push({ kind: "file", location: diskPath });
        }
        await tx.mediaAsset.create({ data: { tenantId, storeId, filename, originalName: file.name.slice(0, 180), mimeType: file.type, sizeBytes: file.size, url, altText: altText || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") } });
      }
      await tx.auditLog.create({ data: { tenantId, storeId, actorId: scope.user.id, action: "media.uploaded", entityType: "MediaAsset", summary: `Uploaded ${files.length} image${files.length === 1 ? "" : "s"} to ${store.name}` } });
    });
  } catch {
    await Promise.all(written.map(item => item.kind === "blob" ? deleteBlob(item.location).catch(() => undefined) : unlink(item.location).catch(() => undefined)));
    return { status: "error", message: "The images could not be saved. No partial upload was kept." };
  }

  revalidatePath("/dashboard/media"); revalidatePath("/dashboard/catalog");
  return { status: "success", message: `${files.length} image${files.length === 1 ? "" : "s"} added to the media library.` };
}
