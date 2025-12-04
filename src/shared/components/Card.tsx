import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { LoadingSpinner } from "./LoadingSpinner";

type CardPadding = "sm" | "md" | "lg";

const BASE_CARD_STYLES = {
  container:
    "rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface-dark)]/40",
  header: "flex flex-wrap items-start justify-between gap-3",
  title: "text-base font-semibold text-gray-900 dark:text-gray-100",
  subtitle: "text-sm text-gray-500 dark:text-gray-400",
  actions: "flex items-center gap-2",
  body: "",
  footer: "border-t border-[var(--border)]",
  loading: "py-8",
};

const paddingMap: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  contentClassName?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  footer?: ReactNode;
}

export const Card = ({
  title,
  subtitle,
  actions,
  children,
  className = "",
  padding = "md",
  contentClassName = "",
  isLoading = false,
  loadingLabel = "Loading",
  footer,
}: CardProps) => {
  const basePadding = paddingMap[padding];
  const headerPadding = twMerge(basePadding, "pb-0");
  const bodyPadding = twMerge(
    BASE_CARD_STYLES.body,
    basePadding,
    title || subtitle || actions ? "pt-4" : "",
    contentClassName
  );

  return (
    <div className={twMerge(BASE_CARD_STYLES.container, className)}>
      {(title || subtitle || actions) && (
        <div className={twMerge(BASE_CARD_STYLES.header, headerPadding)}>
          <div className="space-y-1">
            {title && <h3 className={BASE_CARD_STYLES.title}>{title}</h3>}
            {subtitle && (
              <p className={BASE_CARD_STYLES.subtitle}>{subtitle}</p>
            )}
          </div>
          {actions && <div className={BASE_CARD_STYLES.actions}>{actions}</div>}
        </div>
      )}

      <div className={bodyPadding}>
        {isLoading ? (
          <LoadingSpinner
            label={loadingLabel}
            className={BASE_CARD_STYLES.loading}
          />
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className={twMerge(BASE_CARD_STYLES.footer, basePadding, "pt-0")}>
          {footer}
        </div>
      )}
    </div>
  );
};
