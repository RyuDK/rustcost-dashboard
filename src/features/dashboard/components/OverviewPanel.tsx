import type { EfficiencyMetric, SummaryMetric } from "../../metrics/types";
import { useI18n } from "../../../app/providers/I18nProvider";
import { formatCpu, formatBytes, formatPercent, sum, formatCurrency } from "../../../shared/lib/formatters";

interface OverviewPanelProps {
  nodes: SummaryMetric[];
  pods: SummaryMetric[];
  efficiency: EfficiencyMetric[];
  isLoading?: boolean;
}

const Card = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {title}
    </p>
    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

export const OverviewPanel = ({
  nodes,
  pods,
  efficiency,
  isLoading,
}: OverviewPanelProps) => {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900/20"
          />
        ))}
      </div>
    );
  }

  const totalNodeCpu = formatCpu(sum(nodes.map((item) => item.cpuUsage)));
  const totalNodeMemory = formatBytes(sum(nodes.map((item) => item.memoryUsage)));
  const avgPodEfficiency = efficiency.length
    ? formatPercent(
        sum(efficiency.map((item) => item.efficiencyScore)) / efficiency.length
      )
    : "0%";
  const totalPodCost = sum(pods.map((item) => item.totalCost ?? 0));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        title={t("dashboard.cards.nodeCpu.title")}
        value={totalNodeCpu}
        description={t("dashboard.cards.nodeCpu.description")}
      />
      <Card
        title={t("dashboard.cards.nodeMemory.title")}
        value={totalNodeMemory}
        description={t("dashboard.cards.nodeMemory.description")}
      />
      <Card
        title={t("dashboard.cards.podEfficiency.title")}
        value={avgPodEfficiency}
        description={t("dashboard.cards.podEfficiency.description")}
      />
      <Card
        title={t("dashboard.cards.podCost.title")}
        value={formatCurrency(totalPodCost, "USD")}
        description={t("dashboard.cards.podCost.description")}
      />
    </div>
  );
};
