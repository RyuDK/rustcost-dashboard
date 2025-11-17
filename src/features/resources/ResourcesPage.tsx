import { useCallback, useEffect, useMemo, useState } from "react";
import type { MetricRawSummaryResponse } from "../../shared/api/metric";
import { infoApi, metricApi } from "../../shared/api";

type ResourceTab =
  | "namespaces"
  | "deployments"
  | "pods"
  | "containers"
  | "nodes"
  | "volumes"
  | "hpas"
  | "quotas";

interface ResourceItem {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  metrics?: MetricRawSummaryResponse["summary"];
}

const normalizeResource = (item: Record<string, unknown>, fallback: string): ResourceItem => ({
  name:
    (item.name as string | undefined) ??
    (item.metadata as { name?: string } | undefined)?.name ??
    fallback,
  namespace:
    (item.namespace as string | undefined) ??
    (item.metadata as { namespace?: string } | undefined)?.namespace,
  labels:
    (item.labels as Record<string, string> | undefined) ??
    (item.metadata as { labels?: Record<string, string> } | undefined)?.labels,
});

const listToResourceItems = (
  list: Record<string, unknown> | undefined
): ResourceItem[] =>
  list
    ? Object.entries(list).map(([key, value]) =>
        typeof value === "object" && value !== null
          ? normalizeResource(value as Record<string, unknown>, key)
          : { name: key, labels: {} }
      )
    : [];

const TABS: ResourceTab[] = [
  "namespaces",
  "deployments",
  "pods",
  "containers",
  "nodes",
  "volumes",
  "hpas",
  "quotas",
];

export function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceTab>("namespaces");
  const [resources, setResources] = useState<Record<ResourceTab, ResourceItem[]>>({
    namespaces: [],
    deployments: [],
    pods: [],
    containers: [],
    nodes: [],
    volumes: [],
    hpas: [],
    quotas: [],
  });
  const [loadingTabs, setLoadingTabs] = useState<Record<ResourceTab, boolean>>({
    namespaces: false,
    deployments: false,
    pods: false,
    containers: false,
    nodes: false,
    volumes: false,
    hpas: false,
    quotas: false,
  });
  const [errors, setErrors] = useState<Record<ResourceTab, string | null>>({
    namespaces: null,
    deployments: null,
    pods: null,
    containers: null,
    nodes: null,
    volumes: null,
    hpas: null,
    quotas: null,
  });

  const fetchTabData = useCallback(
    async (tab: ResourceTab) => {
      setLoadingTabs((prev) => ({ ...prev, [tab]: true }));
      setErrors((prev) => ({ ...prev, [tab]: null }));

      try {
        let resourceItems: ResourceItem[] = [];
        let metricSummary: MetricRawSummaryResponse["summary"] | undefined;

        switch (tab) {
          case "namespaces": {
            const [infoRes, metricsRes] = await Promise.all([
              infoApi.fetchK8sNamespaces(),
              metricApi.fetchNamespacesRawSummary(),
            ]);
            resourceItems = listToResourceItems(infoRes.data);
            metricSummary = metricsRes.data?.summary;
            break;
          }
          case "deployments": {
            const [infoRes, metricsRes] = await Promise.all([
              infoApi.fetchK8sDeployments(),
              metricApi.fetchDeploymentsRawSummary(),
            ]);
            resourceItems = (infoRes.data ?? []).map((item, index) =>
              normalizeResource(item as Record<string, unknown>, `deployment-${index}`)
            );
            metricSummary = metricsRes.data?.summary;
            break;
          }
          case "pods": {
            const [infoRes, metricsRes] = await Promise.all([
              infoApi.fetchInfoK8sPods(),
              metricApi.fetchPodsRawSummary(),
            ]);
            resourceItems = (infoRes.data ?? []).map((item, index) =>
              normalizeResource(
                {
                  ...item,
                  name: item.podName ?? item.podUid ?? `pod-${index}`,
                  namespace: item.namespace,
                },
                `pod-${index}`
              )
            );
            metricSummary = metricsRes.data?.summary;
            break;
          }
          case "containers": {
            const [infoRes, metricsRes] = await Promise.all([
              infoApi.fetchInfoK8sContainers(),
              metricApi.fetchContainersRawSummary(),
            ]);
            resourceItems = (infoRes.data ?? []).map((item, index) =>
              normalizeResource(
                {
                  ...item,
                  name: item.containerName ?? `container-${index}`,
                  namespace: item.namespace,
                },
                `container-${index}`
              )
            );
            metricSummary = metricsRes.data?.summary;
            break;
          }
          case "nodes": {
            const [infoRes, metricsRes] = await Promise.all([
              infoApi.fetchInfoK8sNodes(),
              metricApi.fetchNodesRawSummary(),
            ]);
            resourceItems = (infoRes.data ?? []).map((item, index) =>
              normalizeResource(
                {
                  ...item,
                  name: item.node_name ?? `node-${index}`,
                },
                `node-${index}`
              )
            );
            metricSummary = metricsRes.data?.summary;
            break;
          }
          case "volumes": {
            const res = await infoApi.fetchK8sPersistentVolumes();
            resourceItems = listToResourceItems(res.data);
            break;
          }
          case "hpas": {
            const res = await infoApi.fetchK8sHorizontalPodAutoscalers();
            resourceItems = listToResourceItems(res.data);
            break;
          }
          case "quotas": {
            const res = await infoApi.fetchK8sResourceQuotas();
            resourceItems = listToResourceItems(res.data);
            break;
          }
          default:
            resourceItems = [];
        }

        const mapped = resourceItems.map((item) => ({
          ...item,
          metrics: metricSummary,
        }));

        setResources((prev) => ({ ...prev, [tab]: mapped }));
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [tab]: err instanceof Error ? err.message : "Failed to load resources",
        }));
      } finally {
        setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
      }
    },
    []
  );

  useEffect(() => {
    void fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  const tabData = useMemo(
    () => ({
      active: activeTab,
      entries: resources[activeTab],
      loading: loadingTabs[activeTab],
      error: errors[activeTab],
    }),
    [activeTab, errors, loadingTabs, resources]
  );

  useEffect(() => {
    // Placeholder effect for tab data consumers
  }, [tabData]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">
          Resource Explorer
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Cluster Inventories
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Browse Kubernetes objects and their latest metrics. Select a tab to view namespaces,
          workloads, core infra, or quota resources.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
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

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold capitalize text-slate-900 dark:text-white">
              {activeTab}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tabData.entries.length} resource(s) loaded.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Last refreshed automatically
          </span>
        </div>

        <div className="space-y-4 p-6">
          {tabData.loading && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading {activeTab}…</p>
          )}
          {tabData.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {tabData.error}
            </div>
          )}
          {!tabData.loading && tabData.entries.length === 0 && (
            <p className="text-sm text-slate-500">No resources available for {activeTab}.</p>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {tabData.entries.map((item) => (
              <div
                key={`${item.namespace ?? "default"}-${item.name}`}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Namespace: {item.namespace ?? "default"}
                    </p>
                  </div>
                  {item.metrics && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-300">
                      CPU {item.metrics.avg_cpu_cores?.toFixed(1) ?? 0}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
