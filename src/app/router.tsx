import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { TrendsPage } from "@/features/trends/pages/TrendsPage";
import { EfficiencyPage } from "@/features/efficiency/pages/EfficiencyPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
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
import { buildLanguagePrefix } from "@/constants/language";
import { useEffect } from "react";
import { UnitPricesPage } from "@/features/unitPrices/pages/UnitPricesPage";
import MetricOverviewPage from "@/features/workloads/metrics/pages/MetricsOverviewPage";
import { NodesPage } from "@/features/workloads/metrics/pages/NodesPage";
import { PodsPage } from "@/features/workloads/metrics/pages/PodsPage";
import { ContainersPage } from "@/features/workloads/metrics/pages/ContainersPage";
import { ResourcesOverviewPage } from "@/features/workloads/resources/pages/ResourcesOverviewPage";
import { DeploymentsPage } from "@/features/workloads/resources/pages/DeploymentsPage";
import { StatefulSetsPage } from "@/features/workloads/resources/pages/StatefulSetsPage";
import { DaemonSetsPage } from "@/features/workloads/resources/pages/DaemonSetsPage";
import { JobsCronJobsPage } from "@/features/workloads/resources/pages/JobsCronJobsPage";
import { ServicesPage } from "@/features/workloads/resources/pages/ServicesPage";
import { IngressesPage } from "@/features/workloads/resources/pages/IngressesPage";
import WorkloadsPage from "@/features/workloads/pages/WorkloadsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={buildLanguagePrefix()} replace />,
  },
  {
    path: "/:lng",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "trends", element: <TrendsPage /> },
      { path: "efficiency", element: <EfficiencyPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "workloads", element: <WorkloadsPage /> },
      { path: "workloads/:workloadId", element: <WorkloadDetailPage /> },
      { path: "workloads/metrics", element: <MetricOverviewPage /> },
      { path: "workloads/metrics/nodes", element: <NodesPage /> },
      { path: "workloads/metrics/pods", element: <PodsPage /> },
      { path: "workloads/metrics/containers", element: <ContainersPage /> },
      { path: "workloads/resources", element: <ResourcesOverviewPage /> },
      { path: "workloads/resources/deployments", element: <DeploymentsPage /> },
      {
        path: "workloads/resources/statefulsets",
        element: <StatefulSetsPage />,
      },
      { path: "workloads/resources/daemonsets", element: <DaemonSetsPage /> },
      { path: "workloads/resources/jobs", element: <JobsCronJobsPage /> },
      { path: "workloads/resources/services", element: <ServicesPage /> },
      { path: "workloads/resources/ingresses", element: <IngressesPage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "allocation", element: <AllocationPage /> },
      { path: "metrics", element: <MetricsPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "system", element: <SystemPage /> },
      { path: "unit-prices", element: <UnitPricesPage /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export const AppWithLoading = () => {
  const lastResync = useSelector(
    (state: RootState) => state.system.last_resync_time_utc
  );
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      window.history.replaceState(null, "", buildLanguagePrefix());
    }
  }, []);

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
