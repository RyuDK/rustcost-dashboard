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
    {items.map((item) => {
      const content = (
        <span className="flex items-center gap-1">
          {item.icon}
          {item.label}
        </span>
      );

      return (
        <span
          key={item.to ?? item.label}
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-500 hover:text-amber-400 transition-colors after:content-['>'] last:after:content-none"
        >
          {item.to ? <Link to={item.to}>{content}</Link> : content}
        </span>
      );
    })}
  </nav>
);
