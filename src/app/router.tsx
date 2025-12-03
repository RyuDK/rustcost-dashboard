import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { TrendsPage } from "@/features/trends/pages/TrendsPage";
import { EfficiencyPage } from "@/features/efficiency/pages/EfficiencyPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { WorkloadsPage } from "@/features/workloads/WorkloadsPage";
import { WorkloadDetailPage } from "@/features/workloadDetail/WorkloadDetailPage";
import { ResourcesPage } from "@/features/resources/ResourcesPage";
import { AllocationPage } from "@/features/allocation/AllocationPage";
import { MetricsPage } from "@/features/metrics/MetricsPage";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { SystemPage } from "@/features/system/SystemPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LoadingPage } from "@/features/loading/pages/LoadingPage";
import type { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { isLessThan3Hours } from "@/shared/utils/time";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "trends", element: <TrendsPage /> },
      { path: "efficiency", element: <EfficiencyPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "workloads", element: <WorkloadsPage /> },
      { path: "workloads/:workloadId", element: <WorkloadDetailPage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "allocation", element: <AllocationPage /> },
      { path: "metrics", element: <MetricsPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "system", element: <SystemPage /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export const AppWithLoading = () => {
  const lastResync = useSelector(
    (state: RootState) => state.system.last_resync_time_utc
  );

  // Read env variable (string)
  const isDebug = import.meta.env.VITE_IS_DEBUG === "1";

  // Normal resync logic unless debug mode is active
  const needsResync =
    !isDebug && (!lastResync || !isLessThan3Hours(lastResync));

  // If no resync done or stale — show loading screen
  if (needsResync) {
    return <LoadingPage />;
  }

  // If resynced — show main app
  return <AppRouter />;
};
