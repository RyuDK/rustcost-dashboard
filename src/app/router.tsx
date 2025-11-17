import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { TrendsPage } from "../features/trends/pages/TrendsPage";
import { EfficiencyPage } from "../features/efficiency/pages/EfficiencyPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { WorkloadsPage } from "../features/workloads/WorkloadsPage";
import { WorkloadDetailPage } from "../features/workloadDetail/WorkloadDetailPage";
import { ResourcesPage } from "../features/resources/ResourcesPage";
import { AllocationPage } from "../features/allocation/AllocationPage";
import { MetricsPage } from "../features/metrics/MetricsPage";
import { AlertsPage } from "../features/alerts/AlertsPage";
import { SystemPage } from "../features/system/SystemPage";

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

export const AppRouter = () => <RouterProvider router={router} />;
