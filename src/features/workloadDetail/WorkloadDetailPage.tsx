import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { MetricGetResponse } from "@/types/metrics";
import { infoApi, metricApi } from "@/shared/api";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { formatDateTime, useTimezone } from "@/shared/time";

interface WorkloadResource {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  containers?: Array<{ name: string; image?: string }>;
}

type WorkloadTab =
  | "overview"
  | "metrics"
  | "resources"
  | "costs"
  | "usage"
  | "alerts"
  | "settings";

interface WorkloadOverviewState {
  deployments: WorkloadResource[];
  pods: WorkloadResource[];
  containers: WorkloadResource[];
}

export function WorkloadDetailPage() {
  const { workloadId } = useParams<{ workloadId: string }>();
  const [activeTab] = useState<WorkloadTab>("overview");
  const [overview, setOverview] = useState<WorkloadOverviewState>({
    deployments: [],
    pods: [],
    containers: [],
  });
  const [podMetrics, setPodMetrics] = useState<MetricGetResponse | null>(null);
  const [deploymentMetrics, setDeploymentMetrics] = useState<MetricGetResponse | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { timeZone } = useTimezone();

  const fetchWorkloadResources = useCallback(async () => {
    if (!workloadId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        deploymentsRes,
        podsRes,
        containersRes,
        podMetricsRes,
        deploymentMetricsRes,
      ] = await Promise.all([
        infoApi.fetchK8sDeployments({ limit: 100, offset: 0 }),
        infoApi.fetchInfoK8sPods(),
        infoApi.fetchInfoK8sContainers(),
        metricApi.fetchPodsRaw(),
        metricApi.fetchDeploymentsRaw(),
      ]);

      const matchWorkload = (resource: WorkloadResource) =>
        resource.labels?.workload === workloadId || resource.name === workloadId;

      const deployments =
        deploymentsRes.data?.items?.map((item) => ({
          name: item.metadata?.name ?? "deployment",
          namespace: item.metadata?.namespace,
          labels: item.metadata?.labels,
          containers:
            item.spec?.template?.spec?.containers?.map((container) => ({
              name: container.name ?? "container",
              image: container.image,
            })) ?? [],
        })) ?? [];

      setOverview({
        deployments: deployments.filter(matchWorkload),
        pods: (podsRes.data ?? []).filter(matchWorkload),
        containers: (containersRes.data ?? []).filter(matchWorkload),
      });

      const podMetricData = podMetricsRes.data
        ? {
            ...podMetricsRes.data,
            series: podMetricsRes.data.series.filter(
              (series) =>
                series.key === workloadId ||
                series.name === workloadId ||
                series.name?.includes(workloadId ?? "")
            ),
          }
        : null;

      const deploymentMetricData = deploymentMetricsRes.data
        ? {
            ...deploymentMetricsRes.data,
            series: deploymentMetricsRes.data.series.filter(
              (series) =>
                series.key === workloadId ||
                series.name === workloadId ||
                series.name?.includes(workloadId ?? "")
            ),
          }
        : null;

      setPodMetrics(podMetricData);
      setDeploymentMetrics(deploymentMetricData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workload data");
    } finally {
      setIsLoading(false);
    }
  }, [workloadId]);

  useEffect(() => {
    void fetchWorkloadResources();
  }, [fetchWorkloadResources]);

  const workloadInsights = useMemo(() => {
    if (!podMetrics) {
      return [];
    }
    const { series } = podMetrics;
    const messages: string[] = [];
    series.forEach((item) => {
      const latestPoint = item.points[item.points.length - 1];
      if (!latestPoint) {
        return;
      }
      if ((latestPoint.cpu_memory?.cpu_usage_nano_cores ?? 0) > 80_000_000) {
        messages.push(
          `High CPU usage detected for ${item.name ?? item.key}. Consider scaling replicas.`
        );
      }
    });
    return messages;
  }, [podMetrics]);

  useEffect(() => {
    setAlerts(workloadInsights);
  }, [workloadInsights]);

  const tabState = useMemo(
    () => ({
      activeTab,
      overview,
      metrics: {
        pods: podMetrics,
        deployments: deploymentMetrics,
      },
      resources: overview.containers,
      costs: deploymentMetrics?.series ?? [],
      usage: podMetrics?.series ?? [],
      alerts,
      loading: isLoading,
      error,
    }),
    [activeTab, alerts, deploymentMetrics, error, isLoading, overview, podMetrics]
  );

  useEffect(() => {
    // Placeholder effect for tab state wiring
  }, [tabState]);

  const sections = [
    { key: "overview", label: "Overview" },
    { key: "metrics", label: "Metrics" },
    { key: "resources", label: "Resources" },
    { key: "costs", label: "Costs" },
    { key: "usage", label: "Usage" },
    { key: "alerts", label: "Alerts" },
  ] as const;

  const renderMetricsList = (metrics: MetricGetResponse | null, placeholder: string) => {
    if (!metrics || metrics.series.length === 0) {
      return <p className="text-sm text-slate-500">{placeholder}</p>;
    }
    return (
      <div className="space-y-3">
        {metrics.series.slice(0, 5).map((series) => (
          <div
            key={series.key}
            className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {series.name ?? series.key}
            </p>
            <p className="text-xs text-slate-500">
              Last sample:{" "}
              {formatDateTime(series.points[series.points.length - 1]?.time ?? Date.now(), {
                timeZone,
              })}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <SharedPageLayout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">
            Workload Detail
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {workloadId ?? "Unknown Workload"}
          </h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Deep dive into deployments, pods, and containers that compose this workload. Metrics,
            resources, and alerts update as new telemetry is ingested.
          </p>
        </header>

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <span
            key={section.key}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            {section.label}
          </span>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Deployments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {overview.deployments.length} deployment(s) linked to this workload.
          </p>
          <div className="mt-4 space-y-3">
            {overview.deployments.map((deployment) => (
              <div
                key={deployment.name}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {deployment.name}
                </p>
                <p className="text-xs text-slate-500">
                  Namespace: {deployment.namespace ?? "default"}
                </p>
              </div>
            ))}
            {overview.deployments.length === 0 && (
              <p className="text-sm text-slate-500">No deployments detected.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alerts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI-driven indicators derived from pod metrics.
          </p>
          <div className="mt-4 space-y-3">
            {alerts.length === 0 && (
              <p className="text-sm text-slate-500">No alerts triggered for this workload.</p>
            )}
            {alerts.map((alert) => (
              <div
                key={alert}
                className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              >
                {alert}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pod Metrics</h2>
          {renderMetricsList(podMetrics, "No pod series available.")}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Deployment Metrics
          </h2>
          {renderMetricsList(deploymentMetrics, "No deployment series available.")}
        </div>
      </section>
      </div>
    </SharedPageLayout>
  );
}
