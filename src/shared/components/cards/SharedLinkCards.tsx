import { NavLink } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { FiChevronRight } from "react-icons/fi";

export interface LinkCardProps {
  title: string;
  subtitle: string;
  to: string;
  icon?: React.ReactNode;
  className?: string;
}

export const LinkCard = ({
  title,
  subtitle,
  to,
  icon,
  className,
}: LinkCardProps) => {
  const baseClasses = `
    group flex items-center justify-between rounded-2xl border 
    bg-white px-5 py-4 shadow-sm transition-all 
    hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg 
    dark:bg-[var(--surface-dark)]/60 dark:border-slate-800 
    dark:hover:border-amber-400
    focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-amber-400/70 focus-visible:ring-offset-2
  `;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        twMerge(
          baseClasses,
          isActive && "border-amber-400 shadow-md",
          className
        )
      }
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-amber-500">{icon}</span>}

        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </p>
        </div>
      </div>

      <FiChevronRight
        size={20}
        className="
          text-amber-500 transition-transform 
          duration-200 group-hover:translate-x-1
        "
      />
    </NavLink>
  );
};
