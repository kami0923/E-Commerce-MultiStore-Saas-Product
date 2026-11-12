"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuthActionState = {
  status: "idle" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(12, "Password must contain at least 12 characters.").max(128),
});

const setupSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
});

function safeRedirect(value: FormDataEntryValue | null, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export async function setupPlatformAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if ((await db.user.count()) > 0) {
    return { status: "error", message: "Platform setup has already been completed." };
  }

  const validated = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { status: "error", errors: validated.error.flatten().fieldErrors };
  }

  try {
    const result = await auth.api.signUpEmail({
      headers: await headers(),
      body: validated.data,
    });
    const owner = await db.$transaction(async (tx) => {
      const firstUser = await tx.user.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true } });
      if (firstUser?.id !== result.user.id) {
        await tx.user.delete({ where: { id: result.user.id } });
        return false;
      }
      await tx.user.update({ where: { id: result.user.id }, data: { platformRole: "SUPER_ADMIN", emailVerified: true } });
      return true;
    });
    if (!owner) return { status: "error", message: "Platform setup has already been completed." };
  } catch {
    return { status: "error", message: "The platform owner account could not be created." };
  }

  redirect("/dashboard");
}

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const validated = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { status: "error", errors: validated.error.flatten().fieldErrors };
  }

  try {
    const result = await auth.api.signInEmail({ headers: await headers(), body: validated.data });
    const storeSlug = typeof formData.get("storeSlug") === "string" ? String(formData.get("storeSlug")) : null;

    if (storeSlug) {
      const account = await db.user.findUnique({
        where: { id: result.user.id },
        select: {
          platformRole: true,
          memberships: {
            where: { active: true },
            select: { tenantId: true, role: true },
          },
        },
      });
      const store = await db.store.findFirst({
        where: { slug: storeSlug, status: { not: "ARCHIVED" } },
        select: {
          tenantId: true,
          access: { where: { userId: result.user.id }, select: { id: true } },
        },
      });
      const membership = store
        ? account?.memberships.find((item) => item.tenantId === store.tenantId)
        : null;
      const allowed =
        account?.platformRole === "SUPER_ADMIN" ||
        Boolean(
          membership &&
            (["OWNER", "ADMIN"].includes(membership.role) || store?.access.length),
        );

      if (!allowed) {
        await db.session.deleteMany({ where: { token: result.token } });
        return {
          status: "error",
          message:
            "This account is not assigned to the selected store. Ask the business owner to invite you or choose your correct store.",
        };
      }
    }
  } catch {
    return { status: "error", message: "The email or password is incorrect." };
  }

  redirect(safeRedirect(formData.get("redirectTo")) as never);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
