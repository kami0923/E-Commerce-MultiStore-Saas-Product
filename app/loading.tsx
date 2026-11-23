"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadingIdentityStorageKey } from "@/components/global-loading-curtain";
import { LoadingWindow, type LoadingWindowIdentity } from "@/components/loading-window";

const meridianIdentity: LoadingWindowIdentity = { name: "Meridian", theme: "meridian", accent: "#0b2b22", surface: "#78d9d3", ink: "#f0fff9", highlight: "#c9f269" };

export default function Loading() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<LoadingWindowIdentity | null>(null);

  useEffect(() => {
    let nextIdentity = meridianIdentity;
    if (!pathname.startsWith("/dashboard")) {
      queueMicrotask(() => setIdentity(nextIdentity));
      return;
    }

    try {
      const stored = localStorage.getItem(loadingIdentityStorageKey);
      const parsed = stored ? JSON.parse(stored) as LoadingWindowIdentity : null;
      if (parsed?.name) nextIdentity = parsed;
    } catch { /* Keep the Meridian fallback. */ }
    queueMicrotask(() => setIdentity(nextIdentity));
  }, [pathname]);

  if (!identity) return null;
  return <div className="route-loading-curtain"><LoadingWindow label="Opening your window" identity={identity} /></div>;
}
