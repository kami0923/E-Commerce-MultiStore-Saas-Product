import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StoreForm } from "@/components/store-form";
import { businessOptions } from "@/data/platform";

export default async function NewStorePage() {
  const businesses = await businessOptions();
  return <div className="mx-auto max-w-3xl"><Link href="/dashboard/stores" className="inline-flex items-center gap-2 text-sm font-bold text-[#607067]"><ArrowLeft className="size-4" /> Stores</Link><div className="mt-6"><StoreForm businesses={businesses} /></div></div>;
}
