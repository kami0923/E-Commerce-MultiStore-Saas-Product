"use client";

import { usePathname } from "next/navigation";
import { LoadingWindow } from "@/components/loading-window";
import { getStorefrontTheme, type StorefrontThemeKey } from "@/lib/storefront-themes";

const verticalThemes: Record<string, StorefrontThemeKey> = { clothing: "atelier", shoes: "kinetic", jewellery: "noir", cosmetics: "canvas", hardware: "forge", "multi-category": "market" };

export function StoreRouteLoading() {
  const pathname = usePathname();
  const slug = decodeURIComponent(pathname.split("/")[2] || "store").replace(/-[a-f0-9]{6}$/i, "");
  const vertical = Object.keys(verticalThemes).find(item => slug.endsWith(`-${item}`));
  const cleanSlug = vertical ? slug.slice(0, -(vertical.length + 1)) : slug;
  const name = cleanSlug.split("-").filter(Boolean).map(word => word.length <= 2 ? word.toUpperCase() : `${word[0]?.toUpperCase()}${word.slice(1)}`).join(" ") || "Your store";
  const themeKey = vertical ? verticalThemes[vertical] : "atelier";
  const theme = getStorefrontTheme(themeKey);
  return <div className="route-loading-curtain"><LoadingWindow label="Opening your window" identity={{ name, theme: themeKey, accent: theme.accent, surface: theme.surface, ink: theme.ink, highlight: theme.highlight }} /></div>;
}
