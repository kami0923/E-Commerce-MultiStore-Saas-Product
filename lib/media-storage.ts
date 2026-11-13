import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { del as deleteBlob, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  R2_VARIABLES,
  resolveMediaStorageConfiguration,
  type MediaStorageProvider,
} from "@/lib/media-storage-config";

export { resolveMediaStorageConfiguration } from "@/lib/media-storage-config";

export type StoredMediaObject = {
  provider: MediaStorageProvider;
  url: string;
  cleanupReference: string;
};

type StoreMediaInput = {
  tenantId: string;
  storeId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
};

export async function storeMediaObject(input: StoreMediaInput): Promise<StoredMediaObject> {
  const configuration = resolveMediaStorageConfiguration();
  if (!configuration.ready || !configuration.provider) {
    throw new Error(configuration.message);
  }

  const objectKey = buildObjectKey(input);

  if (configuration.provider === "cloudflare-r2") {
    const client = createR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: requiredEnvironment("R2_BUCKET_NAME"),
        Key: objectKey,
        Body: input.bytes,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return {
      provider: configuration.provider,
      url: joinPublicUrl(requiredEnvironment("R2_PUBLIC_BASE_URL"), objectKey),
      cleanupReference: objectKey,
    };
  }

  if (configuration.provider === "vercel-blob") {
    const blob = await put(objectKey, input.bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: input.contentType,
    });
    return { provider: configuration.provider, url: blob.url, cleanupReference: blob.url };
  }

  const diskPath = path.join(
    process.cwd(),
    "public",
    "uploads",
    input.tenantId,
    input.storeId,
    input.filename,
  );
  await mkdir(path.dirname(diskPath), { recursive: true });
  await writeFile(diskPath, input.bytes);

  return {
    provider: configuration.provider,
    url: `/uploads/${input.tenantId}/${input.storeId}/${input.filename}`,
    cleanupReference: diskPath,
  };
}

export async function deleteStoredMediaObject(object: StoredMediaObject): Promise<void> {
  if (object.provider === "cloudflare-r2") {
    await createR2Client().send(
      new DeleteObjectCommand({
        Bucket: requiredEnvironment("R2_BUCKET_NAME"),
        Key: object.cleanupReference,
      }),
    );
    return;
  }

  if (object.provider === "vercel-blob") {
    await deleteBlob(object.cleanupReference);
    return;
  }

  await unlink(object.cleanupReference);
}

function buildObjectKey(input: Pick<StoreMediaInput, "tenantId" | "storeId" | "filename">) {
  return `tenants/${input.tenantId}/stores/${input.storeId}/${input.filename}`;
}

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${requiredEnvironment("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnvironment("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnvironment("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function requiredEnvironment(name: (typeof R2_VARIABLES)[number]) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function joinPublicUrl(baseUrl: string, objectKey: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encodedKey}`;
}
