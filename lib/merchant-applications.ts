import "server-only";

import { db } from "@/lib/db";
import { emailTransportConfigured, sendPlatformEmail } from "@/lib/email-transport";
import { applicationTokenHash } from "@/lib/merchant-application-token";
export { applicationReference, createApplicationTrackingToken } from "@/lib/merchant-application-token";
function escapeHtml(value: unknown) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }

export async function sendApplicationEmail(input: { recipient: string; ownerName: string; businessName: string; heading: string; message: string; actionLabel?: string; actionUrl?: string; idempotencyKey: string }) {
  if (!emailTransportConfigured()) return false;
  const button = input.actionLabel && input.actionUrl ? `<a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;margin-top:20px;padding:14px 24px;border-radius:999px;background:#164b36;color:white;text-decoration:none;font-weight:800">${escapeHtml(input.actionLabel)} →</a>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f2f5ef;font-family:Arial,sans-serif;color:#11271d"><div style="max-width:620px;margin:40px auto;background:white;border:1px solid #dfe6de;border-radius:24px;padding:40px"><p style="font-size:11px;letter-spacing:2px;color:#587164;font-weight:800">MERIDIAN COMMERCE · MERCHANT ONBOARDING</p><h1 style="font-family:Georgia,serif;font-size:38px;font-weight:500">${escapeHtml(input.heading)}</h1><p style="line-height:1.75;color:#65746b">Hello ${escapeHtml(input.ownerName)},</p><p style="line-height:1.75;color:#65746b">${escapeHtml(input.message)}</p><div style="margin-top:20px;padding:16px;border-radius:16px;background:#f5f8f2"><strong>${escapeHtml(input.businessName)}</strong></div>${button}<p style="margin-top:28px;font-size:12px;color:#8a958e">Never share an invitation or application-status link publicly.</p></div></body></html>`;
  await sendPlatformEmail({ recipient: input.recipient, subject: `${input.heading} · ${input.businessName}`, html, idempotencyKey: input.idempotencyKey });
  return true;
}

export async function getApplicationByToken(token: string) {
  if (!token || token.length < 20) return null;
  return db.merchantApplication.findUnique({ where: { trackingTokenHash: applicationTokenHash(token) }, select: { id: true, businessName: true, ownerName: true, ownerEmail: true, verticals: true, status: true, reviewNotes: true, submittedAt: true, reviewedAt: true, approvedTenant: { select: { name: true, stores: { orderBy: { createdAt: "asc" }, take: 1, select: { slug: true } } } } } });
}
