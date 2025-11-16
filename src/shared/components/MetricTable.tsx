import type { ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

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
}

export const MetricTable = <T extends { id: string | number }>({
  title,
  data,
  columns,
  isLoading,
  error,
  emptyMessage = "No data available",
}: MetricTableProps<T>) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-center justify-between px-4 py-3">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
    </div>
    <div className="overflow-x-auto">
      {isLoading && <LoadingSpinner label="Loading table" className="py-12" />}
      {error && (
        <div className="px-4 py-12 text-center text-sm text-red-500">{error}</div>
      )}
      {!isLoading && !error && (
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2 font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data && data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-500/10">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-gray-700 dark:text-gray-200 ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

