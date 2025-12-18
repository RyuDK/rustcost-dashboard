import { useEffect, useState, useCallback, useMemo } from "react";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import { SharedMetricsSummaryCards } from "@/shared/components/metrics/SharedMetricsSummaryCards";
import { LinkCard } from "@/shared/components/cards/SharedLinkCards";
import type { MetricsQueryOptions } from "@/types/metrics";
import { metricApi } from "@/shared/api";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { formatCurrency } from "@/shared/utils/format";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { useAppSelector } from "@/store/hook";
import { ExplainHint } from "@/shared/components/ExplainHint";

/* --------------------------- Types --------------------------- */

interface ClusterRawSummary {
  avg_cpu_cores: number;
  avg_memory_gb: number;
  avg_network_gb: number;
  avg_storage_gb: number;
  max_cpu_cores: number;
  max_memory_gb: number;
  max_network_gb: number;
  max_storage_gb: number;
  node_count: number;
}

interface ClusterCostSummary {
  cpu_cost_usd: number;
  memory_cost_usd: number;
  network_cost_usd: number;
  ephemeral_storage_cost_usd: number;
  persistent_storage_cost_usd: number;
  total_cost_usd: number;
}

/* --------------------------- Utils --------------------------- */

const getDefaultDateRange = (): MetricsQueryOptions => {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 7);

  return {
    start: past.toISOString().slice(0, 10) + "T00:00:00",
    end: now.toISOString().slice(0, 10) + "T00:00:00",
  };
};

/* -------------------------- Component ------------------------- */

