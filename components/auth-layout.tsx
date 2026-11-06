import { Check, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[#f5f7f4] lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <BrandMark />
          <p className="mt-14 text-xs font-black uppercase tracking-[.19em] text-[#78907d]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-5xl">{title}</h1>
          <p className="mt-5 text-sm leading-7 text-[#6d7a72]">{description}</p>
          {children}
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-[#10231a] p-12 text-white lg:flex lg:items-end">
        <div className="absolute -right-32 -top-32 size-[520px] rounded-full bg-[#c9f269]/16 blur-3xl" />
        <div className="relative max-w-xl">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#c9f269] text-[#10231a]"><ShieldCheck className="size-6" /></span>
          <h2 className="mt-8 text-5xl font-black leading-[.95] tracking-[-.06em]">Secure at every boundary.</h2>
          <p className="mt-6 max-w-lg leading-8 text-white/55">Authentication proves identity. Tenant membership, store assignment and permissions are then verified again beside every protected database operation.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2">{["Database-backed sessions", "Expiring invitation tokens", "Server-side authorization", "Audited tenant changes"].map(item => <p key={item} className="flex items-center gap-2 text-sm font-semibold text-white/75"><Check className="size-4 text-[#c9f269]" />{item}</p>)}</div>
        </div>
      </section>
    </main>
  );
}
