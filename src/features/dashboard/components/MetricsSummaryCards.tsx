import { Card } from "@/shared/components/Card";
import { formatCurrency } from "@/shared/utils/format";
import type { DashboardSummary } from "@/features/dashboard/hooks/useDashboardMetrics";

interface MetricsSummaryCardsProps {
  summary: DashboardSummary;
  isLoading?: boolean;
}

const summaryCards = (summary: DashboardSummary) => {
  const cost = summary.cost?.summary;

  return [
    {
      label: "Total Cost",
      value: formatCurrency(cost?.total_cost_usd ?? 0, "USD"),
      description: "All cluster costs",
    },
    {
      label: "CPU Cost",
      value: formatCurrency(cost?.cpu_cost_usd ?? 0, "USD"),
      description: "Compute spend",
    },
    {
      label: "Memory Cost",
      value: formatCurrency(cost?.memory_cost_usd ?? 0, "USD"),
      description: "RAM spend",
    },
    {
      label: "Storage + Network",
      value: formatCurrency(
        (cost?.ephemeral_storage_cost_usd ?? 0) +
          (cost?.persistent_storage_cost_usd ?? 0) +
          (cost?.network_cost_usd ?? 0),
        "USD"
      ),
      description: "Ephemeral, persistent, network",
    },
  ];
};

export const MetricsSummaryCards = ({ summary, isLoading }: MetricsSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {summaryCards(summary).map((card) => (
      <Card key={card.label} title={card.label} isLoading={isLoading} padding="sm">
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.description}</p>
        </div>
      </Card>
    ))}
  </div>
);
