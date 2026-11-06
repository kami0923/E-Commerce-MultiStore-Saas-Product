import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected", integrations: { email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL), whatsappLinking: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_WHATSAPP_CONFIG_ID && process.env.APP_ENCRYPTION_KEY), whatsappFallback: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID), payfast: Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_SECURED_KEY), stripe: Boolean(process.env.STRIPE_SECRET_KEY) }, responseMs: Date.now() - startedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ status: "error", database: "unavailable", responseMs: Date.now() - startedAt }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
