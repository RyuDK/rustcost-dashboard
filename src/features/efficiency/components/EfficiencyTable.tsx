import type { EfficiencyMetric } from "../../../entities/metrics/model/types";
import { MetricTable } from "../../../entities/metrics/ui/MetricTable";
import { formatPercent, formatCurrency } from "../../../shared/lib/formatters";

interface EfficiencyTableProps {
  title: string;
  data?: EfficiencyMetric[];
  isLoading?: boolean;
  error?: string;
}

export const EfficiencyTable = ({
  title,
  data,
  isLoading,
  error,
}: EfficiencyTableProps) => (
  <MetricTable<EfficiencyMetric>
    title={title}
    data={data}
    isLoading={isLoading}
    error={error}
    columns={[
      {
        key: "name",
        header: "Workload",
        render: (item) => item.name,
      },
      {
        key: "score",
        header: "Efficiency",
        align: "right",
        render: (item) => formatPercent(item.efficiencyScore),
      },
      {
        key: "potential",
        header: "Savings",
        align: "right",
        render: (item) => formatCurrency(item.potentialSavings ?? 0, "USD"),
      },
    ]}
  />
);
