export const MEDIA_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MEDIA_MAX_FILES_PER_BATCH = 20;
export const MEDIA_MAX_FILE_BYTES = 12 * 1024 * 1024;
export const MEDIA_MAX_DIRECT_BATCH_BYTES = 120 * 1024 * 1024;
export const MEDIA_MAX_SERVER_BATCH_BYTES = 4 * 1024 * 1024;

export const MEDIA_EXTENSION_BY_TYPE: Record<(typeof MEDIA_ALLOWED_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
