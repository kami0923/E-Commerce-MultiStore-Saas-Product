import type { CSSProperties } from "react";

export type LoadingWindowIdentity = {
  name: string;
  theme?: string;
  accent?: string;
  surface?: string;
  ink?: string;
  highlight?: string;
};

const meridianIdentity: LoadingWindowIdentity = { name: "Meridian", theme: "meridian", accent: "#0b2b22", surface: "#78d9d3", ink: "#f0fff9", highlight: "#c9f269" };

export function LoadingWindow({ label = "Opening your window", compact = false, identity = meridianIdentity }: { label?: string; compact?: boolean; identity?: LoadingWindowIdentity }) {
  const monogram = identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "M";
  const style = {
    "--loader-accent": identity.accent || meridianIdentity.accent,
    "--loader-surface": identity.surface || meridianIdentity.surface,
    "--loader-ink": identity.ink || meridianIdentity.ink,
    "--loader-highlight": identity.highlight || meridianIdentity.highlight,
  } as CSSProperties;
  return (
    <div className="loading-window" style={style} data-loader-theme={identity.theme || "meridian"} data-compact={compact ? "true" : "false"} role="status" aria-live="polite">
      <div className="loading-window-frame" aria-hidden="true">
        <div className="loading-window-scene">
          <span className="loading-window-sun" />
          <span className="loading-window-cloud loading-window-cloud-one" />
          <span className="loading-window-cloud loading-window-cloud-two" />
          <span className="loading-window-building loading-window-building-one" />
          <span className="loading-window-building loading-window-building-two" />
          <span className="loading-window-display loading-window-display-one"><i /></span>
          <span className="loading-window-display loading-window-display-two"><i /></span>
          <span className="loading-window-rail"><i /><i /><i /></span>
        </div>
        <span className="loading-window-shutter loading-window-shutter-left"><i>{monogram}</i></span>
        <span className="loading-window-shutter loading-window-shutter-right"><i>{identity.name}</i></span>
        <span className="loading-window-glint" />
      </div>
      <div className="loading-window-copy"><span>{identity.name}</span><b>{label}</b></div>
      <span className="loading-window-progress" aria-hidden="true"><i /></span>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
