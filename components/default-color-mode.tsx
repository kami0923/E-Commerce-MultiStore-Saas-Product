"use client";

import { useEffect } from "react";

export function DefaultColorMode({ mode = "dark" }: { mode?: "light" | "dark" }) {
  useEffect(() => {
    const stored = localStorage.getItem("meridian-color-mode");
    if (stored === "light" || stored === "dark") return;
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
    window.dispatchEvent(new Event("meridian-color-mode-change"));
  }, [mode]);
  return null;
}
