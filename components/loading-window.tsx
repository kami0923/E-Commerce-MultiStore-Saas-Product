export function LoadingWindow({ label = "Composing the next view", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className="loading-window" data-compact={compact ? "true" : "false"} role="status" aria-live="polite">
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
        <span className="loading-window-shutter loading-window-shutter-left"><i>M</i></span>
        <span className="loading-window-shutter loading-window-shutter-right"><i>MERIDIAN</i></span>
        <span className="loading-window-glint" />
      </div>
      <div className="loading-window-copy"><span>{label}</span><b>Opening your window</b></div>
      <span className="loading-window-progress" aria-hidden="true"><i /></span>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
