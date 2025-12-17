// src/features/workloads/metrics/pages/PodsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import { SharedMetricsSummaryCards } from "@/shared/components/metrics/SharedMetricsSummaryCards";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import {
  SharedMetricChart,
  type ChartSeries,
} from "@/shared/components/chart/SharedMetricChart";
import { MetricTable } from "@/shared/components/MetricTable";

import { formatCurrency } from "@/shared/utils/format";
import type {
  MetricsQueryOptions,
  MetricGetResponse,
  MetricSeries,
} from "@/types/metrics";
import { metricApi, stateApi } from "@/shared/api";

import { useI18n } from "@/app/providers/i18n/useI18n";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";

import { useDebouncedEffect } from "@/shared/hooks/useDebouncedEffect";
import { getDefaultRange, normalizeRange } from "@/shared/utils/metrics";
import { MetricsInventorySelector } from "@/features/metrics/components/MetricsInventorySelector";
import { useInventorySelection } from "@/shared/hooks/useInventorySelection";
import { useLatestRequestGuard } from "@/shared/hooks/useLatestRequestGuard";

type PodRow = {
  id: string;
  label: string;
  total_cost_usd?: number;
  cpu_cost_usd?: number;
  memory_cost_usd?: number;
  storage_cost_usd?: number;
};

type CostPoint = {
  time?: string;
  total_cost_usd: number;
  cpu_cost_usd: number;
  memory_cost_usd: number;
  storage_cost_usd: number;
};

type UsagePoint = {
  time?: string;
  cpu_cores: number;
  memory_gb: number;
};

type PodOption = { uid: string; label: string };

const getSeriesKey = (s: MetricSeries): string => {
  const anyS = s as any;
  return (anyS?.key ?? anyS?.target ?? s.name ?? "") as string;
};

