import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;
  if (segments.length !== 3) return notFound();

  const [tenantId, storeId, filename] = segments;
  if (!tenantId || !storeId || !filename || path.basename(filename) !== filename) return notFound();

  const asset = await db.mediaAsset.findFirst({
    where: { tenantId, storeId, filename },
    select: { tenantId: true, storeId: true, filename: true, mimeType: true },
  });
  if (!asset) return notFound();

  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", asset.tenantId, asset.storeId, asset.filename));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}

function notFound() {
  return new Response("Image not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}
