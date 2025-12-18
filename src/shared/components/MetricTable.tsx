import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { LoadingSpinner } from "./LoadingSpinner";
import { useI18n } from "@/app/providers/i18n/useI18n";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

interface MetricTableProps<T> {
  title: string;
  data?: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

const BASE_METRIC_TABLE_STYLES = {
  container:
    "rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface-dark)]/40",
  header: "flex items-center justify-between px-4 py-3",
  title: "text-base font-semibold text-gray-800 dark:text-gray-100",
  tableWrapper: "overflow-x-auto",
  loading: "py-12",
  error: "px-4 py-12 text-center text-sm text-red-500",
  table: "min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800",
  thead: "bg-gray-50 dark:bg-gray-950",
  headerCell:
    "px-4 py-2 font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",
  tbody: "divide-y divide-gray-100 dark:divide-gray-800",
  row: "hover:bg-amber-50/40 dark:hover:bg-amber-500/10",
  cell: "px-4 py-3 text-gray-700 dark:text-gray-200",
  emptyCell: "px-4 py-12 text-center text-gray-500 dark:text-gray-400",
};

const ALIGNMENT_CLASSNAME: Record<
  NonNullable<Column<unknown>["align"]>,
  string
> = {
  left: "text-left",
  right: "text-right",
};

export const MetricTable = <T extends { id: string | number }>({
  title,
  data = [],
  columns,
  isLoading = false,
  error,
  emptyMessage,
  className = "",
}: MetricTableProps<T>) => {
  const { t } = useI18n();
  const resolvedEmptyMessage = emptyMessage ?? t("common.table.empty");

  return (
    <div className={twMerge(BASE_METRIC_TABLE_STYLES.container, className)}>
      <div className={BASE_METRIC_TABLE_STYLES.header}>
        <h3 className={BASE_METRIC_TABLE_STYLES.title}>{title}</h3>
      </div>

      <div className={BASE_METRIC_TABLE_STYLES.tableWrapper}>
        {isLoading && (
          <LoadingSpinner
            label={t("common.table.loading")}
            className={BASE_METRIC_TABLE_STYLES.loading}
          />
        )}
        {error && <div className={BASE_METRIC_TABLE_STYLES.error}>{error}</div>}

        {!isLoading && !error && (
          <table className={BASE_METRIC_TABLE_STYLES.table}>
            <thead className={BASE_METRIC_TABLE_STYLES.thead}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={twMerge(
                      BASE_METRIC_TABLE_STYLES.headerCell,
                      ALIGNMENT_CLASSNAME[column.align ?? "left"]
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={BASE_METRIC_TABLE_STYLES.tbody}>
              {data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className={BASE_METRIC_TABLE_STYLES.row}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={twMerge(
                          BASE_METRIC_TABLE_STYLES.cell,
                          ALIGNMENT_CLASSNAME[column.align ?? "left"]
                        )}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className={BASE_METRIC_TABLE_STYLES.emptyCell}
                    colSpan={columns.length}
                  >
                    {resolvedEmptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
