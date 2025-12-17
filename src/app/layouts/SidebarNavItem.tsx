import { NavLink } from "react-router-dom";
import { IoChevronDown } from "react-icons/io5";
import type { JSX } from "react/jsx-runtime";
import type { NavItem } from "@/types/nav";

type SidebarNavItemProps = {
  item: NavItem;
  depth: number;
  sidebarOpen: boolean;
  isOpen: boolean;
  isActive: boolean;
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
  onToggle,
  itemKey,
  paddingLeft,
  buildLinkPath,
  labelText,
  renderChildren,
}: SidebarNavItemProps) => {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);

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
            aria-label={isOpen ? "Collapse" : "Expand"}
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
