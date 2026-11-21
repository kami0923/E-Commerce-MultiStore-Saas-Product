export default function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite" aria-label="Loading workspace">
      <div className="dashboard-loading-heading">
        <span className="dashboard-loading-block dashboard-loading-icon" />
        <div><span className="dashboard-loading-block dashboard-loading-kicker" /><span className="dashboard-loading-block dashboard-loading-title" /><span className="dashboard-loading-block dashboard-loading-copy" /></div>
      </div>
      <div className="dashboard-loading-metrics">
        {[0, 1, 2].map(item => <span key={item} className="dashboard-loading-block dashboard-loading-metric" />)}
      </div>
      <div className="dashboard-loading-panel">
        <span className="dashboard-loading-block dashboard-loading-panel-title" />
        {[0, 1, 2, 3].map(item => <span key={item} className="dashboard-loading-block dashboard-loading-row" />)}
      </div>
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
