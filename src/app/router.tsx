import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { TrendsPage } from "../features/trends/pages/TrendsPage";
import { EfficiencyPage } from "../features/efficiency/pages/EfficiencyPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "trends", element: <TrendsPage /> },
      { path: "efficiency", element: <EfficiencyPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
