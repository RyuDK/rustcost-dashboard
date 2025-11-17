import React from "react";
import type { MetricCostTrendDto } from "../../../shared/api/metric/types";

export const TrendSummary = ({ trend }: { trend?: MetricCostTrendDto }) => {
  if (!trend) return null;

  return (
    <div
      className="
      rounded-xl border border-gray-700 bg-gray-900 p-6 
      grid grid-cols-1 sm:grid-cols-3 gap-6
    "
    >
      <SummaryItem
        label="Start Cost"
        value={formatCost(trend.start_cost_usd)}
      />
      <SummaryItem label="End Cost" value={formatCost(trend.end_cost_usd)} />
      <SummaryItem
        label="Change"
        value={formatCost(trend.cost_diff_usd)}
        color={trend.cost_diff_usd < 0 ? "text-red-400" : "text-green-400"}
      />

      <SummaryItem
        label="Growth Rate"
        value={formatPercent(trend.growth_rate_percent)}
        color={
          trend.growth_rate_percent < 0 ? "text-red-400" : "text-green-400"
        }
      />

      <SummaryItem
        label="Predicted Next"
        value={formatCost(trend.predicted_next_cost_usd ?? 0)}
      />
      <SummaryItem
        label="Regression Slope"
        value={formatScientific(trend.regression_slope_usd_per_granularity)}
        color="text-amber-400"
      />
    </div>
  );
};

const SummaryItem = ({
  label,
  value,
  color = "text-gray-200",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-gray-400">
      {label}
    </span>
    <span className={`text-md font-semibold ${color}`}>{value}</span>
  </div>
);

// ------------------------------
// Formatting Helpers
// ------------------------------

/** Show tiny money values as readable USD instead of scientific notation */
function formatCost(value: number): string {
  if (value === 0 || Math.abs(value) < Number.EPSILON) {
    return "$0.00";
  }

  // Convert scientific notation → decimal string
  const decimal = noExponents(value);

  return `$${decimal}`;
}

function noExponents(n: number): string {
  const data = String(n).split(/[eE]/);
  if (data.length === 1) return data[0];

  let z = "";
  let mag = Number(data[1]) + 1;
  const sign = n < 0 ? "-" : "";
  const str = data[0].replace(".", "");

  if (mag < 0) {
    z = sign + "0.";
    while (mag++) z += "0";
    return z + str.replace("-", "");
  }
  mag -= str.length;
  while (mag--) z += "0";
  return sign + str + z;
}

function formatPercent(val: number): string {
  return `${val.toFixed(4)}%`;
}

function formatScientific(val: number): string {
  return val.toExponential(3);
}
