"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingWindow } from "@/components/loading-window";

type Phase = "closed" | "loading" | "opening";

export function GlobalLoadingCurtain() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("closed");
  const phaseRef = useRef<Phase>("closed");
  const startedAt = useRef(0);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCurtainPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const finish = useCallback(() => {
    if (phaseRef.current === "closed") return;
    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, 680 - elapsed);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setCurtainPhase("opening");
      closeTimer.current = setTimeout(() => setCurtainPhase("closed"), 620);
    }, wait);
  }, [setCurtainPhase]);

  const start = useCallback(() => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    startedAt.current = Date.now();
    setCurtainPhase("loading");
    fallbackTimer.current = setTimeout(() => {
      setCurtainPhase("opening");
      closeTimer.current = setTimeout(() => setCurtainPhase("closed"), 620);
    }, 2600);
  }, [setCurtainPhase]);

  useEffect(() => {
    if (phaseRef.current !== "closed") finish();
  }, [finish, pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (anchor && anchor.target !== "_blank" && anchor.origin === window.location.origin && anchor.pathname !== window.location.pathname) {
        window.setTimeout(() => {
          if (!event.defaultPrevented) start();
        }, 0);
      }
    };
    const onSubmit = () => start();
    const onStart = () => start();
    const onFinish = () => finish();
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("meridian:loading-start", onStart);
    document.addEventListener("meridian:loading-finish", onFinish);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("meridian:loading-start", onStart);
      document.removeEventListener("meridian:loading-finish", onFinish);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [finish, start]);

  if (phase === "closed") return null;
  return <div className="global-loading-curtain" data-phase={phase}><LoadingWindow /></div>;
}
