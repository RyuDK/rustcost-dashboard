import { NavLink, Outlet } from "react-router-dom";
import { ThemeToggle } from "../../shared/components/ThemeToggle";
import { useI18n } from "../providers/I18nProvider";
import { SUPPORTED_LANGUAGES } from "../../i18n/i18n";
import { useTheme } from "../providers/ThemeProvider";
import { useState } from "react";

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
  { to: "/metrics", translationKey: "nav.metrics", icon: IoFileTrayFullOutline },
  { to: "/alerts", translationKey: "nav.alerts", icon: IoAlertCircleOutline },
  { to: "/system", translationKey: "nav.system", icon: IoHardwareChipOutline },
  { to: "/settings", translationKey: "nav.settings", icon: IoSettingsOutline },
];

export const RootLayout = () => {
  const { t, language, setLanguage } = useI18n();
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
      <header
        className="
          flex items-center justify-between px-4 py-3 
          border-b border-[var(--border)]
          bg-[var(--surface)]/70 backdrop-blur
          dark:border-[var(--border)]
          dark:bg-[var(--surface)]/70
        "
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="
              p-2 rounded-md 
              hover:bg-[var(--overlay)] 
              dark:hover:bg-[var(--overlay)]
              transition
            "
          >
            <img src="/logo-square.webp" alt="Logo" className="h-6 w-6" />
          </button>

          <h1 className="text-lg font-semibold text-[var(--text)] dark:text-[var(-text)]">
            RustCost
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="
              rounded-md border border-[var(--border)] 
              bg-[var(--surface)]
              px-2 py-1 text-sm shadow-sm
              focus:border-[var(--primary)]
              focus:ring-[var(--primary)]

              dark:border-[var(--border)]
              dark:bg-[var(--surface)]
            "
            value={language}
            onChange={(e) =>
              setLanguage(
                e.target.value as (typeof SUPPORTED_LANGUAGES)[number]
              )
            }
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>

          <ThemeToggle />
        </div>
      </header>

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
                      <span className="truncate">
                        {t(translationKey as never)}
                      </span>
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
