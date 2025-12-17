import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import { SharedMetricsSummaryCards } from "@/shared/components/metrics/SharedMetricsSummaryCards";
import { MetricTable } from "@/shared/components/MetricTable";
import {
  SharedMetricChart,
  type ChartSeries,
} from "@/shared/components/chart/SharedMetricChart";
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

type PodOption = { uid: string; label: string };

type ContainerRow = {
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

const getSeriesKey = (s: MetricSeries): string =>
  ((s as any)?.key ?? (s as any)?.target ?? s.name ?? "") as string;

export const ContainersPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const [params, setParams] = useState<MetricsQueryOptions>(getDefaultRange);

  // --- Pod selector (Usage Raw용) ---
  const [podSearch, setPodSearch] = useState("");

  const fetchPods = useCallback(async (): Promise<PodOption[]> => {
    const res = await stateApi.k8s.fetchK8sRuntimeState();
    const runtimePods = res.data?.pods ?? {};
    return Object.values(runtimePods).map((pod) => ({
      uid: pod.uid,
      label: `${pod.namespace}/${pod.name}`,
    }));
  }, []);

  const podInventory = useInventorySelection<PodOption>({
    fetchItems: fetchPods,
    getKey: (p) => p.uid,
    getLabel: (p) => p.label,
    initialSelectedKey: null,
  });

  const pods = podInventory.items;
  const selectedPodKey = podInventory.selectedKey; // uid
  const selectedPod = podInventory.selectedItem;

  // --- Container selector (Cost Trend용) ---
  const [containerSearch, setContainerSearch] = useState("");
  const [selectedContainerKey, setSelectedContainerKey] = useState<
    string | null
  >(null);

  // --- Data states ---
  const [costSummary, setCostSummary] = useState<
    Record<string, number | undefined>
  >({});
  const [tableData, setTableData] = useState<ContainerRow[]>([]);
  const [trendSeries, setTrendSeries] = useState<MetricSeries[]>([]);
  const [podRaw, setPodRaw] = useState<MetricGetResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { begin, isLatest } = useLatestRequestGuard();

  // Pods inventory load (deps 안정화: refreshItems만)
  const loadPods = useCallback(async () => {
    try {
      await podInventory.refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pod list");
    }
  }, [podInventory.refreshItems]);

  // Metrics load (deps 안정화: begin/isLatest + params + selectedPodKey)
  const loadMetrics = useCallback(async () => {
    const token = begin();
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, listRes, rawRes] = await Promise.all([
        metricApi.fetchContainersCostSummary(params),
        metricApi.fetchContainersCost({ ...params, limit: 10, offset: 0 }),
        selectedPodKey
          ? metricApi.fetchPodRaw({ podUid: selectedPodKey }, params)
          : Promise.resolve<MetricGetResponse | null>(null),
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
          const last = (s.points ?? []).at(-1);
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
    } catch (err) {
      if (!isLatest(token)) return;
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      if (isLatest(token)) setLoading(false);
    }
  }, [begin, isLatest, params, selectedPodKey]);

  useEffect(() => {
    void loadPods();
  }, [loadPods]);

  // deps 단순화: loadMetrics가 안정적이면 이것만 보면 됨
  useDebouncedEffect(() => void loadMetrics(), [loadMetrics], 300);

  // --- Container options derived from current table/trend (top 10 only) ---
  const containerOptions = useMemo(() => {
    return tableData.map((r) => ({ key: r.id, label: r.label }));
  }, [tableData]);

  // reconcile selected container when list changes
  useEffect(() => {
    if (containerOptions.length === 0) {
      setSelectedContainerKey(null);
      return;
    }
    setSelectedContainerKey((prev) => {
      if (!prev) return containerOptions[0]?.key ?? null;
      const ok = containerOptions.some((x) => x.key === prev);
      return ok ? prev : containerOptions[0]?.key ?? null;
    });
  }, [containerOptions]);

  // --- Filters ---
  const filteredPods = useMemo(() => {
    const term = podSearch.toLowerCase().trim();
    const pool = term
      ? pods.filter((p) => p.label.toLowerCase().includes(term))
      : pods;
    return pool.slice(0, 10);
  }, [pods, podSearch]);

  const filteredContainers = useMemo(() => {
    const term = containerSearch.toLowerCase().trim();
    const pool = term
      ? containerOptions.filter((c) => c.label.toLowerCase().includes(term))
      : containerOptions;
    return pool.slice(0, 10);
  }, [containerOptions, containerSearch]);

  const filteredTable = useMemo(() => {
    const term = containerSearch.toLowerCase().trim();
    return tableData
      .filter((r) => (term ? r.label.toLowerCase().includes(term) : true))
      .slice(0, 10);
  }, [tableData, containerSearch]);

  // --- Summary cards ---
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

  // --- Series maps (fallback 제거) ---
  const trendMap = useMemo(() => {
    const m = new Map<string, MetricSeries>();
    for (const s of trendSeries) {
      const key = getSeriesKey(s);
      if (key) m.set(key, s);
    }
    return m;
  }, [trendSeries]);

  // 선택 없으면 빈 배열 / 매칭 없으면 빈 배열
  const costChartSeriesData: CostPoint[] = useMemo(() => {
    if (!selectedContainerKey) return [];
    const match = trendMap.get(selectedContainerKey);
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
  }, [selectedContainerKey, trendMap]);

  const podRawSeriesData: UsagePoint[] = useMemo(() => {
    const s = podRaw?.series?.[0];
    return (
      s?.points?.map((pt) => ({
        time: (pt as any)?.timestamp ?? pt.time,
        cpu_cores: (pt.cpu_memory?.cpu_usage_nano_cores ?? 0) / 1_000_000_000,
        memory_gb: (pt.cpu_memory?.memory_usage_bytes ?? 0) / 1_073_741_824,
      })) ?? []
    );
  }, [podRaw]);

  const costChartSeries: ChartSeries<CostPoint>[] = useMemo(
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
      {
        key: "label",
        header: "Container",
        render: (r: ContainerRow) => r.label,
      },
      {
        key: "total_cost_usd",
        header: "Total Cost",
        align: "right" as const,
        render: (r: ContainerRow) =>
          formatCurrency(r.total_cost_usd ?? 0, "USD"),
      },
      {
        key: "cpu_cost_usd",
        header: "CPU",
        align: "right" as const,
        render: (r: ContainerRow) => formatCurrency(r.cpu_cost_usd ?? 0, "USD"),
      },
      {
        key: "memory_cost_usd",
        header: "Memory",
        align: "right" as const,
        render: (r: ContainerRow) =>
          formatCurrency(r.memory_cost_usd ?? 0, "USD"),
      },
      {
        key: "storage_cost_usd",
        header: "Storage",
        align: "right" as const,
        render: (r: ContainerRow) =>
          formatCurrency(r.storage_cost_usd ?? 0, "USD"),
      },
    ],
    []
  );

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Container Metrics"
        description="Container-level cost and usage"
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.metrics"), to: `${prefix}/workloads/metrics` },
          { label: t("nav.containers") },
        ]}
      />

      <SharedMetricsFilterBar
        params={params}
        onChange={(key, value) =>
          setParams((prev) => normalizeRange({ ...prev, [key]: value }))
        }
        onRefresh={loadMetrics}
      />

      <MetricsInventorySelector
        label="Search Containers"
        placeholder="Type a container target"
        items={filteredContainers}
        getKey={(c) => c.key}
        getLabel={(c) => c.label}
        search={containerSearch}
        onSearchChange={(v) => {
          setContainerSearch(v);
          if (!v) setSelectedContainerKey(containerOptions[0]?.key ?? null);
        }}
        onPickByLabel={(label) => {
          if (!label) return;
          const m = containerOptions.find((x) => x.label === label);
          if (m) {
            setSelectedContainerKey(m.key);
            setContainerSearch(m.label); // UX: pick하면 검색창도 동기화
          }
        }}
        onApply={() => {
          const candidate =
            filteredContainers[0] ?? containerOptions[0] ?? null;
          setSelectedContainerKey(candidate?.key ?? null);
          setContainerSearch(candidate?.label ?? "");
        }}
      />

      <div className="mt-4">
        <MetricsInventorySelector
          label="Search Pods (for Raw Usage)"
          placeholder="Type a pod name"
          items={filteredPods}
          getKey={(p) => p.uid}
          getLabel={(p) => p.label}
          search={podSearch}
          onSearchChange={(v) => {
            setPodSearch(v);
            if (!v) podInventory.setSelectedKey(pods[0]?.uid ?? null);
          }}
          onPickByLabel={(label) => {
            if (!label) return;
            podInventory.pickByLabel(label);
            setPodSearch(label); // UX: pick하면 검색창도 동기화
          }}
          onApply={() => {
            const candidate = filteredPods[0] ?? pods[0] ?? null;
            podInventory.setSelectedKey(candidate?.uid ?? null);
            setPodSearch(candidate?.label ?? "");
          }}
        />
      </div>

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
            selectedContainerKey
              ? `Cost trend for ${selectedContainerKey}`
              : "Select a container to see cost trend"
          }
          metrics={costChartSeriesData}
          series={costChartSeries}
          isLoading={loading}
          getXAxisLabel={(p) => (p.time as string) ?? ""}
        />

        <SharedMetricChart
          title="Usage (Raw)"
          subtitle={
            selectedPod
              ? `CPU & Memory for ${selectedPod.label}`
              : "Select a pod to see raw usage"
          }
          metrics={podRawSeriesData}
          series={usageSeries}
          isLoading={loading}
          getXAxisLabel={(p) => (p.time as string) ?? ""}
        />
      </div>

      <MetricTable
        title="Container Cost (last point)"
        columns={tableColumns}
        data={filteredTable}
        isLoading={loading}
        emptyMessage="No containers matched your search"
      />
    </SharedPageLayout>
  );
};
