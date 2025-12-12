import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: string;
  icon?: ReactNode;
};

interface CommonBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const SharedBreadcrumb = ({ items }: CommonBreadcrumbProps) => (
  <nav
    aria-label="Breadcrumb"
    className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-500"
  >
    {items.map((item, index) => {
      const content = (
        <span className="flex items-center gap-1">
          {item.icon}
          {item.label}
        </span>
      );

      return (
        <span key={item.to ?? item.label} className="flex items-center gap-2">
          {item.to ? (
            <Link
              to={item.to}
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              {content}
            </Link>
          ) : (
            content
          )}
          {index < items.length - 1 && (
            <span className="text-amber-500/70">/</span>
          )}
        </span>
      );
    })}
  </nav>
);
