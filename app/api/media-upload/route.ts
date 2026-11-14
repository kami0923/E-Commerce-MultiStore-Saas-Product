import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { canStoreMedia } from "@/data/subscription-limits";
import { MEDIA_ALLOWED_TYPES, MEDIA_MAX_FILE_BYTES } from "@/lib/media-limits";

export const runtime = "nodejs";

const payloadSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = payloadSchema.parse(JSON.parse(clientPayload || "{}"));
        await requireTenantPermission(payload.tenantId, "products.manage", payload.storeId);
        const capacity = await canStoreMedia(payload.tenantId, 1);
        if (!capacity.allowed) throw new Error(capacity.message);

        const expectedPrefix = `tenants/${payload.tenantId}/stores/${payload.storeId}/`;
        if (!pathname.startsWith(expectedPrefix) || pathname.slice(expectedPrefix.length).includes("/")) {
          throw new Error("The upload destination is not authorized for this store.");
        }

        return {
          allowedContentTypes: [...MEDIA_ALLOWED_TYPES],
          maximumSizeInBytes: MEDIA_MAX_FILE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 31_536_000,
          tokenPayload: JSON.stringify(payload),
        };
      },
    });

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Blob upload authorization failed", error);
    return Response.json(
      { error: "This image upload could not be authorized." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
