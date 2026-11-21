"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, Banknote, BarChart3, Bell, Boxes, Building2, ChevronDown, ClipboardCheck, ClipboardList, CreditCard, ExternalLink, Gauge, Headphones, Images, LayoutDashboard, LockKeyhole, LogOut, Menu, MessageCircle, Settings2, ShieldCheck, Store, Truck, Users, Warehouse, X } from "lucide-react";
import { Fragment, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/(auth)/actions";
import type { Permission } from "@/lib/permissions";
import { DashboardCommandPalette } from "@/components/dashboard-command-palette";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "Command" },
  { label: "Platform health", href: "/dashboard/platform-health", icon: Activity, group: "Command", platformOnly: true },
  { label: "Merchant applications", href: "/dashboard/onboarding", icon: ClipboardCheck, group: "Commerce", platformOnly: true },
  { label: "Businesses", href: "/dashboard/businesses", icon: Building2, group: "Commerce", permission: "tenant.view" },
  { label: "Stores", href: "/dashboard/stores", icon: Store, group: "Commerce", permission: "stores.view" },
  { label: "Catalog", href: "/dashboard/catalog", icon: Boxes, group: "Products", permission: "products.view" },
  { label: "Media library", href: "/dashboard/media", icon: Images, group: "Products", permission: "products.view" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Warehouse, group: "Products", permission: "inventory.view" },
  { label: "Suppliers & purchasing", href: "/dashboard/procurement", icon: Truck, group: "Products", permission: "inventory.view" },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList, group: "Operations", permission: "orders.view" },
  { label: "Payments & settlements", href: "/dashboard/payments", icon: Banknote, group: "Operations", permission: "orders.view" },
  { label: "Delivery & gateways", href: "/dashboard/commerce-setup", icon: CreditCard, group: "Operations", permission: "stores.manage" },
  { label: "Plans & usage", href: "/dashboard/subscription", icon: Gauge, group: "Growth", permission: "stores.view" },
  { label: "Customer care", href: "/dashboard/customer-care", icon: Headphones, group: "Growth", permission: "orders.manage" },
  { label: "WhatsApp Business", href: "/dashboard/whatsapp", icon: MessageCircle, group: "Growth", permission: "stores.manage" },
  { label: "Team & roles", href: "/dashboard/team", icon: Users, group: "Governance", permission: "staff.view" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, group: "Governance", permission: "analytics.view" },
  { label: "Audit logs", href: "/dashboard/audit", icon: ShieldCheck, group: "Governance", permission: "audit.view" },
  { label: "Account security", href: "/dashboard/security", icon: LockKeyhole, group: "Governance" },
] satisfies { label: string; href: string; icon: typeof LayoutDashboard; group: string; permission?: Permission; platformOnly?: boolean }[];

type Workspace = { name: string; subtitle: string; initials: string; scopeLabel: string; platformAccess: boolean; storefront: { id: string; name: string; slug: string; status: string } | null; subscription: { active: boolean; reason: string | null; status: string; planName: string | null; currentPeriodEnd: Date | null } | null };

