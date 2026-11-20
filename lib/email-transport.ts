import "server-only";

import { createHash } from "node:crypto";
import nodemailer from "nodemailer";

function smtpConfigured() { return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM_EMAIL); }
export function emailTransportConfigured() { return Boolean((process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) || smtpConfigured()); }

export async function sendPlatformEmail({ recipient, subject, html, idempotencyKey }: { recipient: string; subject: string; html: string; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ from, to: [recipient], subject, html }) });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok) throw new Error(result.message || `Email provider returned ${response.status}.`);
    return { provider: "resend" as const, providerMessageId: result.id };
  }
  if (!smtpConfigured()) throw new Error("Email transport is not configured.");
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 32);
  const result = await transporter.sendMail({ from: process.env.SMTP_FROM_EMAIL, to: recipient, subject, html, messageId: `<${digest}@meridian-commerce>` });
  return { provider: "smtp" as const, providerMessageId: result.messageId };
}
