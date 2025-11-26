import { useCallback, useEffect, useMemo, useState } from "react";
import type { MetricGetResponse } from "@/types/metrics";
import { metricApi } from "@/shared/api";

interface GeneratedAlert {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  source: string;
}

export function AlertsPage() {
  const [clusterMetrics, setClusterMetrics] = useState<MetricGetResponse | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<MetricGetResponse | null>(null);
  const [podMetrics, setPodMetrics] = useState<MetricGetResponse | null>(null);
  const [alerts, setAlerts] = useState<GeneratedAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clusterRes, nodeRes, podRes] = await Promise.all([
        metricApi.fetchClusterRaw(),
        metricApi.fetchNodesRaw(),
        metricApi.fetchPodsRaw(),
      ]);
      setClusterMetrics(clusterRes.data ?? null);
      setNodeMetrics(nodeRes.data ?? null);
      setPodMetrics(podRes.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alert metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  const generatedAlerts = useMemo(() => {
    const result: GeneratedAlert[] = [];
    const evaluateSeries = (
      series: MetricGetResponse | null,
      source: string,
      type: "cpu" | "memory"
    ) => {
      if (!series) {
        return;
      }
      series.series.forEach((entry) => {
        const lastPoint = entry.points[entry.points.length - 1];
        if (!lastPoint) {
          return;
        }
        const value =
          type === "cpu"
            ? lastPoint.cpu_memory?.cpu_usage_nano_cores ?? 0
            : lastPoint.cpu_memory?.memory_usage_bytes ?? 0;
        const prevPoint = entry.points[entry.points.length - 2];
        const prevValue =
          type === "cpu"
            ? prevPoint?.cpu_memory?.cpu_usage_nano_cores ?? 0
            : prevPoint?.cpu_memory?.memory_usage_bytes ?? 0;
        if (value > prevValue * 1.5 && value > 100_000_000) {
          result.push({
            id: `${source}-${entry.key}-${type}`,
            message: `${source} ${entry.name ?? entry.key} shows a spike in ${type}.`,
            severity: "warning",
            source,
          });
        }
        if (value === 0 && prevValue > 0) {
          result.push({
            id: `${source}-${entry.key}-${type}-drop`,
            message: `${source} ${entry.name ?? entry.key} dropped to zero ${type}, possible failure.`,
            severity: "critical",
            source,
          });
        }
      });
    };

    evaluateSeries(nodeMetrics, "Node", "cpu");
    evaluateSeries(podMetrics, "Pod", "cpu");
    evaluateSeries(clusterMetrics, "Cluster", "memory");

    if (!result.length) {
      result.push({
        id: "no-alerts",
        message: "No anomalies detected. System is operating within expected ranges.",
        severity: "info",
        source: "system",
      });
    }

    return result;
  }, [clusterMetrics, nodeMetrics, podMetrics]);

  useEffect(() => {
    setAlerts(generatedAlerts);
  }, [generatedAlerts]);

  const alertState = useMemo(
    () => ({
      alerts,
      isLoading,
      error,
    }),
    [alerts, error, isLoading]
  );

  useEffect(() => {
    // Placeholder effect for alert data integration
  }, [alertState]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">Alerts</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Anomaly Center</h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Synthetic alerts derived from workload metrics. Highlight spikes, waste, or potential
          failures even before backend alerting is wired up.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Current Alerts</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {alerts.length} generated insight(s)
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchMetrics()}
            className="rounded-full border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:border-amber-600 hover:text-amber-700 dark:text-amber-300"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-4 p-6">
          {isLoading && <p className="text-sm text-slate-500">Scanning metrics…</p>}
          {!isLoading &&
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {alert.message}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      alert.severity === "critical"
                        ? "bg-red-500/10 text-red-600"
                        : alert.severity === "warning"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Source: {alert.source}</p>
              </div>
            ))}
          {!isLoading && alerts.length === 0 && (
            <p className="text-sm text-slate-500">No active alerts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
