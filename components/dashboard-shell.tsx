"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Boxes, Building2, ChevronDown, ClipboardList, CreditCard, ExternalLink, Gauge, Headphones, Images, LayoutDashboard, LogOut, Menu, MessageCircle, Search, Settings2, ShieldCheck, Store, Users, Warehouse, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/(auth)/actions";
import type { Permission } from "@/lib/permissions";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Businesses", href: "/dashboard/businesses", icon: Building2, permission: "tenant.view" },
  { label: "Stores", href: "/dashboard/stores", icon: Store, permission: "stores.view" },
  { label: "Catalog", href: "/dashboard/catalog", icon: Boxes, permission: "products.view" },
  { label: "Media library", href: "/dashboard/media", icon: Images, permission: "products.view" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Warehouse, permission: "inventory.view" },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList, permission: "orders.view" },
  { label: "Payments & delivery", href: "/dashboard/commerce-setup", icon: CreditCard, permission: "stores.manage" },
  { label: "Plans & usage", href: "/dashboard/subscription", icon: Gauge, permission: "stores.view" },
  { label: "Customer care", href: "/dashboard/customer-care", icon: Headphones, permission: "orders.manage" },
  { label: "WhatsApp Business", href: "/dashboard/whatsapp", icon: MessageCircle, permission: "stores.manage" },
  { label: "Team & roles", href: "/dashboard/team", icon: Users, permission: "staff.view" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics.view" },
  { label: "Audit logs", href: "/dashboard/audit", icon: ShieldCheck, permission: "audit.view" },
] satisfies { label: string; href: string; icon: typeof LayoutDashboard; permission?: Permission }[];

type Workspace = { name: string; subtitle: string; initials: string; scopeLabel: string; platformAccess: boolean; storefront: { id: string; name: string; slug: string; status: string } | null };

export function DashboardShell({ children, user, capabilities, workspace }: { children: React.ReactNode; user: { name: string; email: string; platformRole: string }; capabilities: Permission[]; workspace: Workspace }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isPlatformAdmin = user.platformRole === "SUPER_ADMIN";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6"><BrandMark name={workspace.name} subtitle={workspace.subtitle} initials={workspace.initials} href="/dashboard" /><button onClick={() => setOpen(false)} className="md:hidden"><X className="size-5" /></button></div>
      <div className="mx-4 mt-2 rounded-2xl border border-[#e5e9e4] bg-[#f8faf7] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#98a29b]">Workspace</p>
        <button className="mt-2 flex w-full items-center gap-3 text-left">
          <span className="grid size-9 place-items-center rounded-xl bg-[#164b36] text-xs font-black text-white">{workspace.initials}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{workspace.name}</span><span className="block text-[11px] capitalize text-[#88948c]">{workspace.scopeLabel}</span></span>
          <ChevronDown className="size-4 text-[#89948d]" />
        </button>
        {!isPlatformAdmin && workspace.storefront && <Link href={(workspace.storefront.status === "ACTIVE" ? `/store/${workspace.storefront.slug}` : `/preview/${workspace.storefront.id}`) as never} target="_blank" className="mt-3 flex items-center justify-between rounded-xl bg-[#eaf2e6] px-3 py-2 text-xs font-black text-[#164b36]">{workspace.storefront.status === "ACTIVE" ? "View public website" : "Preview website"}<ExternalLink className="size-3.5" /></Link>}
      </div>
      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
        {navigation.filter(({ permission }) => !permission || capabilities.includes(permission)).map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href as never} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-[#eaf2e6] text-[#164b36]" : "text-[#657169] hover:bg-[#f4f6f3] hover:text-[#10231a]") }>
              <Icon className="size-[18px]" /><span className="flex-1">{!isPlatformAdmin && label === "Businesses" ? "Brand profile" : label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#e8ece8] p-3">
        <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#657169] hover:bg-[#f4f6f3]"><Settings2 className="size-[18px]" /> Workspace settings</Link>
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#10231a] p-3 text-white">
          <span className="grid size-9 place-items-center rounded-full bg-[#c9f269] text-sm font-black text-[#10231a]">{user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{user.name}</span><span className="block text-[11px] text-white/55">{user.platformRole === "SUPER_ADMIN" ? "Platform owner" : user.email}</span></span>
          <form action={signOutAction}><button aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"><LogOut className="size-4" /></button></form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f4] md:pl-[260px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[#e4e9e4] bg-white md:block">{sidebar}</aside>
      {open && <><button aria-label="Close navigation" className="fixed inset-0 z-40 bg-[#10231a]/30 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} /><aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl md:hidden">{sidebar}</aside></>}
      <header className="sticky top-0 z-30 flex h-[76px] items-center gap-4 border-b border-[#e4e9e4]/80 bg-[#f5f7f4]/85 px-4 backdrop-blur-xl sm:px-7">
        <button aria-label="Open navigation" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl bg-white shadow-sm md:hidden"><Menu className="size-5" /></button>
        <div className="relative hidden max-w-md flex-1 sm:block"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a958e]" /><input className="h-11 w-full rounded-xl border border-[#e0e6e0] bg-white/80 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#9aa49d] focus:border-[#8cab88] focus:ring-4 focus:ring-[#c9f269]/20" placeholder={isPlatformAdmin ? "Search businesses, stores, orders…" : `Search ${workspace.name}…`} /></div>
        <div className="ml-auto flex items-center gap-2">
          <button className="hidden rounded-xl border border-[#dfe5df] bg-white px-3.5 py-2.5 text-xs font-bold text-[#506057] sm:block">EN · PKR</button>
          <button aria-label="Notifications" className="relative grid size-11 place-items-center rounded-xl border border-[#dfe5df] bg-white text-[#506057]"><Bell className="size-[18px]" /><span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-[#f07c53]" /></button>
        </div>
      </header>
      <main className="px-4 py-7 sm:px-7 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
