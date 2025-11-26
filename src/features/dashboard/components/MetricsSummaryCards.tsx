import { Card } from "@/shared/components/Card";
import { formatCurrency, formatPercent } from "@/shared/utils/format";
import type { DashboardSummary } from "@/features/dashboard/hooks/useDashboardMetrics";

interface MetricsSummaryCardsProps {
  summary: DashboardSummary;
  isLoading?: boolean;
}

const formatCores = (cores?: number) =>
  `${(cores ?? 0).toFixed(1)} cores`;

const formatGigabytes = (gigabytes?: number) =>
  `${(gigabytes ?? 0).toFixed(1)} GB`;

const summaryCards = (summary: DashboardSummary) => [
  {
    label: "CPU Usage",
    value: formatCores(summary.nodes.usage?.avg_cpu_cores),
    description: "Average CPU cores utilized",
  },
  {
    label: "Memory Usage",
    value: formatGigabytes(summary.nodes.usage?.avg_memory_gb),
    description: "Average memory consumption",
  },
  {
    label: "Node Efficiency",
    value: formatPercent(summary.nodes.efficiency?.overall_efficiency ?? 0),
    description: "Overall cluster efficiency",
  },
  {
    label: "Node Cost",
    value: formatCurrency(summary.nodes.totalCost ?? 0, "USD"),
    description: "Latest total node spend",
  },
];

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
