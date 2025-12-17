import { useMemo, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { TrendChart } from "@/features/trends/components/TrendChart";
import { createDefaultMetricsParams } from "@/features/dashboard/hooks/useMetrics";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";
import { pickGranularity } from "@/shared/utils/metrics";
import { subtractDays } from "@/shared/utils/date";
import {
  useClusterTrendMetrics,
  useNamespaceTrendMetrics,
} from "@/features/metrics/hooks/resourceHooks";

type QuickRange = {
  key: string;
  label: string;
  start: string;
  end: string;
};

const toIsoBoundary = (value: string, boundary: "start" | "end") => {
  if (!value) return undefined;
  const date = new Date(`${value}T${boundary === "start" ? "00:00:00" : "23:59:59"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const toPresetBoundary = (date: Date, boundary: "start" | "end") => {
  const copy = new Date(date);
  if (boundary === "start") {
    copy.setHours(0, 0, 0, 0);
  } else {
    copy.setHours(23, 59, 59, 999);
  }
  return copy.toISOString();
};

export const TrendsPage = () => {
  const { t } = useI18n();
  const [params, setParams] = useState(() => createDefaultMetricsParams());
  const [activePreset, setActivePreset] = useState<string | null>("7d");
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const quickRanges: QuickRange[] = useMemo(() => {
    const today = new Date();
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return [
      {
        key: "7d",
        label: t("filters.last7Days", { defaultValue: "Last 7 days" }),
        start: toPresetBoundary(subtractDays(endOfToday, 6), "start"),
        end: toPresetBoundary(endOfToday, "end"),
      },
      {
        key: "30d",
        label: t("filters.last30Days", { defaultValue: "Last 30 days" }),
        start: toPresetBoundary(subtractDays(endOfToday, 29), "start"),
        end: toPresetBoundary(endOfToday, "end"),
      },
      {
        key: "mtd",
        label: t("filters.monthToDate", { defaultValue: "Month to date" }),
        start: toPresetBoundary(startOfMonth, "start"),
        end: toPresetBoundary(endOfToday, "end"),
      },
    ];
  }, [t]);

  const applyDateRange = (start?: string, end?: string) => {
    setParams((prev) => {
      const nextStart = start ?? prev.start;
      const nextEnd = end ?? prev.end;

      return {
        ...prev,
        start: nextStart,
        end: nextEnd,
        granularity: pickGranularity(nextStart, nextEnd),
      };
    });
  };

  const handlePresetSelect = (range: QuickRange) => {
    setActivePreset(range.key);
    applyDateRange(range.start, range.end);
  };

  const handleStartChange = (value: string) => {
    setActivePreset(null);
    applyDateRange(toIsoBoundary(value, "start"), undefined);
  };

  const handleEndChange = (value: string) => {
    setActivePreset(null);
    applyDateRange(undefined, toIsoBoundary(value, "end"));
  };

  const resetToDefault = () => {
    const defaults = createDefaultMetricsParams();
    setParams(defaults);
    setActivePreset("7d");
  };

  const rangeDescription = useMemo(() => {
    if (!params.start || !params.end) {
      return t("trends.range.prompt", {
        defaultValue: "Pick a start and end date to explore cost trends.",
      });
    }

    const startLabel = new Date(params.start).toLocaleDateString();
    const endLabel = new Date(params.end).toLocaleDateString();
    const granularity =
      params.granularity ?? pickGranularity(params.start, params.end);

    return `${startLabel} \u2192 ${endLabel} · ${granularity} granularity`;
  }, [params.end, params.granularity, params.start, t]);

  const clusterTrends = useClusterTrendMetrics(params);
  const namespaceTrends = useNamespaceTrendMetrics(params);

  const renderError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    return err ? String(err) : undefined;
  };

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title={t("trends.title")}
        description={t("trends.subtitle")}
        breadcrumbItems={[{ label: t("nav.trends") }]}
      />

      <ExplainHint visible={showExplain}>
        Choose a preset or enter exact dates to drive both trend charts; the
        page auto-selects a matching granularity for the window.
      </ExplainHint>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm dark:border-gray-800/70 dark:bg-[var(--surface-dark)]/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
              {t("trends.filters.title", { defaultValue: "Cost window" })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("trends.filters.subtitle", {
                defaultValue:
                  "Refine the time frame to compare cluster and namespace cost trends.",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {quickRanges.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => handlePresetSelect(range)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  activePreset === range.key
                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-200"
                    : "border-gray-300 bg-white text-gray-700 hover:border-amber-400 hover:text-amber-700 dark:border-gray-700 dark:bg-[var(--surface-dark)] dark:text-gray-200 dark:hover:border-amber-400"
                }`}
              >
                {range.label}
              </button>
            ))}

            <button
              type="button"
              onClick={resetToDefault}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-amber-500 hover:text-amber-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-amber-400"
            >
              {t("common.reset", { defaultValue: "Reset" })}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("common.date.start")}
            </label>
            <input
              type="date"
              value={params.start?.slice(0, 10) ?? ""}
              onChange={(event) => handleStartChange(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("common.date.end")}
            </label>
            <input
              type="date"
              value={params.end?.slice(0, 10) ?? ""}
              onChange={(event) => handleEndChange(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
            />
          </div>

          <div className="rounded-lg border border-dashed border-gray-200 bg-white/70 p-3 text-sm shadow-sm dark:border-gray-700 dark:bg-[var(--surface-dark)]/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("trends.filters.range", { defaultValue: "Selected window" })}
            </p>
            <p className="mt-1 font-semibold text-gray-800 dark:text-gray-100">
              {rangeDescription}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("trends.filters.info", {
                defaultValue:
                  "Updates both charts and automatically adjusts granularity.",
              })}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ExplainHint visible={showExplain}>
          Cluster and namespace charts align to the same window; use them
          together to spot top-line and team-level cost shifts.
        </ExplainHint>
        <TrendChart
          title={t("trends.chart.cluster")}
          data={clusterTrends.data}
          isLoading={clusterTrends.isLoading}
          error={renderError(clusterTrends.error)}
        />

        <TrendChart
          title={t("trends.chart.namespace")}
          data={namespaceTrends.data}
          isLoading={namespaceTrends.isLoading}
          error={renderError(namespaceTrends.error)}
        />
      </div>
    </SharedPageLayout>
  );
};
