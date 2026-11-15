import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { ResetPasswordForm } from "@/components/recovery-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token } = await searchParams;
  return <AuthLayout eyebrow="Secure password reset" title="Choose a new password." description="Reset links are single-use, expire after one hour, and revoke existing sessions after completion.">{token ? <ResetPasswordForm token={token} /> : <div className="rounded-2xl bg-[#fff0e9] p-4 text-sm font-semibold text-[#a95139]">This reset link is incomplete or expired. Request a new one.</div>}<Link href="/forgot-password" className="mt-5 block text-center text-xs font-black text-[#164b36]">Request another reset link</Link></AuthLayout>;
}
