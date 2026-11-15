"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { passwordSchema } from "@/lib/password-policy";
import { securityEmailConfigured } from "@/lib/security-email";

export type RecoveryState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string[]> };

export async function requestPasswordResetAction(_state: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const parsed = z.object({ email: z.email("Enter a valid email address.").trim().toLowerCase() }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  if (!securityEmailConfigured()) return { status: "success", message: "Password recovery is securely prepared but email delivery is currently paused by the platform owner." };
  try {
    const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
    await auth.api.requestPasswordReset({ headers: await headers(), body: { email: parsed.data.email, redirectTo: `${base}/reset-password` } });
  } catch { /* Always return the same result to prevent account discovery. */ }
  return { status: "success", message: "If an eligible account uses that address, a secure reset link has been sent." };
}

export async function resetPasswordAction(_state: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const parsed = z.object({ token: z.string().min(1), password: passwordSchema, confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." }).safeParse({ token: formData.get("token"), password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  try { await auth.api.resetPassword({ headers: await headers(), body: { token: parsed.data.token, newPassword: parsed.data.password } }); }
  catch { return { status: "error", message: "This reset link is invalid or has expired. Request a new link." }; }
  redirect("/sign-in?passwordReset=1");
}
