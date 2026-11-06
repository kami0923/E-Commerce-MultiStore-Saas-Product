import "server-only";

import { decryptSecret } from "@/lib/crypto-secrets";
import { db } from "@/lib/db";

type Payload = Record<string, unknown>;

function asPayload(value: unknown): Payload { return value && typeof value === "object" && !Array.isArray(value) ? value as Payload : {}; }
function escapeHtml(value: unknown) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }

function emailContent(template: string, payload: Payload) {
  const order = escapeHtml(payload.orderNumber);
  if (template === "order_confirmation") return { subject: `Order ${order} confirmed`, html: `<h1>Thank you for your order</h1><p>Your order <strong>${order}</strong> has been received.</p>` };
  if (template === "order_status") return { subject: `Order ${order}: ${escapeHtml(payload.status)}`, html: `<h1>Order update</h1><p>Your order <strong>${order}</strong> is now <strong>${escapeHtml(payload.status)}</strong>.</p>` };
  if (template === "return_requested") return { subject: `Return request received for ${order}`, html: `<h1>Return request received</h1><p>We received your request for order <strong>${order}</strong>.</p>` };
  return { subject: `Return update for ${order}`, html: `<h1>Return update</h1><p>Your return for <strong>${order}</strong> is now <strong>${escapeHtml(payload.returnStatus)}</strong>.</p>` };
}

async function sendEmail(id: string, recipient: string, template: string, payload: Payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, configured: false, error: "Resend is not configured." };
  const content = emailContent(template, payload);
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `meridian/${id}` }, body: JSON.stringify({ from, to: [recipient], subject: content.subject, html: content.html }) });
  if (!response.ok) return { sent: false, configured: true, error: `Resend returned ${response.status}.` };
  return { sent: true, configured: true };
}

type StoreWhatsAppConnection = { phoneNumberId: string | null; tokenCiphertext: string | null; tokenIv: string | null; tokenTag: string | null; status: string } | null;

function storeCredentials(connection: StoreWhatsAppConnection) {
  if (connection?.status !== "CONNECTED" || !connection.phoneNumberId || !connection.tokenCiphertext || !connection.tokenIv || !connection.tokenTag) return null;
  return { phoneId: connection.phoneNumberId, token: decryptSecret({ ciphertext: connection.tokenCiphertext, iv: connection.tokenIv, tag: connection.tokenTag }) };
}

async function sendWhatsApp(recipient: string, template: string, payload: Payload, connection: StoreWhatsAppConnection) {
  const merchant = storeCredentials(connection);
  const token = merchant?.token || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = merchant?.phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
  if (!token || !phoneId) return { sent: false, configured: false, error: "WhatsApp Cloud API is not configured." };
  const templateName = process.env[`WHATSAPP_TEMPLATE_${template.toUpperCase()}`] || template;
  const orderNumber = String(payload.orderNumber ?? "");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: recipient.replace(/\D/g, ""), type: "template", template: { name: templateName, language: { code: "en" }, components: orderNumber ? [{ type: "body", parameters: [{ type: "text", text: orderNumber }] }] : [] } }) });
  if (!response.ok) return { sent: false, configured: true, error: `WhatsApp returned ${response.status}.` };
  return { sent: true, configured: true };
}

export async function dispatchPendingNotifications(limit = 25) {
  const pending = await db.notificationOutbox.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: Math.max(1, Math.min(limit, 100)), include: { store: { select: { whatsappConnection: { select: { phoneNumberId: true, tokenCiphertext: true, tokenIv: true, tokenTag: true, status: true } } } } } });
  let sent = 0, failed = 0, waitingForConfiguration = 0;
  for (const notification of pending) {
    try {
      const result = notification.channel === "EMAIL" ? await sendEmail(notification.id, notification.recipient, notification.template, asPayload(notification.payload)) : await sendWhatsApp(notification.recipient, notification.template, asPayload(notification.payload), notification.store.whatsappConnection);
      if (!result.configured) { waitingForConfiguration++; continue; }
      if (result.sent) { await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date(), lastError: null } }); sent++; }
      else { await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "FAILED", lastError: result.error } }); failed++; }
    } catch (error) { await db.notificationOutbox.update({ where: { id: notification.id }, data: { status: "FAILED", lastError: error instanceof Error ? error.message.slice(0, 500) : "Provider request failed." } }); failed++; }
  }
  return { processed: pending.length, sent, failed, waitingForConfiguration };
}
