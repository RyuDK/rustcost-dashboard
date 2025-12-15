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
      setError("Failed to load cluster metrics.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  /* ----------------------- Summary Cards ----------------------- */

  const rawSummaryCards = useMemo(() => {
    if (!rawMetrics) return [];

    return [
      {
        label: "Avg CPU",
        value: `${rawMetrics.avg_cpu_cores.toFixed(3)} cores`,
        description: "Average CPU cores used",
      },
      {
        label: "Avg Memory",
        value: `${rawMetrics.avg_memory_gb.toFixed(2)} GB`,
        description: "Average memory usage",
      },
      {
        label: "Avg Network",
        value: `${rawMetrics.avg_network_gb.toFixed(4)} GB`,
        description: "Average network throughput",
      },
      {
        label: "Avg Storage",
        value: `${rawMetrics.avg_storage_gb.toFixed(2)} GB`,
        description: "Average storage consumption",
      },
      {
        label: "Max CPU",
        value: `${rawMetrics.max_cpu_cores.toFixed(3)} cores`,
        description: "Peak CPU usage",
      },
      {
        label: "Max Memory",
        value: `${rawMetrics.max_memory_gb.toFixed(2)} GB`,
        description: "Peak memory usage",
      },
      {
        label: "Max Network",
        value: `${rawMetrics.max_network_gb.toFixed(4)} GB`,
        description: "Peak network throughput",
      },
      {
        label: "Nodes",
        value: rawMetrics.node_count.toString(),
        description: "Total nodes in the cluster",
      },
    ];
  }, [rawMetrics]);

  const costSummaryCards = useMemo(() => {
    if (!costMetrics) return [];

    return [
      {
        label: "CPU Cost",
        value: formatCurrency(costMetrics.cpu_cost_usd, "USD"),
        description: "Compute CPU cost",
      },
      {
        label: "Memory Cost",
        value: formatCurrency(costMetrics.memory_cost_usd, "USD"),
        description: "Memory/RAM cost",
      },
      {
        label: "Network Cost",
        value: formatCurrency(costMetrics.network_cost_usd, "USD"),
        description: "Cluster network transfer cost",
      },
      {
        label: "Ephemeral Storage",
        value: formatCurrency(costMetrics.ephemeral_storage_cost_usd, "USD"),
        description: "Ephemeral disk usage cost",
      },
      {
        label: "Persistent Storage",
        value: formatCurrency(costMetrics.persistent_storage_cost_usd, "USD"),
        description: "Persistent volume cost",
      },
      {
        label: "Total Cost",
        value: formatCurrency(costMetrics.total_cost_usd, "USD"),
        description: "Total cost across all resources",
        highlight: true,
      },
    ];
  }, [costMetrics]);

  /* ---------------------------- UI ---------------------------- */

  return (
    <SharedPageLayout>
      <div className="flex flex-col gap-8">
      <SharedPageHeader
        eyebrow=""
        title="Workload Metrics"
        description="Cluster resource usage & cost overview"
        breadcrumbItems={[{ label: t("nav.workloads") }]}
      />

      <SharedMetricsFilterBar
        params={params}
        onChange={handleChange}
        onRefresh={loadMetrics}
      />
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Sub Pages
        </h2>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <LinkCard title="Nodes" subtitle="Metrics" to="metrics/nodes" />
          <LinkCard title="Pods" subtitle="Metrics" to="metrics/pods" />
          <LinkCard
            title="Containers"
            subtitle="Metrics"
            to="metrics/containers"
          />
          <LinkCard
            title="Deployments"
            subtitle="Resources"
            to="resources/deployments"
          />
          <LinkCard title="Nodes" subtitle="Resources" to="resources/nodes" />
          <LinkCard
            title="Containers"
            subtitle="Resources"
            to="resources/containers"
          />
          <LinkCard title="Pods" subtitle="Resources" to="resources/pods" />
          <LinkCard
            title="StatefulSets"
            subtitle="Resources"
            to="resources/statefulsets"
          />
          <LinkCard
            title="DaemonSets"
            subtitle="Resources"
            to="resources/daemonsets"
          />
          <LinkCard
            title="Jobs & CronJobs"
            subtitle="Resources"
            to="resources/jobs"
          />
          <LinkCard
            title="Services"
            subtitle="Resources"
            to="resources/services"
          />
          <LinkCard
            title="Ingresses"
            subtitle="Resources"
            to="resources/ingresses"
          />
          <LinkCard
            title="Namespaces"
            subtitle="Resources"
            to="resources/namespaces"
          />
          <LinkCard
            title="Persistent Volumes"
            subtitle="Resources"
            to="resources/persistent-volumes"
          />
          <LinkCard
            title="Persistent Volume Claims"
            subtitle="Resources"
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
          Resource Usage Summary
        </h2>

        <SharedMetricsSummaryCards
          cards={rawSummaryCards}
          isLoading={loading}
        />
      </div>

      {/* COST METRICS */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Cost Summary
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
