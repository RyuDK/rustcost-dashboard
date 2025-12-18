import { useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { buildLanguagePrefix } from "@/constants/language";
import type { LanguageCode } from "@/types/i18n";
import type { JSX } from "react/jsx-runtime";
import type { NavItem } from "@/types/nav";
import { LuPanelLeftOpen, LuPanelLeftClose } from "react-icons/lu";
import { formatDateTimeWithGmt, useNow, useTimezone } from "@/shared/time";
import { SidebarNavItem } from "./SidebarNavItem";

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
      const hasChildren = Boolean(item.children?.length);
      const childActive = hasActiveChild(item);
      const isLeafActive = Boolean(item.to) && isPathActive(item.to) && !childActive;
      const isActive = isLeafActive || childActive;

      const itemKey = `${item.translationKey}-${item.to ?? "root"}-${depth}`;
      const isOpen =
        (hasChildren && childActive) || Boolean(openSections[itemKey]);
      const paddingLeft = sidebarOpen ? 12 + depth * 12 : 0;

      return (
        <SidebarNavItem
          key={itemKey}
          item={item}
          depth={depth}
          sidebarOpen={sidebarOpen}
          isOpen={isOpen}
          isActive={isActive}
          isLeafActive={isLeafActive}
          onToggle={toggleSection}
          itemKey={itemKey}
          paddingLeft={paddingLeft}
          buildLinkPath={buildLinkPath}
          labelText={t(item.translationKey)}
          renderChildren={renderNavItems}
        />
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
        {sidebarOpen && (
          <div className="shrink-0 sticky bottom-0 z-10 bg-(--bg-muted) dark:bg-(--surface-dark) border-t border-(--border)">
            <div className="px-4 py-3 text-center text-[11px] leading-relaxed text-(--text-muted) dark:text-(--text-muted)">
              <div className="font-mono text-[11px]">{formattedNow}</div>
              <div className="mt-1 text-xs">
                {"ver "}
                {__APP_VERSION__}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
