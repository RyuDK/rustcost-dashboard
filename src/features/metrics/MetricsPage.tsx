import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MetricCostSummaryResponse,
  MetricGetResponse,
  MetricRawEfficiencyResponse,
} from "@/shared/api/metric";
import { metricApi } from "@/shared/api";

type MetricsTab = "cost" | "usage" | "efficiency" | "trends" | "ai";

interface AiInsight {
  id: string;
  summary: string;
  confidence: number;
}

export function MetricsPage() {
  const [activeTab, setActiveTab] = useState<MetricsTab>("cost");
  const [clusterCost, setClusterCost] = useState<MetricCostSummaryResponse | null>(null);
  const [clusterUsage, setClusterUsage] = useState<MetricGetResponse | null>(null);
  const [nodeUsage, setNodeUsage] = useState<MetricGetResponse | null>(null);
  const [podUsage, setPodUsage] = useState<MetricGetResponse | null>(null);
  const [namespaceUsage, setNamespaceUsage] = useState<MetricGetResponse | null>(null);
  const [efficiency, setEfficiency] = useState<MetricRawEfficiencyResponse | null>(null);
  const [aiReport, setAiReport] = useState<AiInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        clusterCostRes,
        clusterUsageRes,
        nodeUsageRes,
        podUsageRes,
        nsUsageRes,
        efficiencyRes,
      ] = await Promise.all([
        metricApi.fetchClusterCostSummary(),
        metricApi.fetchClusterRaw(),
        metricApi.fetchNodesRaw(),
        metricApi.fetchPodsRaw(),
        metricApi.fetchNamespacesRaw(),
        metricApi.fetchClusterRawEfficiency(),
      ]);

      const costData = clusterCostRes.data ?? null;
      const clusterSeries = clusterUsageRes.data ?? null;
      const nodeSeries = nodeUsageRes.data ?? null;
      const podSeries = podUsageRes.data ?? null;
      const namespaceSeries = nsUsageRes.data ?? null;

      setClusterCost(costData);
      setClusterUsage(clusterSeries);
      setNodeUsage(nodeSeries);
      setPodUsage(podSeries);
      setNamespaceUsage(namespaceSeries);
      setEfficiency(efficiencyRes.data ?? null);

      if (costData && clusterSeries && nodeSeries) {
        const insights: AiInsight[] = [];
        if (
          (costData.summary.cpu_cost_usd ?? 0) >
          (costData.summary.memory_cost_usd ?? 0) * 1.2
        ) {
          insights.push({
            id: "cost-trend",
            summary: "CPU cost growth is outpacing memory cost growth.",
            confidence: 0.72,
          });
        }
        if (efficiencyRes.data.data?.efficiency.overall_efficiency ?? 0 < 0.5) {
          insights.push({
            id: "low-efficiency",
            summary: "Overall efficiency is below 50%, potential savings available.",
            confidence: 0.81,
          });
        }
        if (
          nodeSeries.series.some((series) => {
            const last = series.points[series.points.length - 1];
            return (last?.cpu_memory?.cpu_usage_nano_cores ?? 0) > 100_000_000;
          })
        ) {
          insights.push({
            id: "node-hotspot",
            summary: "One or more nodes show CPU hotspots.",
            confidence: 0.65,
          });
        }
        setAiReport(insights);
      } else {
        setAiReport([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const tabPayload = useMemo(
    () => ({
      cost: clusterCost,
      usage: {
        cluster: clusterUsage,
        nodes: nodeUsage,
        pods: podUsage,
        namespaces: namespaceUsage,
      },
      efficiency,
      trends: clusterUsage?.series ?? [],
      ai: aiReport,
    }),
    [aiReport, clusterCost, clusterUsage, efficiency, namespaceUsage, nodeUsage, podUsage]
  );

  const metricsState = useMemo(
    () => ({
      activeTab,
      tabPayload,
      isLoading,
      error,
    }),
    [activeTab, error, isLoading, tabPayload]
  );

  useEffect(() => {
    // Placeholder effect for metrics state wiring
  }, [metricsState]);

  const handleTabChange = useCallback((tab: MetricsTab) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    // Placeholder effect for tab change handler
  }, [handleTabChange]);

  const tabs: MetricsTab[] = ["cost", "usage", "efficiency", "trends", "ai"];

  const renderSeries = (metrics: MetricGetResponse | null) => {
    if (!metrics || metrics.series.length === 0) {
      return <p className="text-sm text-slate-500">No series data available.</p>;
    }
    return (
      <div className="grid gap-3">
        {metrics.series.slice(0, 5).map((series) => (
          <div
            key={series.key}
            className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {series.name ?? series.key}
            </p>
            <p className="text-xs text-slate-500">
              Points: {series.points.length} · Scope: {series.scope}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">Metrics</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Unified Metrics Explorer
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Cost, usage, efficiency, trend, and AI reports derived from the shared APIs.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
              tab === activeTab
                ? "border-amber-500 bg-amber-500/10 text-amber-600"
                : "border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-500 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cluster Cost</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {clusterCost ? `$${clusterCost.summary.total_cost_usd.toFixed(2)}` : "—"}
          </p>
          <p className="text-xs text-slate-500">CPU: ${clusterCost?.summary.cpu_cost_usd ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Efficiency</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {efficiency ? `${Math.round(efficiency.efficiency.overall_efficiency * 100)}%` : "—"}
          </p>
          <p className="text-xs text-slate-500">Overall utilization</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active series</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {clusterUsage?.series.length ?? 0}
          </p>
          <p className="text-xs text-slate-500">Cluster view</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">AI insights</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {aiReport.length}
          </p>
          <p className="text-xs text-slate-500">Generated recommendations</p>
        </div>
      </section>

      {activeTab === "cost" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Cluster Cost Summary
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Breakdown of cost categories across CPU, memory, and storage.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {clusterCost ? (
              <>
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-wide text-slate-400">CPU</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    ${clusterCost.summary.cpu_cost_usd.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Memory</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    ${clusterCost.summary.memory_cost_usd.toFixed(2)}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Cost data not available.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "usage" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cluster</h2>
            {renderSeries(clusterUsage)}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nodes</h2>
            {renderSeries(nodeUsage)}
          </div>
        </section>
      )}

      {activeTab === "efficiency" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Efficiency</h2>
          {efficiency ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-400">CPU</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {(efficiency.efficiency.cpu_efficiency * 100).toFixed(0)}%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-400">Memory</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {(efficiency.efficiency.memory_efficiency * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Efficiency data unavailable.</p>
          )}
        </section>
      )}

      {activeTab === "trends" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Trend Series (Cluster)
          </h2>
          {renderSeries(clusterUsage)}
        </section>
      )}

      {activeTab === "ai" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Report</h2>
          <div className="mt-4 space-y-3">
            {aiReport.length === 0 && (
              <p className="text-sm text-slate-500">No AI recommendations yet.</p>
            )}
            {aiReport.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {report.summary}
                </p>
                <p className="text-xs text-slate-500">Confidence: {report.confidence * 100}%</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
