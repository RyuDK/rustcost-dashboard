import { useEffect, useState, useCallback } from "react";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import type { MetricsQueryOptions } from "@/types/metrics";
import { metricApi } from "@/shared/api";

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

const getDefaultDateRange = (): MetricsQueryOptions => {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 7);

  return {
    start: past.toISOString().slice(0, 10) + "T00:00:00",
    end: now.toISOString().slice(0, 10) + "T00:00:00",
  };
};

export default function WorkloadsPage() {
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

  return (
    <div className="space-y-10 px-6 py-6">
      {/* Filter Bar */}
      <SharedMetricsFilterBar
        params={params}
        onChange={handleChange}
        onRefresh={loadMetrics}
      />

      <header>
        <h1 className="text-3xl font-bold">Cluster Overview</h1>
        <p className="text-slate-500 max-w-xl">
          Resource usage & cost summary for the selected time period.
        </p>
      </header>

      {loading && (
        <p className="text-center text-slate-500">Loading metrics...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* ========= RAW METRICS ========= */}
      {!loading && rawMetrics && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Resource Usage Summary</h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Avg CPU"
              value={`${rawMetrics.avg_cpu_cores.toFixed(3)} cores`}
            />
            <MetricCard
              title="Avg Memory"
              value={`${rawMetrics.avg_memory_gb.toFixed(2)} GB`}
            />
            <MetricCard
              title="Avg Network"
              value={`${rawMetrics.avg_network_gb.toFixed(4)} GB`}
            />
            <MetricCard
              title="Avg Storage"
              value={`${rawMetrics.avg_storage_gb.toFixed(2)} GB`}
            />
            <MetricCard
              title="Max CPU"
              value={`${rawMetrics.max_cpu_cores.toFixed(3)} cores`}
            />
            <MetricCard
              title="Max Memory"
              value={`${rawMetrics.max_memory_gb.toFixed(2)} GB`}
            />
            <MetricCard
              title="Nodes"
              value={rawMetrics.node_count.toString()}
            />
          </div>
        </section>
      )}

      {/* ========= COST METRICS ========= */}
      {!loading && costMetrics && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Cost Summary</h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="CPU Cost"
              value={`$${costMetrics.cpu_cost_usd.toFixed(2)}`}
            />
            <MetricCard
              title="Memory Cost"
              value={`$${costMetrics.memory_cost_usd.toFixed(2)}`}
            />
            <MetricCard
              title="Network Cost"
              value={`$${costMetrics.network_cost_usd.toFixed(2)}`}
            />
            <MetricCard
              title="Ephemeral Storage"
              value={`$${costMetrics.ephemeral_storage_cost_usd.toFixed(2)}`}
            />
            <MetricCard
              title="Persistent Storage"
              value={`$${costMetrics.persistent_storage_cost_usd.toFixed(2)}`}
            />
            <MetricCard
              title="Total Cost"
              value={`$${costMetrics.total_cost_usd.toFixed(2)}`}
              highlight
            />
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight ? "border-amber-500 bg-amber-50" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
