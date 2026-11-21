"use client";

import { Check, Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { storefrontThemes, type StorefrontThemeKey } from "@/lib/storefront-themes";

const publicThemes = Object.entries(storefrontThemes).filter(([key]) => key !== "luxe") as [StorefrontThemeKey, (typeof storefrontThemes)[StorefrontThemeKey]][];

export function ThemeStudio({ current, enabled }: { current: string; enabled: boolean }) {
  const initial = publicThemes.some(([key]) => key === current) ? current as StorefrontThemeKey : "atelier";
  const [selected, setSelected] = useState<StorefrontThemeKey>(initial);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const theme = storefrontThemes[selected];
  return <div className="theme-studio mt-5">
    <input type="hidden" name="themeKey" value={selected} />
    <div className="theme-studio-grid">
      {publicThemes.map(([key, option]) => <button key={key} type="button" disabled={!enabled} aria-pressed={selected === key} onClick={() => setSelected(key)} className="theme-option">
        <span className="theme-option-swatches"><i style={{ background: option.surface }} /><i style={{ background: option.accent }} /><i style={{ background: option.highlight }} /></span>
        <span><b>{option.label}</b><small>{option.description}</small></span>
        {selected === key && <Check className="theme-option-check" />}
      </button>)}
    </div>
    <div className="theme-preview-shell">
      <div className="theme-preview-toolbar"><span>LIVE DESIGN PREVIEW</span><div>{(["desktop", "tablet", "mobile"] as const).map(item => { const Icon = item === "desktop" ? Monitor : item === "tablet" ? Tablet : Smartphone; return <button key={item} type="button" aria-label={`${item} preview`} aria-pressed={viewport === item} onClick={() => setViewport(item)}><Icon /></button>; })}</div></div>
      <div className={`theme-preview-frame is-${viewport}`} style={{ "--preview-accent": theme.accent, "--preview-surface": theme.surface, "--preview-ink": theme.ink, "--preview-highlight": theme.highlight, "--preview-radius": theme.radius } as React.CSSProperties}>
        <div className="theme-preview-nav"><strong>YOUR BRAND</strong><span>Shop&nbsp;&nbsp; Collections&nbsp;&nbsp; Story</span><i /></div>
        <div className="theme-preview-hero"><div><small>{theme.label}</small><b>Objects worth<br />remembering.</b><button type="button">Explore collection</button></div><div className="theme-preview-object"><i /><i /><i /></div></div>
      </div>
    </div>
  </div>;
}
