import type { ReactNode } from "react";
import { SharedBreadcrumb, type BreadcrumbItem } from "./SharedBreadcrumb";

type ActionVariant = "primary" | "secondary" | "ghost";

export type HeaderAction = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: ActionVariant;
};

interface CommonPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbItems?: BreadcrumbItem[];
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
  actions?: ReactNode;
  rightContent?: ReactNode;
}

const actionStyles: Record<ActionVariant, string> = {
  primary: `
    bg-[var(--button-bg1)] text-black shadow-sm
    hover:bg-[var(--button-bg1-hover)] active:bg-[var(--button-bg1-active)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-bg1)]
    dark:text-black
  `,
  secondary: `
    border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]
    hover:border-[var(--primary)] hover:text-[var(--primary)]
    dark:border-[var(--border)] dark:bg-[var(--surface-dark)] dark:text-[var(--text)]
    dark:hover:border-[var(--primary)] dark:hover:text-[var(--primary)]
  `,
  ghost: `
    text-[var(--text-muted)] hover:text-[var(--text)]
    dark:text-[var(--text-muted)] dark:hover:text-[var(--text)]
  `,
};

const renderActionButton = ({
  label,
  onClick,
  icon,
  variant = "secondary",
}: HeaderAction) => (
  <button
    type="button"
    onClick={onClick}
    tabIndex={0}
    className={`
      inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer
      shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)]
      ${actionStyles[variant]}
    `}
  >
    {icon && <span className="text-lg">{icon}</span>}
    {label}
  </button>
);

export const SharedPageHeader = ({
  eyebrow,
  title,
  description,
  breadcrumbItems,
  primaryAction,
  secondaryAction,
  actions,
  rightContent,
}: CommonPageHeaderProps) => (
  <header
    className="
      flex flex-col gap-4
      rounded-2xl md:flex-row md:items-center md:justify-between p-2 md:p-4
    "
  >
    <div className="space-y-3">
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-500">
          {eyebrow}
        </p>
      )}

      {breadcrumbItems?.length ? (
        <SharedBreadcrumb items={breadcrumbItems} />
      ) : null}

      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      {secondaryAction ? renderActionButton(secondaryAction) : null}
      {primaryAction
        ? renderActionButton({ ...primaryAction, variant: "primary" })
        : null}
      {actions}
      {rightContent}
    </div>
  </header>
);
