import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import i18n from "@/i18n/i18n";
import { useI18n } from "@/app/providers/i18n/useI18n";
import {
  buildLanguagePrefix,
  normalizeLanguageCode,
} from "@/constants/language";
import type { LanguageCode } from "@/types/i18n";
import { Header } from "./Header";
import type { IconType } from "react-icons";

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
  IoPricetagOutline,
  IoChevronDown,
} from "react-icons/io5";

type NavItem = {
  to?: string;
  translationKey: string;
  icon: IconType;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  { to: "/", translationKey: "nav.dashboard", icon: IoSpeedometerOutline },
  {
    to: "/workloads",
    translationKey: "nav.workloads",
    icon: IoLayersOutline,
    children: [
      {
        to: "/workloads/metrics",
        translationKey: "nav.metrics",
        icon: IoFileTrayFullOutline,
        children: [
          {
            to: "/workloads/metrics/nodes",
            translationKey: "nav.nodes",
            icon: IoHardwareChipOutline,
          },
          {
            to: "/workloads/metrics/pods",
            translationKey: "nav.pods",
            icon: IoCubeOutline,
          },
          {
            to: "/workloads/metrics/containers",
            translationKey: "nav.containers",
            icon: IoConstructOutline,
          },
        ],
      },
      {
        to: "/workloads/resources",
        translationKey: "nav.resources",
        icon: IoCubeOutline,
        children: [
          {
            to: "/workloads/resources/deployments",
            translationKey: "nav.deployments",
            icon: IoGitBranchOutline,
          },
          {
            to: "/workloads/resources/statefulsets",
            translationKey: "nav.statefulSets",
            icon: IoLayersOutline,
          },
          {
            to: "/workloads/resources/daemonsets",
            translationKey: "nav.daemonSets",
            icon: IoHardwareChipOutline,
          },
          {
            to: "/workloads/resources/jobs",
            translationKey: "nav.jobsCronJobs",
            icon: IoFileTrayFullOutline,
          },
          {
            to: "/workloads/resources/services",
            translationKey: "nav.services",
            icon: IoAlertCircleOutline,
          },
          {
            to: "/workloads/resources/ingresses",
            translationKey: "nav.ingresses",
            icon: IoPricetagOutline,
          },
        ],
      },
    ],
  },
  { to: "/trends", translationKey: "nav.trends", icon: IoTrendingUpOutline },
  {
    to: "/efficiency",
    translationKey: "nav.efficiency",
    icon: IoConstructOutline,
  },
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
  {
    to: "/unit-prices",
    translationKey: "nav.unitPrices",
    icon: IoPricetagOutline, // recommended icon
  },
];

export const RootLayout = () => {
  type LanguageParams = { ["lng"]?: LanguageCode };
  const params = useParams<LanguageParams>();
  const activeLanguage = normalizeLanguageCode(params["lng"]);
  const { t } = useI18n();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const prefix = useMemo(
    () => buildLanguagePrefix(activeLanguage),
    [activeLanguage]
  );

  useEffect(() => {
    if (i18n.language !== activeLanguage) {
      void i18n.changeLanguage(activeLanguage);
    }
  }, [activeLanguage]);

  const buildLinkPath = (to: string) =>
    to === "/" ? `${prefix}/` : `${prefix}${to}`;

  const normalizePath = (path: string) =>
    path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;

  const isPathActive = (to?: string) => {
    if (!to) return false;
    const target = normalizePath(buildLinkPath(to));
    const current = normalizePath(location.pathname);
    return to === "/" ? current === target : current.startsWith(target);
  };

  const hasActiveChild = (item: NavItem): boolean =>
    item.children?.some((child) => isPathActive(child.to) || hasActiveChild(child)) ??
    false;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNavItems = (items: NavItem[], depth = 0): JSX.Element[] =>
    items.map((item) => {
      const Icon = item.icon;
      const hasChildren = Boolean(item.children?.length);
      const childActive = hasActiveChild(item);
      const isActive = isPathActive(item.to) || childActive;
      const itemKey = `${item.translationKey}-${item.to ?? "root"}-${depth}`;
      const isOpen = childActive || openSections[itemKey];
      const paddingLeft = sidebarOpen ? 12 + depth * 12 : 0;
      const rowClasses = `
        flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors
        ${
          isActive
            ? `bg-[var(--primary)]/20 text-[var(--primary)] dark:bg-[var(--primary)]/25 dark:text-[var(--primary)]`
            : `text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-hover)]/15 dark:text-[var(--text-muted)] dark:hover:text-[var(--primary)] dark:hover:bg-[var(--primary-hover)]/20`
        }
      `;

      const label = (
        <div className="flex w-full items-center gap-3">
          <Icon className="text-xl min-w-[20px]" />
          {sidebarOpen && (
            <span className="truncate">{t(item.translationKey)}</span>
          )}
        </div>
      );

      return (
        <li key={itemKey}>
          <div
            className={rowClasses}
            style={{ paddingLeft }}
          >
            {item.to ? (
              <NavLink
                to={buildLinkPath(item.to)}
                end={item.to === "/"}
                className="flex flex-1 items-center gap-3 px-1 py-1 text-inherit no-underline"
              >
                {label}
              </NavLink>
            ) : (
              <button
                type="button"
                onClick={() => toggleSection(itemKey)}
                className="flex flex-1 items-center gap-3 px-1 py-1 text-left"
              >
                {label}
              </button>
            )}

            {hasChildren && sidebarOpen && (
              <button
                type="button"
                aria-label={isOpen ? "Collapse" : "Expand"}
                onClick={() => toggleSection(itemKey)}
                className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)] transition"
              >
                <IoChevronDown
                  className={`text-lg transition-transform ${
                    isOpen ? "-rotate-180" : "rotate-0"
                  }`}
                />
              </button>
            )}
          </div>

          {hasChildren && isOpen && sidebarOpen && (
            <ul className="mt-1 flex flex-col gap-1">
              {renderNavItems(item.children!, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

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
            dark:bg-[var(--surface-dark)]/40
            flex flex-col h-full
          `}
        >
          <div className="p-4 text-center font-semibold text-[var(--primary)] dark:text-[var(--primary)]">
            {sidebarOpen ? "Navigation" : null}
          </div>

          <nav className="flex-1 overflow-auto">
            <ul className="flex flex-col gap-1 px-2">
              {renderNavItems(navItems)}
            </ul>
          </nav>

          <div className="p-3 text-center text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            {__APP_VERSION__}
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