export function DashboardShell({ children, user, capabilities, workspace }: { children: React.ReactNode; user: { name: string; email: string; platformRole: string }; capabilities: Permission[]; workspace: Workspace }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isPlatformAdmin = user.platformRole === "SUPER_ADMIN";
  const currentPage = navigation.find(({ href }) => href === "/dashboard" ? pathname === href : pathname.startsWith(href))?.label ?? "Workspace";
  const visibleNavigation = navigation.filter(({ permission, platformOnly }) => (!platformOnly || isPlatformAdmin) && (!permission || capabilities.includes(permission)));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6"><BrandMark name={workspace.name} subtitle={workspace.subtitle} initials={workspace.initials} href="/dashboard" /><button onClick={() => setOpen(false)} className="md:hidden"><X className="size-5" /></button></div>
      <div className="dashboard-workspace mx-4 mt-2 rounded-2xl border border-[#e5e9e4] bg-[#f8faf7] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#98a29b]">Workspace</p>
        <button className="mt-2 flex w-full items-center gap-3 text-left">
          <span className="grid size-9 place-items-center rounded-xl bg-[#164b36] text-xs font-black text-white">{workspace.initials}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{workspace.name}</span><span className="block text-[11px] capitalize text-[#88948c]">{workspace.scopeLabel}</span></span>
          <ChevronDown className="size-4 text-[#89948d]" />
        </button>
        {!isPlatformAdmin && workspace.storefront && <Link href={(workspace.storefront.status === "ACTIVE" && workspace.subscription?.active ? `/store/${workspace.storefront.slug}` : `/preview/${workspace.storefront.id}`) as never} target="_blank" className="mt-3 flex items-center justify-between rounded-xl bg-[#eaf2e6] px-3 py-2 text-xs font-black text-[#164b36]">{workspace.storefront.status === "ACTIVE" && workspace.subscription?.active ? "View public website" : "Preview website"}<ExternalLink className="size-3.5" /></Link>}
      </div>
      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
        {visibleNavigation.map(({ label, href, icon: Icon, group }, index) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Fragment key={href}>
              {(index === 0 || visibleNavigation[index - 1]?.group !== group) && <p className="dashboard-nav-group">{group}</p>}
              <Link href={href as never} data-active={active} onClick={() => setOpen(false)} className={cn("dashboard-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-[#eaf2e6] text-[#164b36]" : "text-[#657169] hover:bg-[#f4f6f3] hover:text-[#10231a]") }>
                <Icon className="size-[18px]" /><span className="flex-1">{!isPlatformAdmin && label === "Businesses" ? "Brand profile" : label}</span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
      <div className="border-t border-[#e8ece8] p-3">
        <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#657169] hover:bg-[#f4f6f3]"><Settings2 className="size-[18px]" /> Workspace settings</Link>
        <div className="dashboard-user-card mt-2 flex items-center gap-3 rounded-2xl bg-[#10231a] p-3 text-white">
          <span className="grid size-9 place-items-center rounded-full bg-[#c9f269] text-sm font-black text-[#10231a]">{user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{user.name}</span><span className="block text-[11px] text-white/55">{user.platformRole === "SUPER_ADMIN" ? "Platform owner" : user.email}</span></span>
          <form action={signOutAction}><button aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"><LogOut className="size-4" /></button></form>
        </div>
      </div>
    </div>
  );

  return (
    <div data-platform={isPlatformAdmin ? "true" : "false"} className="meridian-dashboard min-h-screen bg-[#f5f7f4] md:pl-[272px]">
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-[#e4e9e4] bg-white md:block">{sidebar}</aside>
      {open && <><button aria-label="Close navigation" className="fixed inset-0 z-40 bg-[#020907]/70 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} /><aside className="dashboard-sidebar fixed inset-y-0 left-0 z-50 w-[292px] bg-white shadow-2xl md:hidden">{sidebar}</aside></>}
      <header className="dashboard-topbar sticky top-0 z-30 flex h-[76px] items-center gap-4 border-b border-[#e4e9e4]/80 bg-[#f5f7f4]/85 px-4 backdrop-blur-xl sm:px-7">
        <button aria-label="Open navigation" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl bg-white shadow-sm md:hidden"><Menu className="size-5" /></button>
        <div className="hidden min-w-0 flex-1 items-center gap-4 sm:flex"><div className="dashboard-breadcrumb"><small>{workspace.name}</small><b>{currentPage}</b></div><DashboardCommandPalette placeholder={isPlatformAdmin ? "Search businesses, stores, orders…" : `Search ${workspace.name}…`} /></div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeModeToggle className="dashboard-theme-toggle" />
          <button className="dashboard-top-action hidden rounded-xl border border-[#dfe5df] bg-white px-3.5 py-2.5 text-xs font-bold text-[#506057] sm:block">EN · PKR</button>
          <button aria-label="Notifications" className="dashboard-top-action relative grid size-11 place-items-center rounded-xl border border-[#dfe5df] bg-white text-[#506057]"><Bell className="size-[18px]" /><span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-[#f07c53]" /></button>
        </div>
      </header>
      {!isPlatformAdmin && workspace.subscription && !workspace.subscription.active && <div className="border-b border-[#f0d1c6] bg-[#fff2ec] px-4 py-3 text-[#8f452f] sm:px-7 lg:px-10"><div className="flex items-start gap-3 text-xs leading-5"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><b>Workspace is read-only.</b> {workspace.subscription.reason} Existing orders, refunds, reports, and account security remain available.</div></div></div>}
      <main className="dashboard-main px-4 py-7 sm:px-7 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
