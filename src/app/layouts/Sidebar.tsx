import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { buildLanguagePrefix } from "@/constants/language";
import type { LanguageCode } from "@/types/i18n";
import { IoChevronDown } from "react-icons/io5";
import type { JSX } from "react/jsx-runtime";
import type { NavItem } from "@/types/nav";
import { LuPanelLeftOpen, LuPanelLeftClose } from "react-icons/lu";
import { formatDateTimeWithGmt, useNow, useTimezone } from "@/shared/time";

type SidebarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeLanguage: LanguageCode;
  items: NavItem[];
};

export const Sidebar = ({
  sidebarOpen,
  onToggleSidebar,
  activeLanguage,
  items,
}: SidebarProps) => {
  const { t } = useI18n();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const { timeZone } = useTimezone();
  const now = useNow();

  const prefix = useMemo(
    () => buildLanguagePrefix(activeLanguage),
    [activeLanguage]
  );
  const formattedNow = useMemo(
    () => formatDateTimeWithGmt(now, { timeZone }),
    [now, timeZone]
  );

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

  const renderNavItems = (navs: NavItem[], depth = 0): JSX.Element[] =>
    navs.map((item) => {
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
                aria-label={isOpen ? "Collapse" : "Expand"}
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
    <aside
      className={`
  ${sidebarOpen ? "w-64" : "w-[68px]"}
  transition-all duration-300
  border-r border-(--border)
  bg-(--bg-muted) dark:bg-(--surface-dark) dark:border-(--border)
  h-full
  overflow-hidden
`}
    >
      <div className="h-full flex flex-col">
        {/* header */}
        <div
          className={`
      sticky top-0 z-10
      p-4 pt-6 grid items-center
      bg-(--bg-muted)
      dark:bg-(--surface-dark)

      ${
        sidebarOpen
          ? "grid-cols-[auto_32px] pl-8 pr-6"
          : "grid-cols-[32px] justify-center"
      }
    `}
        >
          {sidebarOpen && (
            <span
              className={`
        font-semibold text-(--primary) dark:text-(--primary)
        transition-opacity duration-200
      `}
            >
              Navigation
            </span>
          )}

          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-(--primary-hover)/15"
          >
            {sidebarOpen ? (
              <LuPanelLeftClose className="h-5 w-5" />
            ) : (
              <LuPanelLeftOpen className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* scroll area */}
        <div className="flex-1 overflow-y-auto scroll-area">
          <nav className={sidebarOpen ? "pr-1" : "pr-0"}>
            <ul className="flex flex-col gap-1 px-2 pb-4">
              {renderNavItems(items)}
            </ul>
          </nav>
        </div>

        {/* footer */}
        <div className="shrink-0 sticky bottom-0 z-10 bg-(--bg-muted) dark:bg-(--surface-dark) border-t border-(--border)">
          <div className="px-4 py-3 text-center text-[11px] leading-relaxed text-(--text-muted) dark:text-(--text-muted)">
            <div className="font-mono text-[11px]">{formattedNow}</div>
            <div className="mt-1 text-xs">
              {"ver "}
              {__APP_VERSION__}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
