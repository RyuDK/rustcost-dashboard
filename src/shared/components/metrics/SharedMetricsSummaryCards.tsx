import { SharedCard } from "@/shared/components/metrics/SharedCard";

interface SummaryCard {
  label: string;
  value: string;
  description?: string;
}

interface MetricsSummaryCardsProps {
  cards: SummaryCard[];
  isLoading?: boolean;
}

export const SharedMetricsSummaryCards = ({
  cards,
  isLoading,
}: MetricsSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => (
      <SharedCard
        key={card.label}
        title={card.label}
        isLoading={isLoading}
        padding="sm"
      >
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {card.value}
          </p>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {card.description}
          </p>
        </div>
      </SharedCard>
    ))}
  </div>
);
