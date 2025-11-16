import type { ReactNode } from "react";
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
}

export const InfoCard = ({
  title,
  rows,
  description,
  footer,
  isLoading,
  error,
}: InfoCardProps) => (
  <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <header>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </header>
    {isLoading && <LoadingSpinner label="Loading" className="py-8" />}
    {error && (
      <div className="rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200">
        {error}
      </div>
    )}
    {!isLoading && !error && (
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {row.label}
            </dt>
            <dd className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    )}
    {footer && (
      <div className="border-t border-gray-100 pt-3 dark:border-gray-800">{footer}</div>
    )}
  </div>
);

