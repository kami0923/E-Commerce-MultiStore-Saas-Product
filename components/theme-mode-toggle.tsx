"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type ColorMode = "light" | "dark";

const STORAGE_KEY = "meridian-color-mode";
const MODE_CHANGE_EVENT = "meridian-color-mode-change";

function applyColorMode(mode: ColorMode) {
  document.documentElement.dataset.colorMode = mode;
  document.documentElement.style.colorScheme = mode;
}

export function ThemeModeToggle({ className }: { className?: string }) {
  const mode = useSyncExternalStore(
    (onStoreChange) => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || (event.newValue !== "light" && event.newValue !== "dark")) return;
      applyColorMode(event.newValue);
      onStoreChange();
    };
    window.addEventListener(MODE_CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", syncAcrossTabs);
      return () => {
        window.removeEventListener(MODE_CHANGE_EVENT, onStoreChange);
        window.removeEventListener("storage", syncAcrossTabs);
      };
    },
    () => document.documentElement.dataset.colorMode === "dark" ? "dark" : "light",
    () => "light",
  );

  const nextMode: ColorMode = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      data-current-mode={mode}
      aria-label={`Switch to ${nextMode} theme`}
      title={`Switch to ${nextMode} theme`}
      onClick={() => {
        applyColorMode(nextMode);
        localStorage.setItem(STORAGE_KEY, nextMode);
        window.dispatchEvent(new Event(MODE_CHANGE_EVENT));
      }}
      className={cn("theme-mode-toggle", className)}
    >
      <span className="theme-mode-toggle-track" aria-hidden="true">
        <Sun className="theme-mode-sun" />
        <Moon className="theme-mode-moon" />
        <span className="theme-mode-toggle-thumb" />
      </span>
      <span className="sr-only">Switch to {nextMode} theme</span>
    </button>
  );
}
