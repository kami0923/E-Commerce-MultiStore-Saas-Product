import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { ForgotPasswordForm } from "@/components/recovery-form";

export default function ForgotPasswordPage() {
  return <AuthLayout eyebrow="Account recovery" title="Recover your workspace." description="Request a short-lived reset link. Responses never reveal whether an email address belongs to an account."><ForgotPasswordForm /><Link href="/sign-in" className="mt-5 block text-center text-xs font-black text-[#164b36]">Return to sign in</Link></AuthLayout>;
}
