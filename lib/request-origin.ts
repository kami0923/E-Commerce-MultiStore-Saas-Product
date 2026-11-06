import "server-only";

import { headers } from "next/headers";

function validHttpOrigin(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const browserOrigin = validHttpOrigin(requestHeaders.get("origin"));
  if (browserOrigin) return browserOrigin;

  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))
    ?.split(",")[0]
    .trim();
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const forwardedOrigin = validHttpOrigin(host ? `${protocol ?? "http"}://${host}` : null);

  return forwardedOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