export const PodsPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const [params, setParams] = useState<MetricsQueryOptions>(getDefaultRange);

  const [search, setSearch] = useState("");

  const [costSummary, setCostSummary] = useState<
    Record<string, number | undefined>
  >({});
  const [tableData, setTableData] = useState<PodRow[]>([]);
  const [trendSeries, setTrendSeries] = useState<MetricSeries[]>([]);
  const [rawSeries, setRawSeries] = useState<MetricSeries[]>([]);
  const [podRaw, setPodRaw] = useState<MetricGetResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { begin, isLatest } = useLatestRequestGuard();

  // --- inventory (pods) ---
  const fetchPods = useCallback(async (): Promise<PodOption[]> => {
    const res = await stateApi.k8s.fetchK8sRuntimeState();
    const runtimePods = res.data?.pods ?? {};
    return Object.values(runtimePods).map((pod) => ({
      uid: pod.uid,
      label: `${pod.namespace}/${pod.name}`,
    }));
  }, []);

  const inventory = useInventorySelection<PodOption>({
    fetchItems: fetchPods,
    getKey: (p) => p.uid,
    getLabel: (p) => p.label,
    initialSelectedKey: null,
  });

  const pods = inventory.items;
  const selectedPodUid = inventory.selectedKey; // uid
  const selectedPod = inventory.selectedItem; // { uid, label }

  // inventory 로딩 (deps 안정화: refreshItems만)
  useEffect(() => {
    (async () => {
      try {
        await inventory.refreshItems();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load pod list"
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory.refreshItems]);

  const loadMetrics = useCallback(async () => {
    const token = begin();

    setLoading(true);
    setError(null);

    try {
      const [summaryRes, listRes, rawRes, podsRawRes] = await Promise.all([
        metricApi.fetchPodsCostSummary(params),
        metricApi.fetchPodsCost({ ...params, limit: 10, offset: 0 }),
        selectedPodUid
          ? metricApi.fetchPodRaw({ podUid: selectedPodUid }, params)
          : Promise.resolve<MetricGetResponse | null>(null),
        metricApi.fetchPodsRaw({ ...params, limit: 10, offset: 0 }),
      ]);

      if (!isLatest(token)) return;

      const summary = summaryRes.data?.summary;
      setCostSummary({
        total: summary?.total_cost_usd,
        cpu: summary?.cpu_cost_usd,
        memory: summary?.memory_cost_usd,
        storage:
          (summary?.ephemeral_storage_cost_usd ?? 0) +
          (summary?.persistent_storage_cost_usd ?? 0),
        network: summary?.network_cost_usd,
      });

      const series = listRes.data?.series ?? [];
      setTrendSeries(series);

      setTableData(
        series.map((s) => {
          const last = s.points?.at(-1);
          const target = (s as any)?.target ?? s.name ?? "unknown";
          return {
            id: target,
            label: target,
            total_cost_usd: last?.cost?.total_cost_usd,
            cpu_cost_usd: last?.cost?.cpu_cost_usd,
            memory_cost_usd: last?.cost?.memory_cost_usd,
            storage_cost_usd: last?.cost?.storage_cost_usd,
          };
        })
      );

      setPodRaw((rawRes as any)?.data ?? null);
      setRawSeries(podsRawRes.data?.series ?? []);
    } catch (err) {
      if (!isLatest(token)) return;
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      if (isLatest(token)) setLoading(false);
    }
  }, [begin, isLatest, params, selectedPodUid]);

  // metrics fetch (deps 안정화: loadMetrics만)
  useDebouncedEffect(() => void loadMetrics(), [loadMetrics], 300);

  // --- derived lists (search) ---
  const filteredPods = useMemo(() => {
    const term = search.toLowerCase().trim();
    const pool = term
      ? pods.filter((p) => p.label.toLowerCase().includes(term))
      : pods;
    return pool.slice(0, 10);
  }, [pods, search]);

  const filteredTable = useMemo(() => {
    const term = search.toLowerCase().trim();
    return tableData
      .filter((row) => (term ? row.label.toLowerCase().includes(term) : true))
      .slice(0, 10);
  }, [tableData, search]);

  // --- summary cards ---
  const summaryCards = useMemo(
    () => [
      {
        label: "Total Cost",
        value: formatCurrency(costSummary.total ?? 0, "USD"),
      },
      { label: "CPU Cost", value: formatCurrency(costSummary.cpu ?? 0, "USD") },
      {
        label: "Memory Cost",
        value: formatCurrency(costSummary.memory ?? 0, "USD"),
      },
      {
        label: "Storage Cost",
        value: formatCurrency(costSummary.storage ?? 0, "USD"),
      },
      {
        label: "Network Cost",
        value: formatCurrency(costSummary.network ?? 0, "USD"),
      },
    ],
    [costSummary]
  );

  // --- series maps ---
  const trendSeriesMap = useMemo(() => {
    const m = new Map<string, MetricSeries>();
    for (const s of trendSeries) {
      const key = getSeriesKey(s);
      if (key) m.set(key, s);
    }
    return m;
  }, [trendSeries]);

  const rawSeriesMap = useMemo(() => {
    const m = new Map<string, MetricSeries>();
    for (const s of rawSeries) {
      const key = getSeriesKey(s);
      if (key) m.set(key, s);
    }
    return m;
  }, [rawSeries]);

  // --- chart data ---
  // cost trend는 "label(namespace/name)" 기준으로만 매칭 (uid mismatch 방지)
  const costChartSeriesData: CostPoint[] = useMemo(() => {
    const labelKey = selectedPod?.label?.trim();
    if (!labelKey) return [];

    const match = trendSeriesMap.get(labelKey);
    if (!match) return [];

    return (
      match.points?.map((pt) => ({
        time: (pt as any)?.timestamp ?? pt.time,
        total_cost_usd: pt.cost?.total_cost_usd ?? 0,
        cpu_cost_usd: pt.cost?.cpu_cost_usd ?? 0,
        memory_cost_usd: pt.cost?.memory_cost_usd ?? 0,
        storage_cost_usd: pt.cost?.storage_cost_usd ?? 0,
      })) ?? []
    );
  }, [selectedPod?.label, trendSeriesMap]);

  const podRawSeriesData: UsagePoint[] = useMemo(() => {
    const s = podRaw?.series?.[0];
    return (
      s?.points?.map((pt) => ({
        time: (pt as any)?.timestamp ?? pt.time,
        cpu_cores: (pt.cpu_memory?.cpu_usage_nano_cores ?? 0) / 1e9,
        memory_gb: (pt.cpu_memory?.memory_usage_bytes ?? 0) / 1_073_741_824,
      })) ?? []
    );
  }, [podRaw]);

  const costSeries: ChartSeries<CostPoint>[] = useMemo(
    () => [
      {
        key: "total_cost_usd",
        label: "Total",
        color: "#2563eb",
        valueFormatter: (v) => formatCurrency(v, "USD"),
      },
      {
        key: "cpu_cost_usd",
        label: "CPU",
        color: "#10b981",
        valueFormatter: (v) => formatCurrency(v, "USD"),
      },
      {
        key: "memory_cost_usd",
        label: "Memory",
        color: "#f59e0b",
        valueFormatter: (v) => formatCurrency(v, "USD"),
      },
      {
        key: "storage_cost_usd",
        label: "Storage",
        color: "#8b5cf6",
        valueFormatter: (v) => formatCurrency(v, "USD"),
      },
    ],
    []
  );

  const usageSeries: ChartSeries<UsagePoint>[] = useMemo(
    () => [
      {
        key: "cpu_cores",
        label: "CPU (cores)",
        color: "#22c55e",
        valueFormatter: (v) => `${v.toFixed(2)} cores`,
      },
      {
        key: "memory_gb",
        label: "Memory (GB)",
        color: "#f97316",
        valueFormatter: (v) => `${v.toFixed(2)} GB`,
      },
    ],
    []
  );

  const tableColumns = useMemo(
    () => [
      { key: "label", header: "Pod", render: (row: PodRow) => row.label },
      {
        key: "total_cost_usd",
        header: "Total Cost",
        align: "right" as const,
        render: (row: PodRow) => formatCurrency(row.total_cost_usd ?? 0, "USD"),
      },
      {
        key: "cpu_cost_usd",
        header: "CPU",
        align: "right" as const,
        render: (row: PodRow) => formatCurrency(row.cpu_cost_usd ?? 0, "USD"),
      },
      {
        key: "memory_cost_usd",
        header: "Memory",
        align: "right" as const,
        render: (row: PodRow) =>
          formatCurrency(row.memory_cost_usd ?? 0, "USD"),
      },
      {
        key: "storage_cost_usd",
        header: "Storage",
        align: "right" as const,
        render: (row: PodRow) =>
          formatCurrency(row.storage_cost_usd ?? 0, "USD"),
      },
    ],
    []
  );

  // --- sparklines (fallback 제거: 매칭 없으면 빈 데이터) ---
  const sparklinePods = useMemo(
    () => filteredPods.slice(0, 10),
    [filteredPods]
  );

  const sparklineCards = useMemo(() => {
    return sparklinePods.map((pod) => {
      const s = rawSeriesMap.get(pod.label); // uid fallback 제거

      const metrics =
        s?.points?.map((pt) => ({
          time: (pt as any)?.timestamp ?? pt.time,
          cpu_cores: (pt.cpu_memory?.cpu_usage_nano_cores ?? 0) / 1e9,
          memory_gb: (pt.cpu_memory?.memory_usage_bytes ?? 0) / 1_073_741_824,
          storage_gb: (pt.filesystem?.used_bytes ?? 0) / 1_073_741_824,
          network_tx_mb: (pt.network?.tx_bytes ?? 0) / 1_000_000,
          network_rx_mb: (pt.network?.rx_bytes ?? 0) / 1_000_000,
        })) ?? [];

      const cpuMemSeries: ChartSeries<(typeof metrics)[number]>[] = [
        {
          key: "cpu_cores",
          label: "CPU (cores)",
          color: "#22c55e",
          valueFormatter: (v) => `${v.toFixed(2)} cores`,
        },
        {
          key: "memory_gb",
          label: "Memory (GB)",
          color: "#f97316",
          valueFormatter: (v) => `${v.toFixed(2)} GB`,
        },
      ];

      const storageNetSeries: ChartSeries<(typeof metrics)[number]>[] = [
        {
          key: "storage_gb",
          label: "Storage (GB)",
          color: "#6366f1",
          valueFormatter: (v) => `${v.toFixed(2)} GB`,
        },
        {
          key: "network_tx_mb",
          label: "TX (MB)",
          color: "#0ea5e9",
          valueFormatter: (v) => `${v.toFixed(1)} MB`,
        },
        {
          key: "network_rx_mb",
          label: "RX (MB)",
          color: "#14b8a6",
          valueFormatter: (v) => `${v.toFixed(1)} MB`,
        },
      ];

      return { pod, metrics, cpuMemSeries, storageNetSeries };
    });
  }, [sparklinePods, rawSeriesMap]);

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Pod Metrics"
        description="Pod-level cost and usage"
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.metrics"), to: `${prefix}/workloads/metrics` },
          { label: t("nav.pods") },
        ]}
      />

      <SharedMetricsFilterBar
        params={params}
        onChange={(k, v) => setParams((p) => normalizeRange({ ...p, [k]: v }))}
        onRefresh={loadMetrics}
      />

      <MetricsInventorySelector
        label="Search Pods"
        placeholder="Type a pod name"
        items={filteredPods}
        getKey={(p) => p.uid}
        getLabel={(p) => p.label}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          if (!v) inventory.setSelectedKey(pods[0]?.uid ?? null);
        }}
        onPickByLabel={(label) => {
          if (!label) return;
          inventory.pickByLabel(label);
        }}
        onApply={() => {
          const candidate = filteredPods[0] ?? pods[0] ?? null;
          inventory.setSelectedKey(candidate?.uid ?? null);
          setSearch(candidate?.label ?? "");
        }}
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <SharedMetricsSummaryCards cards={summaryCards} isLoading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SharedMetricChart
          title="Cost Trend"
          subtitle={
            selectedPod ? `Cost trend for ${selectedPod.label}` : "Cost trend"
          }
          metrics={costChartSeriesData}
          series={costSeries}
          isLoading={loading}
          getXAxisLabel={(p) => (p.time as string) ?? ""}
        />

        <SharedMetricChart
          title="Usage (Raw)"
          subtitle={
            selectedPod
              ? `CPU & Memory for ${selectedPod.label}`
              : "CPU & Memory (select a pod)"
          }
          metrics={podRawSeriesData}
          series={usageSeries}
          isLoading={loading}
          getXAxisLabel={(p) => (p.time as string) ?? ""}
        />
      </div>

      <MetricTable
        title="Pod Cost (last point)"
        columns={tableColumns}
        data={filteredTable}
        isLoading={loading}
        emptyMessage="No pods matched your search"
      />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Pod Sparklines
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sparklineCards.map((card) => (
            <div
              key={card.pod.uid}
              className="rounded-xl border border-(--border) bg-(--surface)/70 p-4 shadow-sm dark:border-(--border) dark:bg-[var(--surface-dark)]/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {card.pod.label}
                </h4>
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  up to 10 pods
                </span>
              </div>

              <SharedMetricChart
                title="CPU / Memory"
                metrics={card.metrics}
                series={card.cpuMemSeries}
                height={180}
                isLoading={loading}
                getXAxisLabel={(pt) => (pt.time as string) ?? ""}
              />

              <div className="mt-3">
                <SharedMetricChart
                  title="Storage / Network"
                  metrics={card.metrics}
                  series={card.storageNetSeries}
                  height={180}
                  isLoading={loading}
                  getXAxisLabel={(pt) => (pt.time as string) ?? ""}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SharedPageLayout>
  );
};
