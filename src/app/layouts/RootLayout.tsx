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
import { navItems } from "@/constants/nav";
import type { NavItem } from "@/types/nav";
import { IoChevronDown } from "react-icons/io5";
import type { JSX } from "react/jsx-runtime";
import { Sidebar } from "./Sidebar";

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
    item.children?.some(
      (child) => isPathActive(child.to) || hasActiveChild(child)
    ) ?? false;

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
        flex items-center rounded-md py-1 text-sm transition-colors
        ${sidebarOpen ? "gap-2 px-2" : "justify-center px-0"}
        ${
          isActive
            ? `bg-[var(--primary)]/20 text-[var(--primary)] dark:bg-[var(--primary)]/25 dark:text-[var(--primary)]`
            : `text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-hover)]/15 dark:text-[var(--text-muted)] dark:hover:text-[var(--primary)] dark:hover:bg-[var(--primary-hover)]/20`
        }
      `;
      const linkClasses = `
        flex flex-1 items-center
        ${sidebarOpen ? "gap-3 px-1 py-1" : "justify-center px-0 py-2"}
        text-inherit no-underline
      `;
      const toggleClasses = `
        flex flex-1 items-center
        ${sidebarOpen ? "gap-3 px-1 py-1" : "justify-center px-0 py-2"}
        text-left
      `;

      const label = sidebarOpen ? (
        <div className="flex w-full items-center gap-3">
          <Icon className="text-xl min-w-5" />
          <span className="truncate">{t(item.translationKey)}</span>
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center">
          <Icon className="text-2xl" />
        </div>
      );

      return (
        <li key={itemKey}>
          <div className={rowClasses} style={{ paddingLeft }}>
            {item.to ? (
              <NavLink
                to={buildLinkPath(item.to)}
                end={item.to === "/"}
                className={linkClasses}
              >
                {label}
              </NavLink>
            ) : (
              <button
                type="button"
                onClick={() => toggleSection(itemKey)}
                className={toggleClasses}
              >
                {label}
              </button>
            )}

            {hasChildren && sidebarOpen && (
              <button
                type="button"
                aria-label={
                  isOpen
                    ? t("common.actions.collapse")
                    : t("common.actions.expand")
                }
                onClick={() => toggleSection(itemKey)}
                className="flex h-8 w-8 items-center justify-center text-(--text-muted) transition"
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
        bg-(--bg) text-(--text)
        dark:bg-(--bg) dark:text-(--text)
        transition-colors
      "
    >
      {/* ---------------- HEADER ---------------- */}
      <Header />

      {/* ---------------- LAYOUT ---------------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---------------- SIDEBAR ---------------- */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          activeLanguage={activeLanguage}
          items={navItems}
        />

        {/* ---------------- CONTENT ---------------- */}
        <main
          className="
            flex-1 overflow-auto p-6 
            bg-(--bg) text-(--text)
            dark:bg-(--bg) dark:text-(--text)
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
