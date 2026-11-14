import "server-only";

import { decryptSecret } from "@/lib/crypto-secrets";
import { db } from "@/lib/db";
import { buildEmail } from "@/lib/email-templates";

type Payload = Record<string, unknown>;
type DeliveryResult = { sent: boolean; configured: boolean; error?: string; providerMessageId?: string };
type StoreWhatsAppConnection = { phoneNumberId: string | null; tokenCiphertext: string | null; tokenIv: string | null; tokenTag: string | null; status: string } | null;

function asPayload(value: unknown): Payload { return value && typeof value === "object" && !Array.isArray(value) ? value as Payload : {}; }
function retryAt(attempt: number) { return new Date(Date.now() + Math.min(60, 2 ** Math.max(0, attempt - 1)) * 60_000); }

async function sendEmail(id: string, recipient: string, template: string, payload: Payload, brand: { storeName: string; storeSlug: string; businessName: string; locale: string }): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, configured: false, error: "Email delivery is waiting for RESEND_API_KEY and RESEND_FROM_EMAIL." };
  const content = buildEmail(template, payload, brand);
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `meridian/${id}` }, body: JSON.stringify({ from, to: [recipient], subject: content.subject, html: content.html }) });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) return { sent: false, configured: true, error: result.message || `Resend returned ${response.status}.` };
  return { sent: true, configured: true, providerMessageId: result.id };
}

function storeCredentials(connection: StoreWhatsAppConnection) {
  if (connection?.status !== "CONNECTED" || !connection.phoneNumberId || !connection.tokenCiphertext || !connection.tokenIv || !connection.tokenTag) return null;
  return { phoneId: connection.phoneNumberId, token: decryptSecret({ ciphertext: connection.tokenCiphertext, iv: connection.tokenIv, tag: connection.tokenTag }) };
}

async function sendWhatsApp(recipient: string, template: string, payload: Payload, connection: StoreWhatsAppConnection): Promise<DeliveryResult> {
  const merchant = storeCredentials(connection);
  const token = merchant?.token || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = merchant?.phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
  if (!token || !phoneId) return { sent: false, configured: false, error: "WhatsApp Cloud API is not configured." };
  const templateName = process.env[`WHATSAPP_TEMPLATE_${template.toUpperCase()}`] || template;
  const orderNumber = String(payload.orderNumber ?? "");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: recipient.replace(/\D/g, ""), type: "template", template: { name: templateName, language: { code: "en" }, components: orderNumber ? [{ type: "body", parameters: [{ type: "text", text: orderNumber }] }] : [] } }) });
  const result = await response.json().catch(() => ({})) as { messages?: { id?: string }[]; error?: { message?: string } };
  if (!response.ok) return { sent: false, configured: true, error: result.error?.message || `WhatsApp returned ${response.status}.` };
  return { sent: true, configured: true, providerMessageId: result.messages?.[0]?.id };
}

export async function dispatchPendingNotifications(limit = 25) {
  const now = new Date();
  await db.notificationOutbox.updateMany({ where: { status: "PROCESSING", lockedAt: { lt: new Date(Date.now() - 10 * 60_000) } }, data: { status: "FAILED", lockedAt: null, nextAttemptAt: now, lastError: "A previous delivery attempt timed out and was safely released." } });
  const candidates = await db.notificationOutbox.findMany({ where: { status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: now }, attempts: { lt: 5 } }, orderBy: { createdAt: "asc" }, take: Math.max(1, Math.min(limit, 100)), select: { id: true } });
  let sent = 0, failed = 0, waitingForConfiguration = 0;
  for (const candidate of candidates) {
    const claimed = await db.notificationOutbox.updateMany({ where: { id: candidate.id, status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: now }, attempts: { lt: 5 } }, data: { status: "PROCESSING", lockedAt: new Date(), lastAttemptAt: new Date() } });
    if (claimed.count !== 1) continue;
    const notification = await db.notificationOutbox.findUnique({ where: { id: candidate.id }, include: { store: { select: { name: true, slug: true, defaultLocale: true, tenant: { select: { name: true } }, whatsappConnection: { select: { phoneNumberId: true, tokenCiphertext: true, tokenIv: true, tokenTag: true, status: true } } } } } });
    if (!notification) continue;
    try {
      const payload = asPayload(notification.payload);
      const result = notification.channel === "EMAIL"
        ? await sendEmail(notification.id, notification.recipient, notification.template, payload, { storeName: notification.store.name, storeSlug: notification.store.slug, businessName: notification.store.tenant.name, locale: notification.store.defaultLocale })
        : await sendWhatsApp(notification.recipient, notification.template, payload, notification.store.whatsappConnection);
      if (!result.configured) {
        await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "PENDING", lockedAt: null, lastError: result.error, nextAttemptAt: new Date(Date.now() + 60 * 60_000) } });
        waitingForConfiguration++;
      } else if (result.sent) {
        await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date(), lockedAt: null, lastError: null, providerMessageId: result.providerMessageId ?? null } });
        sent++;
      } else {
        const attempts = notification.attempts + 1;
        await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "FAILED", attempts, lockedAt: null, lastError: String(result.error || "Provider request failed.").slice(0, 500), nextAttemptAt: retryAt(attempts) } });
        failed++;
      }
    } catch (error) {
      const attempts = notification.attempts + 1;
      await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "FAILED", attempts, lockedAt: null, lastError: error instanceof Error ? error.message.slice(0, 500) : "Provider request failed.", nextAttemptAt: retryAt(attempts) } });
      failed++;
    }
  }
  return { processed: candidates.length, sent, failed, waitingForConfiguration };
}
