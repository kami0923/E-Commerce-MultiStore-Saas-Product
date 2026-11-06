import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentPermissions, getDashboardWorkspace, requireUser } from "@/data/auth";

export async function generateMetadata(): Promise<Metadata> {
  const workspace = await getDashboardWorkspace();
  return {
    title: { absolute: `${workspace.name} · Dashboard` },
    description: workspace.platformAccess
      ? "Operate the Meridian Commerce platform."
      : `Manage products, inventory, orders and storefronts for ${workspace.name}.`,
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, capabilities, workspace] = await Promise.all([requireUser(), getCurrentPermissions(), getDashboardWorkspace()]);
  return <DashboardShell user={user} capabilities={capabilities} workspace={workspace}>{children}</DashboardShell>;
}
