import Link from "next/link";

export function BrandMark({ compact = false, name = "Meridian", subtitle = "Commerce OS", initials = "M", href = "/" }: { compact?: boolean; name?: string; subtitle?: string; initials?: string; href?: string }) {
  return (
    <Link href={href as never} className="inline-flex min-w-0 items-center gap-3 text-inherit no-underline">
      <span className="grid size-10 place-items-center rounded-[14px] bg-[#c9f269] text-sm font-black text-[#0d3827] shadow-[inset_0_0_0_1px_rgba(13,56,39,.08)]">
        {initials.slice(0, 2)}
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block max-w-[150px] truncate text-[15px] font-black tracking-[-0.02em]">{name.toUpperCase()}</span>
          <span className="mt-1 block text-[9px] font-bold tracking-[0.18em] text-[#819087]">{subtitle.toUpperCase()}</span>
        </span>
      )}
    </Link>
  );
}
