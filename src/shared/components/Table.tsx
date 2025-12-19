import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { SharedCard } from "./metrics/SharedCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { useI18n } from "@/app/providers/i18n/useI18n";

type Alignment = "left" | "center" | "right";

export interface TableColumn<T> {
  key: string;
  label: string;
  align?: Alignment;
  render?: (row: T) => ReactNode;
  className?: string;
  sortAccessor?: (row: T) => string | number;
  efficiencyAccessor?: (row: T) => number | undefined;
}

interface TableProps<T> {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  data?: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
}

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

const BASE_TABLE_STYLES = {
  wrapper: "overflow-x-auto",
  table: "min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800",
  thead: "bg-gray-50 dark:bg-gray-950/30",
  headerRow: "",
  headerCell:
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400",
  headerLabel: "inline-flex items-center gap-1",
  sortIcon: "text-[10px] text-gray-400",
  tbody: "divide-y divide-gray-100 dark:divide-gray-800",
  row: "odd:bg-white even:bg-gray-50/60 hover:bg-[color:var(--primary)]/10 dark:odd:bg-gray-900 dark:even:bg-gray-900/70 dark:hover:bg-[color:var(--primary)]/10",
  cell: "px-4 py-3 text-sm text-gray-700 dark:text-gray-200",
  emptyRow: "",
  emptyCell: "px-4 py-10 text-center text-gray-500 dark:text-gray-400",
  loadingWrapper: "py-10",
  errorWrapper: "flex h-40 items-center justify-center text-sm text-red-500",
};

const ALIGNMENT_CLASSNAME: Record<Alignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900";

const getEfficiencyTone = (value?: number) => {
  if (!Number.isFinite(value ?? NaN)) {
    return "";
  }

  if ((value as number) < 40) {
    return "text-rose-500 dark:text-rose-400";
  }

  if ((value as number) < 70) {
    return "text-[var(--primary)]";
  }

  return "text-emerald-500 dark:text-emerald-400";
};

export const Table = <T extends Record<string, unknown>>({
  title,
  subtitle,
  actions,
  data = [],
  columns,
  isLoading = false,
  error,
  emptyMessage,
  className = "",
  rowKey,
}: TableProps<T>) => {
  const { t } = useI18n();
  const [sortState, setSortState] = useState<SortState | null>(null);
  const resolvedEmptyMessage = emptyMessage ?? t("common.table.empty");

  const sortedData = useMemo(() => {
    if (!sortState) {
      return data;
    }

    const column = columns.find((col) => col.key === sortState.key);
    if (!column || !column.sortAccessor) {
      return data;
    }

    const items = [...data];

    items.sort((a, b) => {
      const valueA = column.sortAccessor?.(a);
      const valueB = column.sortAccessor?.(b);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortState.direction === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      return sortState.direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    return items;
  }, [columns, data, sortState]);

  const toggleSort = (column: TableColumn<T>) => {
    if (!column.sortAccessor) {
      return;
    }

    setSortState((prev) => {
      if (prev?.key === column.key) {
        return {
          key: column.key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: column.key, direction: "asc" };
    });
  };

  return (
    <SharedCard
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
    >
      {isLoading ? (
        <LoadingSpinner
          label={t("common.table.loading")}
          className={BASE_TABLE_STYLES.loadingWrapper}
        />
      ) : error ? (
        <div className={BASE_TABLE_STYLES.errorWrapper}>{error}</div>
      ) : (
        <div className={BASE_TABLE_STYLES.wrapper}>
          <table className={BASE_TABLE_STYLES.table}>
            <thead className={BASE_TABLE_STYLES.thead}>
              <tr className={BASE_TABLE_STYLES.headerRow}>
                {columns.map((column) => {
                  const isSorted = sortState?.key === column.key;
                  const alignClass =
                    ALIGNMENT_CLASSNAME[column.align ?? "left"];

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      tabIndex={column.sortAccessor ? 0 : undefined}
                      aria-sort={
                        column.sortAccessor
                          ? isSorted
                            ? sortState?.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                      className={twMerge(
                        BASE_TABLE_STYLES.headerCell,
                        alignClass,
                        column.sortAccessor && "cursor-pointer select-none",
                        column.sortAccessor && FOCUS_RING,
                        column.className
                      )}
                      onClick={() => toggleSort(column)}
                      onKeyDown={(event) => {
                        if (!column.sortAccessor) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleSort(column);
                        }
                      }}
                    >
                      <span className={BASE_TABLE_STYLES.headerLabel}>
                        {column.label}
                        {column.sortAccessor && (
                          <span className={BASE_TABLE_STYLES.sortIcon}>
                            {isSorted
                              ? sortState?.direction === "asc"
                                ? "\u2191"
                                : "\u2193"
                              : "\u2195"}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={BASE_TABLE_STYLES.tbody}>
              {sortedData.length === 0 ? (
                <tr className={BASE_TABLE_STYLES.emptyRow}>
                  <td
                    className={BASE_TABLE_STYLES.emptyCell}
                    colSpan={columns.length}
                  >
                    {resolvedEmptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr
                    key={String(rowKey ? rowKey(row, index) : index)}
                    className={BASE_TABLE_STYLES.row}
                  >
                    {columns.map((column) => {
                      const alignment =
                        ALIGNMENT_CLASSNAME[column.align ?? "left"];
                      const efficiencyClass = column.efficiencyAccessor
                        ? getEfficiencyTone(column.efficiencyAccessor(row))
                        : "";
                      const cellContent = column.render
                        ? column.render(row)
                        : (row[column.key as keyof T] as ReactNode);

                      return (
                        <td
                          key={column.key}
                          className={twMerge(
                            BASE_TABLE_STYLES.cell,
                            alignment,
                            column.className,
                            efficiencyClass
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </SharedCard>
  );
};
