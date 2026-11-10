import { redirect } from "next/navigation";
import { connection } from "next/server";
import { setupPlatformAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { db } from "@/lib/db";

export default async function SetupPage() {
  await connection();
  if ((await db.user.count()) > 0) redirect("/sign-in");
  return <AuthLayout eyebrow="One-time setup" title="Create your command center." description="This first account receives platform-owner access. Every future merchant and staff member will join through a secure invitation."><AuthForm action={setupPlatformAction} mode="setup" /></AuthLayout>;
}
