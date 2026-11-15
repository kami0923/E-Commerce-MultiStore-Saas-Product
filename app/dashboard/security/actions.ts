"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentSession, requireUser } from "@/data/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { passwordSchema } from "@/lib/password-policy";

export type SecurityState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string[]> };

function requestContext(all: Headers) {
  return { ipAddress: all.get("x-forwarded-for")?.split(",")[0]?.trim() || all.get("x-real-ip"), userAgent: all.get("user-agent")?.slice(0, 500) };
}

export async function changePasswordAction(_state: SecurityState, formData: FormData): Promise<SecurityState> {
  const parsed = z.object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: passwordSchema, confirmPassword: z.string(), revokeOtherSessions: z.enum(["on"]).optional() }).refine(value => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." }).safeParse({ currentPassword: formData.get("currentPassword"), newPassword: formData.get("newPassword"), confirmPassword: formData.get("confirmPassword"), revokeOtherSessions: formData.get("revokeOtherSessions") || undefined });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const user = await requireUser();
  const allHeaders = await headers();
  try { await auth.api.changePassword({ headers: allHeaders, body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: parsed.data.revokeOtherSessions === "on" } }); }
  catch { return { status: "error", message: "The current password is incorrect or the password could not be changed." }; }
  await db.securityEvent.create({ data: { userId: user.id, action: "password.changed", summary: parsed.data.revokeOtherSessions ? "Password changed and other sessions revoked" : "Password changed", ...requestContext(allHeaders) } });
  revalidatePath("/dashboard/security");
  return { status: "success", message: "Your password was changed securely." };
}

export async function revokeSessionAction(formData: FormData) {
  const sessionId = z.string().min(1).parse(formData.get("sessionId"));
  const [user, current] = await Promise.all([requireUser(), getCurrentSession()]);
  const target = await db.session.findFirst({ where: { id: sessionId, userId: user.id }, select: { id: true, token: true } });
  if (!target || target.token === current?.session.token) throw new Error("The current session cannot be revoked here.");
  await db.$transaction([db.session.delete({ where: { id: target.id } }), db.securityEvent.create({ data: { userId: user.id, action: "session.revoked", summary: "Revoked one signed-in device", ...(requestContext(await headers())) } })]);
  revalidatePath("/dashboard/security");
}

export async function revokeOtherSessionsAction() {
  const [user, current, allHeaders] = await Promise.all([requireUser(), getCurrentSession(), headers()]);
  if (!current) throw new Error("Session not found.");
  const result = await db.session.deleteMany({ where: { userId: user.id, token: { not: current.session.token } } });
  await db.securityEvent.create({ data: { userId: user.id, action: "sessions.revoked", summary: `Revoked ${result.count} other session${result.count === 1 ? "" : "s"}`, ...requestContext(allHeaders) } });
  revalidatePath("/dashboard/security");
}
