import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { LoadingSpinner } from "./LoadingSpinner";

export interface InfoCardRow {
  label: string;
  value: ReactNode;
}

interface InfoCardProps {
  title: string;
  rows: InfoCardRow[];
  description?: string;
  footer?: ReactNode;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

const BASE_INFO_CARD_STYLES = {
  container:
    "flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900",
  title: "text-base font-semibold text-gray-800 dark:text-gray-100",
  description: "text-sm text-gray-500 dark:text-gray-400",
  loading: "py-8",
  error:
    "rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200",
  grid: "grid grid-cols-1 gap-3 text-sm sm:grid-cols-2",
  row: "space-y-1",
  label: "text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400",
  value: "text-sm font-medium text-gray-800 dark:text-gray-100",
  footer: "border-t border-gray-100 pt-3 dark:border-gray-800",
};

export const InfoCard = ({
  title,
  rows,
  description,
  footer,
  isLoading = false,
  error,
  className = "",
}: InfoCardProps) => (
  <div className={twMerge(BASE_INFO_CARD_STYLES.container, className)}>
    <header>
      <h3 className={BASE_INFO_CARD_STYLES.title}>{title}</h3>
      {description && (
        <p className={BASE_INFO_CARD_STYLES.description}>{description}</p>
      )}
    </header>

    {isLoading && (
      <LoadingSpinner
        label="Loading"
        className={BASE_INFO_CARD_STYLES.loading}
      />
    )}

    {error && <div className={BASE_INFO_CARD_STYLES.error}>{error}</div>}

    {!isLoading && !error && (
      <dl className={BASE_INFO_CARD_STYLES.grid}>
        {rows.map((row) => (
          <div key={row.label} className={BASE_INFO_CARD_STYLES.row}>
            <dt className={BASE_INFO_CARD_STYLES.label}>{row.label}</dt>
            <dd className={BASE_INFO_CARD_STYLES.value}>{row.value}</dd>
          </div>
        ))}
      </dl>
    )}

    {footer && <div className={BASE_INFO_CARD_STYLES.footer}>{footer}</div>}
  </div>
);
