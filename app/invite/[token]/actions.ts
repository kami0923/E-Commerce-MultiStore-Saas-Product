"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { acceptInvitationForUser, getInvitationByToken } from "@/lib/invitations";
import { getCurrentUser } from "@/data/auth";

export type InviteActionState = { status: "idle" | "error"; message?: string; errors?: Record<string, string[]> };

const inviteSignupSchema = z.object({
  token: z.string().min(32),
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});

export async function createInvitedAccountAction(_state: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const parsed = inviteSignupSchema.safeParse({ token: formData.get("token"), name: formData.get("name"), password: formData.get("password") });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };
  const invitation = await getInvitationByToken(parsed.data.token);
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) return { status: "error", message: "This invitation is invalid or has expired." };

  try {
    const result = await auth.api.signUpEmail({ headers: await headers(), body: { name: parsed.data.name, email: invitation.email, password: parsed.data.password } });
    await acceptInvitationForUser(parsed.data.token, { id: result.user.id, email: result.user.email });
  } catch {
    return { status: "error", message: "The invited account could not be created. Sign in if this email already has an account." };
  }
  redirect("/dashboard");
}

export async function acceptInvitationAction(formData: FormData) {
  const token = z.string().min(32).parse(formData.get("token"));
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?redirectTo=${encodeURIComponent(`/invite/${token}`)}`);
  await acceptInvitationForUser(token, user);
  redirect("/dashboard");
}
