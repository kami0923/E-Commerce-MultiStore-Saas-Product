import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { requireTenantPermission } from "@/data/auth";
import { getStorefrontPreview } from "@/data/storefront";

export default async function StorePreviewPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await getStorefrontPreview(storeId);
  if (!store) notFound();
  await requireTenantPermission(store.tenantId, "stores.view", store.id);
  return <Storefront store={store} preview />;
}
