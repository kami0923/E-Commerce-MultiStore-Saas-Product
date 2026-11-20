import "server-only";

import { createHash } from "node:crypto";
import { emailTransportConfigured, sendPlatformEmail } from "@/lib/email-transport";

function escape(value: string) { return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }

export function securityEmailConfigured() { return emailTransportConfigured(); }

export async function sendSecurityEmail({ recipient, name, url, kind }: { recipient: string; name: string; url: string; kind: "password-reset" | "email-verification" }) {
  const reset = kind === "password-reset";
  const title = reset ? "Reset your Meridian password" : "Verify your Meridian email";
  const intro = reset ? "A password reset was requested for your account." : "Confirm this email address for your Meridian account.";
  const label = reset ? "Reset password" : "Verify email";
  const html = `<!doctype html><html><body style="margin:0;background:#f2f5ef;font-family:Arial,sans-serif;color:#11271d"><div style="max-width:600px;margin:40px auto;background:white;border:1px solid #dfe6de;border-radius:24px;padding:40px"><p style="font-size:12px;letter-spacing:2px;color:#587164;font-weight:800">MERIDIAN COMMERCE</p><h1 style="font-family:Georgia,serif;font-size:36px">${escape(title)}</h1><p style="line-height:1.7;color:#65746b">Hello ${escape(name)}, ${escape(intro)} The secure link expires in one hour. If this was not you, ignore this message.</p><a href="${escape(url)}" style="display:inline-block;margin-top:18px;padding:14px 24px;border-radius:999px;background:#164b36;color:white;text-decoration:none;font-weight:800">${escape(label)} →</a></div></body></html>`;
  if (!emailTransportConfigured()) return { sent: false, configured: false };
  const result = await sendPlatformEmail({ recipient, subject: title, html, idempotencyKey: `security/${createHash("sha256").update(url).digest("hex")}` });
  return { sent: true, configured: true, provider: result.provider };
}
