export type MediaStorageProvider = "cloudflare-r2" | "vercel-blob" | "local";

type StorageEnvironment = Record<string, string | undefined>;

export type MediaStorageConfiguration = {
  provider: MediaStorageProvider | null;
  ready: boolean;
  missing: string[];
  message: string;
};

export const R2_VARIABLES = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const;

export function resolveMediaStorageConfiguration(
  environment: StorageEnvironment = process.env,
): MediaStorageConfiguration {
  const requested = environment.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase();
  const missingR2 = R2_VARIABLES.filter((name) => !environment[name]?.trim());
  const r2Ready = missingR2.length === 0;
  const blobReady = Boolean(environment.BLOB_READ_WRITE_TOKEN?.trim());
  const localAllowed = environment.NODE_ENV !== "production" && !environment.VERCEL;

  if (requested === "r2" || requested === "cloudflare-r2") {
    return r2Ready
      ? { provider: "cloudflare-r2", ready: true, missing: [], message: "Cloudflare R2 is ready." }
      : {
          provider: "cloudflare-r2",
          ready: false,
          missing: missingR2,
          message: `Cloudflare R2 is missing ${missingR2.join(", ")}.`,
        };
  }

  if (requested === "vercel-blob") {
    return blobReady
      ? { provider: "vercel-blob", ready: true, missing: [], message: "Vercel Blob is ready." }
      : {
          provider: "vercel-blob",
          ready: false,
          missing: ["BLOB_READ_WRITE_TOKEN"],
          message: "Vercel Blob is missing BLOB_READ_WRITE_TOKEN.",
        };
  }

  if (requested === "local") {
    return localAllowed
      ? { provider: "local", ready: true, missing: [], message: "Local development storage is ready." }
      : {
          provider: "local",
          ready: false,
          missing: [],
          message: "Local media storage is disabled in production.",
        };
  }

  if (requested) {
    return {
      provider: null,
      ready: false,
      missing: [],
      message: "MEDIA_STORAGE_PROVIDER must be r2, vercel-blob, or local.",
    };
  }

  if (r2Ready) {
    return { provider: "cloudflare-r2", ready: true, missing: [], message: "Cloudflare R2 is ready." };
  }
  if (blobReady) {
    return { provider: "vercel-blob", ready: true, missing: [], message: "Vercel Blob is ready." };
  }
  if (localAllowed) {
    return { provider: "local", ready: true, missing: [], message: "Local development storage is ready." };
  }

  return {
    provider: null,
    ready: false,
    missing: R2_VARIABLES.slice(),
    message: "Configure Cloudflare R2 or Vercel Blob before uploading production images.",
  };
}
