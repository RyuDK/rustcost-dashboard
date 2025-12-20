import React from "react";
import type { MetricCostTrendDto } from "@/types/metrics";

export const TrendSummary = ({ trend }: { trend?: MetricCostTrendDto }) => {
  if (!trend) return null;

  const isImproving = trend.cost_diff_usd < 0;

  return (
    <div className="rounded-2xl border border-[var(--primary)] bg-gradient-to-br from-white via-[color:var(--primary)]/15 to-emerald-50/50 p-5 shadow-sm dark:border-gray-800 dark:from-[var(--surface-dark)]/90 dark:via-[var(--surface-dark)]/70 dark:to-[var(--surface-dark)]/80">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
            Cost trend
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Direction of spend across the selected window.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
            isImproving
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/40"
              : "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/40"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isImproving ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {isImproving ? "Decreasing" : "Increasing"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryItem
          label="Start cost"
          value={formatCost(trend.start_cost_usd)}
        />
        <SummaryItem label="End cost" value={formatCost(trend.end_cost_usd)} />
        <SummaryItem
          label="Change vs. start"
          value={formatCost(trend.cost_diff_usd)}
          color={isImproving ? "text-emerald-600" : "text-rose-600"}
        />

        <SummaryItem
          label="Growth rate"
          value={formatPercent(trend.growth_rate_percent)}
          color={isImproving ? "text-emerald-600" : "text-rose-600"}
        />

        <SummaryItem
          label="Predicted next"
          value={formatCost(trend.predicted_next_cost_usd ?? 0)}
        />
        <SummaryItem
          label="Regression slope"
          value={formatScientific(trend.regression_slope_usd_per_granularity)}
          color="text-[var(--primary)]"
        />
      </div>
    </div>
  );
};

const SummaryItem = ({
  label,
  value,
  color = "text-gray-800 dark:text-gray-100",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <span className={`text-md font-semibold ${color}`}>{value}</span>
  </div>
);

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCost(value: number): string {
  if (!Number.isFinite(value)) {
    return "$0.00";
  }

  const roundedToCents = currencyFormatter.format(value);
  const absolute = Math.abs(value);

  // For very small values, keep three decimal places to avoid long tails or scientific notation.
  if (absolute > 0 && absolute < 0.01) {
    const rounded = Number(value.toFixed(3));
    const safe = Math.abs(rounded) < 0.0005 ? 0 : rounded; // avoid -0.000
    const sign = safe < 0 ? "-" : "";
    return `${sign}$${Math.abs(safe).toFixed(3)}`;
  }

  return roundedToCents;
}

function formatPercent(val: number): string {
  return `${val.toFixed(2)}%`;
}

function formatScientific(val: number): string {
  if (!Number.isFinite(val)) {
    return "0.000";
  }
  const rounded = Number(val.toFixed(3));
  const safe = Math.abs(rounded) < 0.0005 ? 0 : rounded; // avoid -0.000
  return safe.toFixed(3);
}
