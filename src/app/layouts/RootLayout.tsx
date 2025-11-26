import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useState } from "react";
import { Header } from "./Header";

import {
  IoSpeedometerOutline,
  IoTrendingUpOutline,
  IoConstructOutline,
  IoSettingsOutline,
  IoLayersOutline,
  IoGitBranchOutline,
  IoCubeOutline,
  IoFileTrayFullOutline,
  IoAlertCircleOutline,
  IoHardwareChipOutline,
} from "react-icons/io5";

const navItems = [
  { to: "/", translationKey: "nav.dashboard", icon: IoSpeedometerOutline },
  { to: "/trends", translationKey: "nav.trends", icon: IoTrendingUpOutline },
  {
    to: "/efficiency",
    translationKey: "nav.efficiency",
    icon: IoConstructOutline,
  },
  { to: "/workloads", translationKey: "nav.workloads", icon: IoLayersOutline },
  {
    to: "/resources",
    translationKey: "nav.resources",
    icon: IoCubeOutline,
  },
  {
    to: "/allocation",
    translationKey: "nav.allocation",
    icon: IoGitBranchOutline,
  },
  {
    to: "/metrics",
    translationKey: "nav.metrics",
    icon: IoFileTrayFullOutline,
  },
  { to: "/alerts", translationKey: "nav.alerts", icon: IoAlertCircleOutline },
  { to: "/system", translationKey: "nav.system", icon: IoHardwareChipOutline },
  { to: "/settings", translationKey: "nav.settings", icon: IoSettingsOutline },
];

export const RootLayout = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className="
        h-screen flex flex-col 
        bg-[var(--bg)] text-[var(--text)]
        dark:bg-[var(--bg)] dark:text-[var(--text)]
        transition-colors
      "
    >
      {/* ---------------- HEADER ---------------- */}
      <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />

      {/* ---------------- LAYOUT ---------------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---------------- SIDEBAR ---------------- */}
        <aside
          className={`
            ${sidebarOpen ? "w-64" : "w-16"}
            transition-all duration-300
            border-r border-[var(--border)]
            bg-[var(--bg-muted)]/50 backdrop-blur

            dark:border-[var(--border)]
            dark:bg-[var(--bg-muted)]/40
            flex flex-col h-full
          `}
        >
          <div className="p-4 text-center font-semibold text-[var(--primary)] dark:text-[var(--primary)]">
            {sidebarOpen ? "Navigation" : null}
          </div>

          <nav className="flex-1 overflow-auto">
            <ul className="flex flex-col gap-1 px-2">
              {navItems.map(({ to, translationKey, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `
                        flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                        ${
                          isActive
                            ? `
                              bg-[var(--primary)]/20 
                              text-[var(--primary)]
                              dark:bg-[var(--primary)]/25
                              dark:text-[var(--primary)]
                            `
                            : `
                              text-[var(--text-muted)] 
                              hover:text-[var(--primary)] 
                              hover:bg-[var(--primary-hover)]/15
                              dark:text-[var(--text-muted)]
                              dark:hover:text-[var(--primary)]
                              dark:hover:bg-[var(--primary-hover)]/20
                            `
                        }
                      `
                    }
                  >
                    <Icon className="text-xl min-w-[20px]" />
                    {sidebarOpen && (
                      <span className="truncate">{t(translationKey)}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-3 text-center text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            {sidebarOpen ? `Theme: ${theme}` : null}
          </div>
        </aside>

        {/* ---------------- CONTENT ---------------- */}
        <main
          className="
            flex-1 overflow-auto p-6 
            bg-[var(--bg)] text-[var(--text)]
            dark:bg-[var(--bg)] dark:text-[var(--text)]
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
