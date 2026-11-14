import { HardDrive, Images, LibraryBig } from "lucide-react";
import { MediaUploader } from "@/components/media-uploader";
import { LegacyMediaMigration } from "@/components/legacy-media-migration";
import { SectionPage } from "@/components/section-page";
import { getCurrentPermissions, getCurrentUser } from "@/data/auth";
import { getMediaWorkspace } from "@/data/media";
import { resolveMediaStorageConfiguration } from "@/lib/media-storage-config";

export default async function MediaPage() {
  const [{ stores, assets }, permissions, user] = await Promise.all([getMediaWorkspace(), getCurrentPermissions(), getCurrentUser()]);
  const canUpload = permissions.includes("products.manage");
  const storage = resolveMediaStorageConfiguration();
  const legacyCount = assets.filter(asset => asset.url.startsWith("/uploads/")).length;
  const totalBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  return <SectionPage eyebrow="Tenant-isolated creative assets" title="Media library" description="Upload product photography once, reuse it across galleries, and keep every merchant's files isolated." icon={Images}>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={LibraryBig} label="Images" value={String(assets.length)} /><Metric icon={HardDrive} label="Storage used" value={totalBytes < 1024 * 1024 ? `${Math.round(totalBytes / 1024)} KB` : `${(totalBytes / 1024 / 1024).toFixed(1)} MB`} /><Metric icon={Images} label="Accessible stores" value={String(stores.length)} /></section>
    {user?.platformRole === "SUPER_ADMIN" && legacyCount > 0 && storage.ready && storage.provider !== "local" && <LegacyMediaMigration count={legacyCount} />}
    {canUpload && <div className="mt-5"><MediaUploader stores={stores} uploadMode={storage.provider === "vercel-blob" && storage.ready ? "vercel-blob" : "server"} /></div>}
    <section className="mt-5 rounded-[28px] border border-[#dfe6df] bg-white p-5 sm:p-7"><div><h2 className="font-black">Asset gallery</h2><p className="mt-1 text-xs text-[#7c8981]">Newest uploads first. Images remain preserved even when products are archived.</p></div>{assets.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{assets.map(asset => <article key={asset.id} className="group"><div className="relative aspect-square overflow-hidden rounded-2xl bg-[#edf1ec]"><div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${asset.url}')` }} /></div><p className="mt-3 truncate text-xs font-black">{asset.originalName}</p><p className="mt-1 text-[11px] text-[#849087]">{asset.store.name} · {(asset.sizeBytes / 1024).toFixed(0)} KB</p></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-[#d5ddd5] p-12 text-center"><Images className="mx-auto size-6 text-[#9aa49d]" /><p className="mt-3 text-sm font-bold">No merchant images uploaded yet.</p></div>}</section>
  </SectionPage>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Images; label: string; value: string }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-xl font-black">{value}</p></div></div></article>; }
