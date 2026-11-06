"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { encryptSecret, decryptSecret } from "@/lib/crypto-secrets";
import { db } from "@/lib/db";

const identity = z.object({ tenantId: z.string().min(1), storeId: z.string().min(1) });
const signup = identity.extend({
  code: z.string().min(8),
  businessId: z.string().min(1).optional(),
  wabaId: z.string().min(1),
  phoneNumberId: z.string().min(1),
});

type ActionResult = { ok: boolean; message: string };

function graphVersion() { return process.env.WHATSAPP_GRAPH_VERSION || "v22.0"; }

async function validateStore(tenantId: string, storeId: string) {
  const store = await db.store.findFirst({ where: { id: storeId, tenantId }, select: { id: true, name: true } });
  if (!store) throw new Error("Store not found inside this business.");
  return store;
}

async function phoneProfile(phoneNumberId: string, accessToken: string) {
  const url = new URL(`https://graph.facebook.com/${graphVersion()}/${phoneNumberId}`);
  url.searchParams.set("fields", "display_phone_number,verified_name,quality_rating");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { display_phone_number?: string; verified_name?: string; quality_rating?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || `Meta verification returned ${response.status}.`);
  return body;
}

export async function completeWhatsAppSignupAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = signup.parse(input);
    const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
    const store = await validateStore(parsed.tenantId, parsed.storeId);
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) return { ok: false, message: "The platform owner must configure the Meta app before accounts can be linked." };

    const exchange = new URL(`https://graph.facebook.com/${graphVersion()}/oauth/access_token`);
    exchange.searchParams.set("client_id", appId);
    exchange.searchParams.set("client_secret", appSecret);
    exchange.searchParams.set("code", parsed.code);
    const tokenResponse = await fetch(exchange, { method: "GET", cache: "no-store" });
    const tokenBody = await tokenResponse.json().catch(() => ({})) as { access_token?: string; error?: { message?: string } };
    if (!tokenResponse.ok || !tokenBody.access_token) return { ok: false, message: tokenBody.error?.message || "Meta did not return a valid access token." };

    const profile = await phoneProfile(parsed.phoneNumberId, tokenBody.access_token);
    const encrypted = encryptSecret(tokenBody.access_token);
    const connection = await db.whatsAppConnection.upsert({
      where: { storeId: parsed.storeId },
      create: {
        tenantId: parsed.tenantId, storeId: parsed.storeId, businessId: parsed.businessId, wabaId: parsed.wabaId,
        phoneNumberId: parsed.phoneNumberId, displayPhoneNumber: profile.display_phone_number, verifiedName: profile.verified_name,
        qualityRating: profile.quality_rating, tokenCiphertext: encrypted.ciphertext, tokenIv: encrypted.iv, tokenTag: encrypted.tag,
        status: "CONNECTED", connectedAt: new Date(), lastVerifiedAt: new Date(), lastError: null,
      },
      update: {
        tenantId: parsed.tenantId, businessId: parsed.businessId, wabaId: parsed.wabaId, phoneNumberId: parsed.phoneNumberId,
        displayPhoneNumber: profile.display_phone_number, verifiedName: profile.verified_name, qualityRating: profile.quality_rating,
        tokenCiphertext: encrypted.ciphertext, tokenIv: encrypted.iv, tokenTag: encrypted.tag, status: "CONNECTED",
        connectedAt: new Date(), lastVerifiedAt: new Date(), lastError: null,
      },
    });
    await db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "whatsapp.connected", entityType: "WhatsAppConnection", entityId: connection.id, summary: `Linked WhatsApp Business to ${store.name}` } });
    revalidatePath("/dashboard/whatsapp");
    return { ok: true, message: `${profile.verified_name || "WhatsApp Business"} is now linked to ${store.name}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "WhatsApp linking could not be completed." };
  }
}

export async function verifyWhatsAppConnectionAction(formData: FormData) {
  const parsed = identity.parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId") });
  const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
  await validateStore(parsed.tenantId, parsed.storeId);
  const connection = await db.whatsAppConnection.findFirst({ where: { tenantId: parsed.tenantId, storeId: parsed.storeId } });
  if (!connection?.phoneNumberId || !connection.tokenCiphertext || !connection.tokenIv || !connection.tokenTag) return;
  try {
    const token = decryptSecret({ ciphertext: connection.tokenCiphertext, iv: connection.tokenIv, tag: connection.tokenTag });
    const profile = await phoneProfile(connection.phoneNumberId, token);
    await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "CONNECTED", displayPhoneNumber: profile.display_phone_number, verifiedName: profile.verified_name, qualityRating: profile.quality_rating, lastVerifiedAt: new Date(), lastError: null } });
    await db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "whatsapp.verified", entityType: "WhatsAppConnection", entityId: connection.id, summary: "Verified the linked WhatsApp Business account" } });
  } catch (error) {
    await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "ERROR", lastError: error instanceof Error ? error.message.slice(0, 500) : "Verification failed." } });
  }
  revalidatePath("/dashboard/whatsapp");
}

export async function disconnectWhatsAppAction(formData: FormData) {
  const parsed = identity.parse({ tenantId: formData.get("tenantId"), storeId: formData.get("storeId") });
  const scope = await requireTenantPermission(parsed.tenantId, "stores.manage", parsed.storeId);
  await validateStore(parsed.tenantId, parsed.storeId);
  const connection = await db.whatsAppConnection.findFirst({ where: { tenantId: parsed.tenantId, storeId: parsed.storeId }, select: { id: true } });
  if (!connection) return;
  await db.$transaction([
    db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "DISCONNECTED", tokenCiphertext: null, tokenIv: null, tokenTag: null, lastError: null } }),
    db.auditLog.create({ data: { tenantId: parsed.tenantId, storeId: parsed.storeId, actorId: scope.user.id, action: "whatsapp.disconnected", entityType: "WhatsAppConnection", entityId: connection.id, summary: "Disconnected the store WhatsApp Business account" } }),
  ]);
  revalidatePath("/dashboard/whatsapp");
}
