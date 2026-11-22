"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingWindow, type LoadingWindowIdentity } from "@/components/loading-window";

type Phase = "closed" | "loading" | "opening";

const defaultIdentity: LoadingWindowIdentity = { name: "Meridian", theme: "meridian", accent: "#0b2b22", surface: "#78d9d3", ink: "#f0fff9", highlight: "#c9f269" };

function identityFrom(element?: Element | null): LoadingWindowIdentity {
  const scope = element?.closest<HTMLElement>("[data-loading-name]") || document.querySelector<HTMLElement>("[data-loading-name]");
  if (!scope) return defaultIdentity;
  return {
    name: scope.dataset.loadingName || defaultIdentity.name,
    theme: scope.dataset.loadingTheme || "meridian",
    accent: scope.dataset.loadingAccent || defaultIdentity.accent,
    surface: scope.dataset.loadingSurface || defaultIdentity.surface,
    ink: scope.dataset.loadingInk || defaultIdentity.ink,
    highlight: scope.dataset.loadingHighlight || defaultIdentity.highlight,
  };
}

export function GlobalLoadingCurtain() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("closed");
  const [identity, setIdentity] = useState<LoadingWindowIdentity>(defaultIdentity);
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
    const wait = Math.max(0, 560 - elapsed);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setCurtainPhase("opening");
      closeTimer.current = setTimeout(() => setCurtainPhase("closed"), 760);
    }, wait);
  }, [setCurtainPhase]);

  const start = useCallback((nextIdentity?: LoadingWindowIdentity) => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    startedAt.current = Date.now();
    setIdentity(nextIdentity || identityFrom());
    setCurtainPhase("loading");
    fallbackTimer.current = setTimeout(() => {
      setCurtainPhase("opening");
      closeTimer.current = setTimeout(() => setCurtainPhase("closed"), 760);
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
      if (anchor && anchor.getAttribute("aria-disabled") !== "true" && anchor.target !== "_blank" && anchor.origin === window.location.origin && anchor.pathname !== window.location.pathname) {
        start(identityFrom(anchor));
      }
    };
    const onSubmit = (event: SubmitEvent) => start(identityFrom(event.target instanceof Element ? event.target : null));
    const onStart = (event: Event) => start(event instanceof CustomEvent && event.detail ? event.detail : identityFrom());
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
  const style = { "--loader-accent": identity.accent, "--loader-surface": identity.surface, "--loader-ink": identity.ink, "--loader-highlight": identity.highlight } as CSSProperties;
  return <div className="global-loading-curtain" style={style} data-loader-theme={identity.theme || "meridian"} data-phase={phase}><LoadingWindow identity={identity} /></div>;
}
