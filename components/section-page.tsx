import type { LucideIcon } from "lucide-react";

export function SectionPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e8f1e3] text-[#164b36]"><Icon className="size-5" /></span>
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#87938b]">{eyebrow}</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b73]">{description}</p></div>
      </div>
      <div className="mt-8">{children ?? <div className="rounded-[24px] border border-dashed border-[#ccd6cc] bg-white/60 p-12 text-center"><p className="font-bold text-[#31483b]">Foundation ready</p><p className="mt-2 text-sm text-[#7c8981]">This module is connected to the shared dashboard shell and ready for its data workflow.</p></div>}</div>
    </div>
  );
}
