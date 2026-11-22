import { LoadingWindow } from "@/components/loading-window";

export default function DashboardLoading() {
  return <div className="route-loading-curtain route-loading-dashboard"><LoadingWindow label="Opening your window" compact /></div>;
}
