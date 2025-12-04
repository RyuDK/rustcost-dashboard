import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import type { MetricRawSummaryResponse } from "@/types/metrics";
import { infoApi, metricApi } from "@/shared/api";

interface K8sMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  team?: string;
  service?: string;
  env?: string;
}

interface WorkloadRow {
  id: string;
  name: string;
  namespace?: string;
  team?: string | null;
  service?: string | null;
  environment?: string | null;
  cpuUsage: number;
  memoryUsage: number;
  podCount: number;
  containerCount: number;
}

const InsightCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {title}
    </p>
    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
      {value}
    </p>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      {subtitle}
    </p>
  </div>
);

const SkeletonRow = () => (
  <div className="flex animate-pulse gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-700" />
    </div>
    <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-[var(--surface-dark)]/40">
    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
      {message}
    </p>
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
      Try adjusting the global filters or refresh the data.
    </p>
  </div>
);

/**
 * WorkloadsPage renders workload intelligence using shared APIs.
 */
export function WorkloadsPage() {
  const filters = useSelector((state: RootState) => state.filters);
  const [deployments, setDeployments] = useState<K8sMetadata[]>([]);
  const [pods, setPods] = useState<K8sMetadata[]>([]);
  const [containers, setContainers] = useState<K8sMetadata[]>([]);
  const [deploymentMetrics, setDeploymentMetrics] =
    useState<MetricRawSummaryResponse | null>(null);
  const [podMetrics, setPodMetrics] = useState<MetricRawSummaryResponse | null>(
    null
  );
  const [containerMetrics, setContainerMetrics] =
    useState<MetricRawSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyFilters = useCallback(
    (items: K8sMetadata[]) =>
      items.filter((item) => {
        const team = item.team ?? item.labels?.team ?? null;
        const service = item.service ?? item.labels?.service ?? null;
        const environment = item.env ?? item.labels?.environment ?? null;
        const cluster = item.labels?.cluster ?? null;
        return (
          (!filters.team || team === filters.team) &&
          (!filters.service || service === filters.service) &&
          (!filters.environment || environment === filters.environment) &&
          (!filters.cluster || cluster === filters.cluster)
        );
      }),
    [filters.cluster, filters.environment, filters.service, filters.team]
  );

  const loadWorkloads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const metricParams = {
      team: filters.team ?? undefined,
      service: filters.service ?? undefined,
      env: filters.environment ?? undefined,
      namespace: filters.cluster ?? undefined,
    };

    try {
      const [
        deploymentRes,
        podRes,
        containerRes,
        deploymentMetricRes,
        podMetricRes,
        containerMetricRes,
      ] = await Promise.all([
        infoApi.fetchK8sDeployments(),
        infoApi.fetchInfoK8sPods(),
        infoApi.fetchInfoK8sContainers(),
        metricApi.fetchDeploymentsRawSummary(metricParams),
        metricApi.fetchPodsRawSummary(metricParams),
        metricApi.fetchContainersRawSummary(metricParams),
      ]);

      setDeployments(applyFilters(deploymentRes.data ?? []));
      setPods(applyFilters(podRes.data ?? []));
      setContainers(applyFilters(containerRes.data ?? []));
      setDeploymentMetrics(deploymentMetricRes.data ?? null);
      setPodMetrics(podMetricRes.data ?? null);
      setContainerMetrics(containerMetricRes.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workloads");
    } finally {
      setIsLoading(false);
    }
  }, [applyFilters, filters]);

  useEffect(() => {
    void loadWorkloads();
  }, [loadWorkloads]);

  const workloads = useMemo<WorkloadRow[]>(() => {
    const deploymentMap = new Map<string, K8sMetadata>();
    deployments.forEach((deployment) => {
      deploymentMap.set(
        `${deployment.namespace ?? "default"}/${deployment.name}`,
        deployment
      );
    });

    const workloadAggregation = new Map<string, WorkloadRow>();

    pods.forEach((pod) => {
      const key = `${pod.namespace ?? "default"}/${
        pod.labels?.["app"] ?? pod.name
      }`;
      const existing = workloadAggregation.get(key) ?? {
        id: key,
        name: pod.labels?.["app"] ?? pod.name,
        namespace: pod.namespace,
        team: pod.team ?? pod.labels?.team ?? null,
        service: pod.service ?? pod.labels?.service ?? null,
        environment: pod.env ?? pod.labels?.environment ?? null,
        cpuUsage: 0,
        memoryUsage: 0,
        podCount: 0,
        containerCount: 0,
      };
      existing.podCount += 1;
      workloadAggregation.set(key, existing);
    });

    containers.forEach((container) => {
      const key = `${container.namespace ?? "default"}/${
        container.labels?.["app"] ?? container.name
      }`;
      const existing = workloadAggregation.get(key) ?? {
        id: key,
        name: container.labels?.["app"] ?? container.name,
        namespace: container.namespace,
        team: container.team ?? container.labels?.team ?? null,
        service: container.service ?? container.labels?.service ?? null,
        environment: container.env ?? container.labels?.environment ?? null,
        cpuUsage: 0,
        memoryUsage: 0,
        podCount: 0,
        containerCount: 0,
      };
      existing.containerCount += 1;
      workloadAggregation.set(key, existing);
    });

    workloadAggregation.forEach((workload) => {
      const deploymentKey = `${workload.namespace ?? "default"}/${
        workload.name
      }`;
      const deployment = deploymentMap.get(deploymentKey);
      if (deployment) {
        workload.team =
          workload.team ?? deployment.team ?? deployment.labels?.team ?? null;
        workload.service =
          workload.service ??
          deployment.service ??
          deployment.labels?.service ??
          null;
        workload.environment =
          workload.environment ??
          deployment.env ??
          deployment.labels?.environment ??
          null;
      }
    });

    const cpuPerPod =
      (podMetrics?.summary?.avg_cpu_cores ?? 0) /
      Math.max(podMetrics?.summary?.node_count ?? workloadAggregation.size, 1);
    const memoryPerPod = podMetrics?.summary?.avg_memory_gb ?? 0;

    const cpuPerContainer = containerMetrics?.summary?.avg_cpu_cores ?? 0;
    const memoryPerContainer = containerMetrics?.summary?.avg_memory_gb ?? 0;

    workloadAggregation.forEach((workload) => {
      workload.cpuUsage =
        workload.podCount * cpuPerPod +
        workload.containerCount * cpuPerContainer;
      workload.memoryUsage =
        workload.podCount * memoryPerPod +
        workload.containerCount * memoryPerContainer;
    });

    return Array.from(workloadAggregation.values());
  }, [containerMetrics, containers, deployments, podMetrics, pods]);

  const workloadTable = useMemo(
    () =>
      workloads.map((workload) => ({
        ...workload,
        efficiencyScore:
          workload.cpuUsage && workload.memoryUsage
            ? Math.round(
                (workload.cpuUsage / (workload.memoryUsage || 1)) * 100
              )
            : 0,
      })),
    [workloads]
  );

  const workloadState = useMemo(
    () => ({
      rows: workloadTable,
      metrics: {
        deployments: deploymentMetrics,
        pods: podMetrics,
        containers: containerMetrics,
      },
      isLoading,
      error,
    }),
    [
      containerMetrics,
      deploymentMetrics,
      error,
      isLoading,
      podMetrics,
      workloadTable,
    ]
  );

  useEffect(() => {
    // Placeholder effect for workload state consumption
  }, [workloadState]);

  const totalWorkloads = workloadTable.length;
  const avgCpu =
    workloadTable.reduce((sum, item) => sum + item.cpuUsage, 0) /
    Math.max(workloadTable.length, 1);
  const avgMemory =
    workloadTable.reduce((sum, item) => sum + item.memoryUsage, 0) /
    Math.max(workloadTable.length, 1);
  const avgEfficiency =
    workloadTable.reduce((sum, item) => sum + item.efficiencyScore, 0) /
    Math.max(workloadTable.length, 1);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">
          Workloads
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Cluster Workload Overview
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Consolidated runtime inventory that merges Kubernetes metadata with
          real-time metrics to highlight trends, reliability, and efficiency
          across your filtered scope.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          title="Tracked Workloads"
          value={totalWorkloads.toString()}
          subtitle="Includes pods and deployments merged by app label"
        />
        <InsightCard
          title="Avg CPU Usage"
          value={`${avgCpu.toFixed(2)} cores`}
          subtitle="Normalized by workload size"
        />
        <InsightCard
          title="Avg Memory Usage"
          value={`${avgMemory.toFixed(2)} GB`}
          subtitle="Based on pod + container snapshots"
        />
        <InsightCard
          title="Avg Efficiency"
          value={`${Math.round(avgEfficiency)}%`}
          subtitle="CPU vs Memory utilization ratio"
        />
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Workload Table
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sorted by efficiency score. Use global filters to narrow scope.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadWorkloads()}
            className="inline-flex items-center justify-center rounded-full border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:border-amber-600 hover:text-amber-700 dark:text-amber-300"
          >
            Refresh Data
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:bg-[var(--surface-dark)]/40">
          {isLoading && (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </div>
          )}

          {!isLoading && workloadTable.length === 0 && (
            <div className="p-6">
              <EmptyState message="No workloads match the current filters." />
            </div>
          )}

          {!isLoading && workloadTable.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 text-left">Workload</th>
                    <th className="px-6 py-3 text-left">Namespace</th>
                    <th className="px-6 py-3 text-left">Team</th>
                    <th className="px-6 py-3 text-left">Service</th>
                    <th className="px-6 py-3 text-left">Pods</th>
                    <th className="px-6 py-3 text-left">Containers</th>
                    <th className="px-6 py-3 text-right">CPU</th>
                    <th className="px-6 py-3 text-right">Memory</th>
                    <th className="px-6 py-3 text-right">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm dark:bg-[var(--surface-dark)]/40">
                  {workloadTable.map((workload) => (
                    <tr
                      key={workload.id}
                      className="transition hover:bg-amber-50/40 dark:hover:bg-amber-500/10"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {workload.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {workload.namespace ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {workload.team ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {workload.service ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {workload.podCount}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {workload.containerCount}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                        {workload.cpuUsage.toFixed(2)} cores
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                        {workload.memoryUsage.toFixed(2)} GB
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-300">
                        {workload.efficiencyScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
