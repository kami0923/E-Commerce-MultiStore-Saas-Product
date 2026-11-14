"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { Check, ImagePlus, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  registerBlobMediaBatchAction,
  uploadMediaAction,
  type MediaActionState,
} from "@/app/dashboard/media/actions";
import {
  MEDIA_ALLOWED_TYPES,
  MEDIA_EXTENSION_BY_TYPE,
  MEDIA_MAX_DIRECT_BATCH_BYTES,
  MEDIA_MAX_FILE_BYTES,
  MEDIA_MAX_FILES_PER_BATCH,
} from "@/lib/media-limits";

const initialState: MediaActionState = { status: "idle" };
const allowedTypes = new Set<string>(MEDIA_ALLOWED_TYPES);

type StoreOption = { id: string; tenantId: string; name: string; tenant: { name: string } };

export function MediaUploader({ stores, uploadMode }: { stores: StoreOption[]; uploadMode: "vercel-blob" | "server" }) {
  const router = useRouter();
  const [serverState, serverAction, serverPending] = useActionState(uploadMediaAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id || "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const [directState, setDirectState] = useState<MediaActionState>(initialState);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedStore = stores.find(store => store.id === storeId);
  const state = uploadMode === "vercel-blob" ? directState : serverState;
  const pending = uploadMode === "vercel-blob" ? uploading : serverPending;

  useEffect(() => () => previews.forEach(item => URL.revokeObjectURL(item.url)), [previews]);

  function receiveFiles(fileList: FileList | null) {
    previews.forEach(item => URL.revokeObjectURL(item.url));
    const selected = fileList ? [...fileList] : [];
    let error = "";

    if (selected.length > MEDIA_MAX_FILES_PER_BATCH) {
      error = `Choose no more than ${MEDIA_MAX_FILES_PER_BATCH} images at a time.`;
    } else {
      const unsupported = selected.find(file => !allowedTypes.has(file.type));
      const oversized = selected.find(file => file.size > MEDIA_MAX_FILE_BYTES);
      const totalBytes = selected.reduce((sum, file) => sum + file.size, 0);
      if (unsupported) error = `${unsupported.name} is not a supported JPG, PNG, WebP or GIF image.`;
      else if (oversized) error = `${oversized.name} is larger than 12 MB.`;
      else if (uploadMode === "vercel-blob" && totalBytes > MEDIA_MAX_DIRECT_BATCH_BYTES) error = "Select a maximum of 120 MB per upload batch.";
    }

    setSelectionError(error);
    setFiles(error ? [] : selected);
    setPreviews(error ? [] : selected.map(file => ({ name: file.name, url: URL.createObjectURL(file) })));
    setDirectState(initialState);
    setCompleted(0);
  }

  async function submitDirect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStore || files.length === 0 || selectionError) return;

    setUploading(true);
    setCompleted(0);
    setDirectState(initialState);
    const formData = new FormData(event.currentTarget);
    const altText = String(formData.get("altText") || "").trim();
    const uploaded: { url: string; pathname: string; originalName: string }[] = [];
    let failedUploads = 0;

    try {
      for (let offset = 0; offset < files.length; offset += 3) {
        const batch = files.slice(offset, offset + 3);
        const results = await Promise.allSettled(batch.map(async file => {
          const extension = MEDIA_EXTENSION_BY_TYPE[file.type as keyof typeof MEDIA_EXTENSION_BY_TYPE];
          const pathname = `tenants/${selectedStore.tenantId}/stores/${selectedStore.id}/${crypto.randomUUID()}.${extension}`;
          const blob = await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/media-upload",
            clientPayload: JSON.stringify({ tenantId: selectedStore.tenantId, storeId: selectedStore.id }),
            contentType: file.type,
            multipart: file.size > 5 * 1024 * 1024,
          });
          setCompleted(value => value + 1);
          return { url: blob.url, pathname: blob.pathname, originalName: file.name.slice(0, 180) };
        }));
        for (const result of results) {
          if (result.status === "fulfilled") uploaded.push(result.value);
          else failedUploads += 1;
        }
      }

      if (uploaded.length === 0) throw new Error("No images were uploaded");
      const result = await registerBlobMediaBatchAction({ tenantId: selectedStore.tenantId, storeId: selectedStore.id, altText: altText || undefined, assets: uploaded });
      if (result.status === "success") {
        previews.forEach(item => URL.revokeObjectURL(item.url));
        setFiles([]);
        setPreviews([]);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
      setDirectState(failedUploads > 0 && result.status === "success"
        ? { status: "error", message: `${uploaded.length} images were added, but ${failedUploads} could not be uploaded. Please select those images and try again.` }
        : result);
    } catch (error) {
      console.error("Direct media upload failed", error);
      setDirectState({ status: "error", message: `The upload stopped after ${uploaded.length} of ${files.length} images. Please try the remaining images again.` });
    } finally {
      setUploading(false);
    }
  }

  return <form action={uploadMode === "server" ? serverAction : undefined} onSubmit={uploadMode === "vercel-blob" ? submitDirect : undefined} className="rounded-[28px] border border-[#dfe6df] bg-white p-5 shadow-[0_16px_50px_rgba(16,35,26,.05)] sm:p-7">
    <input type="hidden" name="tenantId" value={selectedStore?.tenantId || ""} />
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold text-[#526158]">Store<select name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] bg-white px-4 text-sm outline-none" required>{stores.map(store => <option key={store.id} value={store.id}>{store.tenant.name} · {store.name}</option>)}</select></label><label className="text-xs font-bold text-[#526158]">Shared alt text <span className="font-normal text-[#96a098]">(optional)</span><input name="altText" className="mt-2 h-12 w-full rounded-xl border border-[#dfe5df] px-4 text-sm outline-none focus:border-[#7fa27d]" placeholder="Describe these images for accessibility" /></label></div>
    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (inputRef.current) { inputRef.current.files = event.dataTransfer.files; receiveFiles(event.dataTransfer.files); } }} className="mt-5 rounded-[24px] border-2 border-dashed border-[#cbd6cb] bg-[#f7faf5] p-8 text-center transition hover:border-[#83a17e] hover:bg-[#f2f7ef]">
      <input ref={inputRef} onChange={event => receiveFiles(event.target.files)} className="sr-only" id="media-files" name="files" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple />
      <label htmlFor="media-files" className="cursor-pointer"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f0e2] text-[#164b36]"><UploadCloud className="size-6" /></span><p className="mt-4 font-black">Drop product images here</p><p className="mt-2 text-xs text-[#7a877e]">or click to browse · JPG, PNG, WebP or GIF · 12 MB each · up to 20 images · 120 MB per batch</p></label>
    </div>
    {previews.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">{previews.map(item => <div key={item.url} className="relative aspect-square overflow-hidden rounded-2xl bg-[#eef1ed]"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.url}')` }} /><span className="absolute inset-x-2 bottom-2 truncate rounded-lg bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur">{item.name}</span></div>)}</div>}
    {(selectionError || state.message) && <p aria-live="polite" className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${!selectionError && state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{!selectionError && state.status === "success" ? <Check className="size-4" /> : <X className="size-4" />}{selectionError || state.message}</p>}
    <button type="submit" disabled={pending || previews.length === 0 || stores.length === 0 || Boolean(selectionError)} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[#164b36] px-6 text-sm font-black text-white disabled:opacity-40"><ImagePlus className="size-4" />{pending ? `Uploading ${completed}/${files.length}…` : `Add ${previews.length || ""} image${previews.length === 1 ? "" : "s"}`}</button>
  </form>;
}
