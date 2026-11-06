import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { db } from "@/lib/db";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const [{ redirectTo }, userCount] = await Promise.all([searchParams, db.user.count()]);
  return <AuthLayout eyebrow="Welcome back" title="Sign in to your workspace." description="Your session is stored in the database and can be revoked independently on every device."><AuthForm action={signInAction} mode="sign-in" redirectTo={redirectTo} />{userCount === 0 && <p className="mt-5 text-center text-sm text-[#718078]">New installation? <Link href="/setup" className="font-black text-[#164b36]">Create the platform owner</Link></p>}</AuthLayout>;
}
