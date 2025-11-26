import type { EfficiencyMetric } from "@/features/metrics/types";
import { Card } from "@/shared/components/Card";
import { formatCurrency, formatPercent } from "@/shared/utils/format";

interface CostEfficiencyCardProps {
  efficiency: EfficiencyMetric[];
  isLoading?: boolean;
  limit?: number;
}

export const CostEfficiencyCard = ({
  efficiency,
  isLoading = false,
  limit = 3,
}: CostEfficiencyCardProps) => {
  const topPods = [...efficiency]
    .sort((a, b) => (b.costEfficiency ?? 0) - (a.costEfficiency ?? 0))
    .slice(0, limit);

  return (
    <Card
      title="Cost Efficiency Watchlist"
      subtitle="Highest spend pods across the filtered scope"
      isLoading={isLoading}
      padding="sm"
    >
      {topPods.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No pod data available for this range.</p>
      ) : (
        <ul className="space-y-4">
          {topPods.map((pod) => (
            <li key={pod.id} className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{pod.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Efficiency {formatPercent(pod.efficiencyScore ?? 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(pod.costEfficiency ?? 0, "USD")}
                </p>
                {pod.potentialSavings !== undefined && (
                  <p className="text-xs text-emerald-500">
                    {formatCurrency(pod.potentialSavings ?? 0, "USD")} potential savings
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
