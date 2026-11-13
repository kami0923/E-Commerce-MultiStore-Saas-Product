import assert from "node:assert/strict";
import test from "node:test";
import { resolveMediaStorageConfiguration } from "../lib/media-storage-config.ts";

const completeR2 = {
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "access",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_NAME: "bucket",
  R2_PUBLIC_BASE_URL: "https://media.example.com",
};

test("Cloudflare R2 is preferred when its configuration is complete", () => {
  const result = resolveMediaStorageConfiguration({ NODE_ENV: "production", ...completeR2 });
  assert.equal(result.ready, true);
  assert.equal(result.provider, "cloudflare-r2");
});

test("an explicitly selected R2 provider fails closed when a secret is missing", () => {
  const { R2_SECRET_ACCESS_KEY: _secret, ...incompleteR2 } = completeR2;
  const result = resolveMediaStorageConfiguration({
    NODE_ENV: "production",
    MEDIA_STORAGE_PROVIDER: "r2",
    ...incompleteR2,
  });
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing, ["R2_SECRET_ACCESS_KEY"]);
});

test("Vercel Blob remains a supported production fallback", () => {
  const result = resolveMediaStorageConfiguration({
    NODE_ENV: "production",
    BLOB_READ_WRITE_TOKEN: "token",
  });
  assert.equal(result.ready, true);
  assert.equal(result.provider, "vercel-blob");
});

test("local storage is allowed in development but rejected in production", () => {
  assert.equal(resolveMediaStorageConfiguration({ NODE_ENV: "development" }).provider, "local");
  const production = resolveMediaStorageConfiguration({
    NODE_ENV: "production",
    MEDIA_STORAGE_PROVIDER: "local",
  });
  assert.equal(production.ready, false);
  assert.equal(production.provider, "local");
});
