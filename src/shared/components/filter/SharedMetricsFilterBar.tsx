import type { ChangeEvent } from "react";
import type { MetricsQueryOptions } from "@/types/metrics";
import { useI18n } from "@/app/providers/i18n/useI18n";

interface MetricsFilterBarProps {
  params: MetricsQueryOptions;
  onChange: <K extends keyof MetricsQueryOptions>(
    key: K,
    value: MetricsQueryOptions[K]
  ) => void;
  onRefresh: () => void;
}

const toDateInputValue = (value?: string) => (value ? value.slice(0, 10) : "");
const toIsoDateTime = (value: string) => `${value}T00:00:00`;

export const SharedMetricsFilterBar = ({
  params,
  onChange,
  onRefresh,
}: MetricsFilterBarProps) => {
  const { t } = useI18n();

  const handleDateChange =
    (key: "start" | "end") => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange(key, value ? toIsoDateTime(value) : undefined);
    };

  return (
    <section className="flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[var(--surface-dark)]/40 md:items-end md:p-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("common.date.start")}
        </label>
        <input
          type="date"
          value={toDateInputValue(params.start)}
          onChange={handleDateChange("start")}
          className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("common.date.end")}
        </label>
        <input
          type="date"
          value={toDateInputValue(params.end)}
          onChange={handleDateChange("end")}
          className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
        />
      </div>

      <div className="ml-auto flex w-full justify-end md:w-auto">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 md:w-auto"
        >
          {t("common.refresh")}
        </button>
      </div>
    </section>
  );
};