export const WorkloadsPage = () => {
  const { t } = useI18n();
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const [params, setParams] =
    useState<MetricsQueryOptions>(getDefaultDateRange);
  const [rawMetrics, setRawMetrics] = useState<ClusterRawSummary | null>(null);
  const [costMetrics, setCostMetrics] = useState<ClusterCostSummary | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <K extends keyof MetricsQueryOptions>(
    key: K,
    value: MetricsQueryOptions[K]
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const loadMetrics = useCallback(async () => {
    if (!params.start || !params.end) return;

    setLoading(true);
    setError(null);

    try {
      const [rawRes, costRes] = await Promise.all([
        metricApi.fetchClusterRawSummary({
          start: params.start,
          end: params.end,
          granularity: "day",
        }),
        metricApi.fetchClusterCostSummary({
          start: params.start,
          end: params.end,
        }),
      ]);

      setRawMetrics(rawRes?.data?.summary ?? null);
      setCostMetrics(costRes?.data?.summary ?? null);
    } catch {
      setError(t("workloads.errors.loadMetrics"));
    } finally {
      setLoading(false);
    }
  }, [params, t]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  /* ----------------------- Summary Cards ----------------------- */

  const rawSummaryCards = useMemo(() => {
    if (!rawMetrics) return [];

    return [
      {
        label: t("workloads.summary.avgCpu.label"),
        value: t("common.units.cores", {
          value: rawMetrics.avg_cpu_cores.toFixed(3),
        }),
        description: t("workloads.summary.avgCpu.description"),
      },
      {
        label: t("workloads.summary.avgMemory.label"),
        value: t("common.units.gigabytes", {
          value: rawMetrics.avg_memory_gb.toFixed(2),
        }),
        description: t("workloads.summary.avgMemory.description"),
      },
      {
        label: t("workloads.summary.avgNetwork.label"),
        value: t("common.units.gigabytes", {
          value: rawMetrics.avg_network_gb.toFixed(4),
        }),
        description: t("workloads.summary.avgNetwork.description"),
      },
      {
        label: t("workloads.summary.avgStorage.label"),
        value: t("common.units.gigabytes", {
          value: rawMetrics.avg_storage_gb.toFixed(2),
        }),
        description: t("workloads.summary.avgStorage.description"),
      },
      {
        label: t("workloads.summary.maxCpu.label"),
        value: t("common.units.cores", {
          value: rawMetrics.max_cpu_cores.toFixed(3),
        }),
        description: t("workloads.summary.maxCpu.description"),
      },
      {
        label: t("workloads.summary.maxMemory.label"),
        value: t("common.units.gigabytes", {
          value: rawMetrics.max_memory_gb.toFixed(2),
        }),
        description: t("workloads.summary.maxMemory.description"),
      },
      {
        label: t("workloads.summary.maxNetwork.label"),
        value: t("common.units.gigabytes", {
          value: rawMetrics.max_network_gb.toFixed(4),
        }),
        description: t("workloads.summary.maxNetwork.description"),
      },
      {
        label: t("workloads.summary.nodes.label"),
        value: rawMetrics.node_count.toString(),
        description: t("workloads.summary.nodes.description"),
      },
    ];
  }, [rawMetrics, t]);

  const costSummaryCards = useMemo(() => {
    if (!costMetrics) return [];

    return [
      {
        label: t("workloads.costSummary.cpuCost.label"),
        value: formatCurrency(costMetrics.cpu_cost_usd, "USD"),
        description: t("workloads.costSummary.cpuCost.description"),
      },
      {
        label: t("workloads.costSummary.memoryCost.label"),
        value: formatCurrency(costMetrics.memory_cost_usd, "USD"),
        description: t("workloads.costSummary.memoryCost.description"),
      },
      {
        label: t("workloads.costSummary.networkCost.label"),
        value: formatCurrency(costMetrics.network_cost_usd, "USD"),
        description: t("workloads.costSummary.networkCost.description"),
      },
      {
        label: t("workloads.costSummary.ephemeralStorage.label"),
        value: formatCurrency(costMetrics.ephemeral_storage_cost_usd, "USD"),
        description: t("workloads.costSummary.ephemeralStorage.description"),
      },
      {
        label: t("workloads.costSummary.persistentStorage.label"),
        value: formatCurrency(costMetrics.persistent_storage_cost_usd, "USD"),
        description: t("workloads.costSummary.persistentStorage.description"),
      },
      {
        label: t("workloads.costSummary.totalCost.label"),
        value: formatCurrency(costMetrics.total_cost_usd, "USD"),
        description: t("workloads.costSummary.totalCost.description"),
        highlight: true,
      },
    ];
  }, [costMetrics, t]);

  /* ---------------------------- UI ---------------------------- */

  return (
    <SharedPageLayout>
      <div className="flex flex-col gap-8">
        <SharedPageHeader
          eyebrow=""
          title={t("workloads.title")}
          description={t("workloads.subtitle")}
          breadcrumbItems={[{ label: t("nav.workloads") }]}
        />

        <ExplainHint visible={showExplain}>
          {t("workloads.hints.overview")}
        </ExplainHint>

        <SharedMetricsFilterBar
          params={params}
          onChange={handleChange}
          onRefresh={loadMetrics}
        />
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("workloads.subPages.title")}
          </h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <LinkCard
              title={t("nav.nodes")}
              subtitle={t("workloads.subPages.metrics")}
              to="metrics/nodes"
            />
            <LinkCard
              title={t("nav.pods")}
              subtitle={t("workloads.subPages.metrics")}
              to="metrics/pods"
            />
            <LinkCard
              title={t("nav.containers")}
              subtitle={t("workloads.subPages.metrics")}
              to="metrics/containers"
            />
            <LinkCard
              title={t("nav.deployments")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/deployments"
            />
            <LinkCard
              title={t("nav.nodes")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/nodes"
            />
            <LinkCard
              title={t("nav.containers")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/containers"
            />
            <LinkCard
              title={t("nav.pods")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/pods"
            />
            <LinkCard
              title={t("nav.statefulSets")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/statefulsets"
            />
            <LinkCard
              title={t("nav.daemonSets")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/daemonsets"
            />
            <LinkCard
              title={t("nav.jobsCronJobs")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/jobs"
            />
            <LinkCard
              title={t("nav.services")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/services"
            />
            <LinkCard
              title={t("nav.ingresses")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/ingresses"
            />
            <LinkCard
              title={t("nav.namespaces")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/namespaces"
            />
            <LinkCard
              title={t("nav.persistentVolumes")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/persistent-volumes"
            />
            <LinkCard
              title={t("nav.persistentVolumeClaims")}
              subtitle={t("workloads.subPages.resources")}
              to="resources/persistent-volume-claims"
            />
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* RAW METRICS */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("workloads.sections.resourceUsage")}
          </h2>

          <SharedMetricsSummaryCards
            cards={rawSummaryCards}
            isLoading={loading}
          />
        </div>

        {/* COST METRICS */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("workloads.sections.costSummary")}
          </h2>

          <SharedMetricsSummaryCards
            cards={costSummaryCards}
            isLoading={loading}
          />
        </div>
      </div>
    </SharedPageLayout>
  );
};
