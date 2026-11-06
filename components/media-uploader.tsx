"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, UploadCloud, X } from "lucide-react";
import { uploadMediaAction, type MediaActionState } from "@/app/dashboard/media/actions";

const initialState: MediaActionState = { status: "idle" };
const maxFiles = 10;
const maxFileBytes = 8 * 1024 * 1024;
const maxBatchBytes = maxFiles * maxFileBytes;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function MediaUploader({ stores }: { stores: { id: string; tenantId: string; name: string; tenant: { name: string } }[] }) {
  const [state, action, pending] = useActionState(uploadMediaAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id || "");
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedStore = stores.find(store => store.id === storeId);

  useEffect(() => () => previews.forEach(item => URL.revokeObjectURL(item.url)), [previews]);
  function receiveFiles(files: FileList | null) {
    previews.forEach(item => URL.revokeObjectURL(item.url));
    const selected = files ? [...files] : [];
    let error = "";

    if (selected.length > maxFiles) {
      error = `Choose no more than ${maxFiles} images at a time.`;
    } else {
      const unsupported = selected.find(file => !allowedTypes.has(file.type));
      const oversized = selected.find(file => file.size > maxFileBytes);
      const totalBytes = selected.reduce((sum, file) => sum + file.size, 0);
      if (unsupported) error = `${unsupported.name} is not a supported JPG, PNG, WebP or GIF image.`;
      else if (oversized) error = `${oversized.name} is larger than 8 MB.`;
      else if (totalBytes > maxBatchBytes) error = "The selected images are larger than the 80 MB batch limit.";
    }

    setSelectionError(error);
    setPreviews(error ? [] : selected.map(file => ({ name: file.name, url: URL.createObjectURL(file) })));
  }

  return <form action={action} className="rounded-[28px] border border-[#dfe6df] bg-white p-5 shadow-[0_16px_50px_rgba(16,35,26,.05)] sm:p-7">
    <input type="hidden" name="tenantId" value={selectedStore?.tenantId || ""} />
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold text-[#526158]">Store<select name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] bg-white px-4 text-sm outline-none" required>{stores.map(store => <option key={store.id} value={store.id}>{store.tenant.name} · {store.name}</option>)}</select></label><label className="text-xs font-bold text-[#526158]">Shared alt text <span className="font-normal text-[#96a098]">(optional)</span><input name="altText" className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] px-4 text-sm outline-none focus:border-[#7fa27d]" placeholder="Describe these images for accessibility" /></label></div>
    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (inputRef.current) { inputRef.current.files = event.dataTransfer.files; receiveFiles(event.dataTransfer.files); } }} className="mt-5 rounded-[24px] border-2 border-dashed border-[#cbd6cb] bg-[#f7faf5] p-8 text-center transition hover:border-[#83a17e] hover:bg-[#f2f7ef]">
      <input ref={inputRef} onChange={event => receiveFiles(event.target.files)} className="sr-only" id="media-files" name="files" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple />
      <label htmlFor="media-files" className="cursor-pointer"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f0e2] text-[#164b36]"><UploadCloud className="size-6" /></span><p className="mt-4 font-black">Drop product images here</p><p className="mt-2 text-xs text-[#7a877e]">or click to browse · JPG, PNG, WebP or GIF · 8 MB each · up to 10</p></label>
    </div>
    {previews.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">{previews.map(item => <div key={item.url} className="relative aspect-square overflow-hidden rounded-2xl bg-[#eef1ed]"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.url}')` }} /><span className="absolute inset-x-2 bottom-2 truncate rounded-lg bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur">{item.name}</span></div>)}</div>}
    {(selectionError || state.message) && <p aria-live="polite" className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${!selectionError && state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{!selectionError && state.status === "success" ? <Check className="size-4" /> : <X className="size-4" />}{selectionError || state.message}</p>}
    <button disabled={pending || previews.length === 0 || stores.length === 0 || Boolean(selectionError)} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[#164b36] px-6 text-sm font-black text-white disabled:opacity-40"><ImagePlus className="size-4" />{pending ? "Uploading images…" : `Add ${previews.length || ""} image${previews.length === 1 ? "" : "s"}`}</button>
  </form>;
}
