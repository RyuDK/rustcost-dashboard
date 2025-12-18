import { NavLink } from "react-router-dom";
import { IoChevronDown } from "react-icons/io5";
import type { JSX } from "react/jsx-runtime";
import type { NavItem } from "@/types/nav";
import { useI18n } from "@/app/providers/i18n/useI18n";

type SidebarNavItemProps = {
  item: NavItem;
  depth: number;
  sidebarOpen: boolean;
  isOpen: boolean;
  isActive: boolean;
  isLeafActive: boolean;
  onToggle: (key: string) => void;
  itemKey: string;
  paddingLeft: number;
  buildLinkPath: (to: string) => string;
  labelText: string;
  renderChildren: (navs: NavItem[], depth: number) => JSX.Element[];
};

export const SidebarNavItem = ({
  item,
  depth,
  sidebarOpen,
  isOpen,
  isActive,
  isLeafActive,
  onToggle,
  itemKey,
  paddingLeft,
  buildLinkPath,
  labelText,
  renderChildren,
}: SidebarNavItemProps) => {
  const { t } = useI18n();
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);

  /**
   * Active state definitions
   */
  const isAncestorActive = isActive && !isLeafActive;

  /**
   * Base row layout (always applied)
   */
  const rowBaseClasses = `
    flex items-center rounded-md text-sm transition-colors
  `;

  /**
   * Layout depending on sidebar state
   */
  const rowLayoutClasses = sidebarOpen
    ? "gap-2 px-2 py-1"
    : "justify-center p-0";

  /**
   * Visual states
   */
  const rowLeafActiveClasses = `
    relative bg-white/[0.06] text-[var(--primary)]
    before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]
    before:rounded-l-md before:bg-[#FACC15] before:content-['']
  `;

  const rowAncestorActiveClasses = `
    relative bg-white/[0.025] text-[var(--primary)]
    [&_svg]:text-[var(--primary)]
    before:absolute before:left-0 before:top-0 before:h-full
    before:w-[2px] before:bg-[#FACC15]/50 before:content-['']
    hover:bg-white/[0.04]
  `;

  const rowInactiveClasses = `
    text-[var(--text-muted)]
    hover:text-[var(--primary)]
    hover:bg-[var(--primary-hover)]/15
    dark:text-[var(--text-muted)]
    dark:hover:text-[var(--primary)]
    dark:hover:bg-[var(--primary-hover)]/20
  `;

  /**
   * Pick visual state
   */
  const rowStateClasses = isLeafActive
    ? rowLeafActiveClasses
    : isAncestorActive
    ? rowAncestorActiveClasses
    : rowInactiveClasses;

  /**
   * Final row classes
   */
  const rowClasses = `
    ${rowBaseClasses}
    ${rowLayoutClasses}
    ${rowStateClasses}
  `;

  /**
   * Link & toggle layouts
   */
  const linkClasses = `
    flex flex-1 items-center
    ${sidebarOpen ? "gap-3 px-1 py-1" : "justify-center px-0 py-1"}
    text-inherit no-underline
  `;

  const toggleClasses = `
    flex flex-1 items-center
    ${sidebarOpen ? "gap-3 px-1 py-1" : "justify-center px-0 py-2"}
    text-left
  `;

  /**
   * Label rendering
   */
  const label = sidebarOpen ? (
    <div className="flex w-full items-center gap-3">
      <Icon className="min-w-5 text-xl" />
      <span className="truncate">{labelText}</span>
    </div>
  ) : (
    <div className="flex h-10 w-10 items-center justify-center">
      <Icon className="text-2xl" />
    </div>
  );

  return (
    <li>
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
            onClick={() => onToggle(itemKey)}
            className={toggleClasses}
          >
            {label}
          </button>
        )}

        {hasChildren && sidebarOpen && (
          <button
            type="button"
            aria-label={
              isOpen ? t("common.actions.collapse") : t("common.actions.expand")
            }
            onClick={() => onToggle(itemKey)}
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
          {renderChildren(item.children!, depth + 1)}
        </ul>
      )}
    </li>
  );
};
