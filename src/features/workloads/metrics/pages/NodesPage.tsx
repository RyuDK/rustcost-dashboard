import { useCallback, useEffect, useMemo, useState } from "react";
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
import { infoApi, metricApi, stateApi } from "@/shared/api";

import { useParams as useRouterParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { useI18n } from "@/app/providers/i18n/useI18n";

import { useDebouncedEffect } from "@/shared/hooks/useDebouncedEffect";
import { getDefaultRange, normalizeRange } from "@/shared/utils/metrics";

import type {
  InfoK8sNodePatchRequest,
  InfoK8sNodePricePatchRequest,
} from "@/shared/api/info/k8s/node/dto";

import { MetricsInventorySelector } from "@/features/metrics/components/MetricsInventorySelector";
import { useInventorySelection } from "@/shared/hooks/useInventorySelection";
import { useLatestRequestGuard } from "@/shared/hooks/useLatestRequestGuard";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

type NodeRow = {
  id: string;
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

/** --- Shared UI class tokens for this page (theme-aware via CSS vars) --- */
const surfaceCard =
  "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm dark:bg-(--surface-dark)/40 dark:border-[var(--border)]";
const inputBase =
  "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] shadow-sm dark:bg-(--surface-dark)/70 dark:text-[var(--text)]";
const inputFocus =
  "focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]";
const btnSecondary =
  "rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-[var(--border)] dark:text-[var(--text)]";
const btnPrimary =
  "rounded-md bg-[var(--button-bg1)] text-white dark:text-black transition hover:bg-[var(--button-bg1-hover)] active:bg-[var(--button-bg1-active)] disabled:opacity-50";

export const NodesPage = () => {
  const { t } = useI18n();
  const { lng } = useRouterParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const [params, setParams] = useState<MetricsQueryOptions>(getDefaultRange);

  const [search, setSearch] = useState("");
  const [readyOnly, setReadyOnly] = useState(false);
  const [nodeReadyMap, setNodeReadyMap] = useState<Record<string, boolean>>({});

  const [filterPayload, setFilterPayload] = useState<InfoK8sNodePatchRequest>({
    team: "",
    service: "",
    env: "",
  });

  const [pricePayload, setPricePayload] =
    useState<InfoK8sNodePricePatchRequest>({
      fixed_instance_usd: undefined,
      price_period: undefined,
    });

  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  const [costSummary, setCostSummary] = useState<
    Record<string, number | undefined>
  >({});
  const [tableData, setTableData] = useState<NodeRow[]>([]);
  const [trendSeries, setTrendSeries] = useState<MetricSeries[]>([]);
  const [rawSeries, setRawSeries] = useState<MetricSeries[]>([]);
  const [nodeRaw, setNodeRaw] = useState<MetricGetResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { begin: beginMetrics, isLatest: isLatestMetrics } =
    useLatestRequestGuard();
  const { begin: beginInfo, isLatest: isLatestInfo } = useLatestRequestGuard();

  const fetchNodes = useCallback(async () => {
    const res = await stateApi.k8s.fetchK8sRuntimeState();
    return res.data?.nodes ?? [];
  }, []);

  const inventory = useInventorySelection<string>({
    fetchItems: fetchNodes,
    getKey: (n) => n,
    getLabel: (n) => n,
    initialSelectedKey: null,
  });

  const nodes = inventory.items;
  const selectedNode = inventory.selectedKey;

  const loadNodes = useCallback(async () => {
    try {
      await inventory.refreshItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load node inventory"
      );
    }
  }, [inventory]);

  const loadNodeReadiness = useCallback(async () => {
    try {
      const res = await infoApi.fetchK8sLiveNodes({ limit: 500, offset: 0 });
      const map =
        res.data?.items?.reduce<Record<string, boolean>>((acc, node) => {
          const name = node.metadata?.name;
          if (!name) return acc;
          const readyStatus = node.status?.conditions?.find(
            (c) => c.type === "Ready"
          )?.status;
          acc[name] = readyStatus?.toLowerCase() === "true";
          return acc;
        }, {}) ?? {};
      setNodeReadyMap(map);
    } catch {
      // ignore readiness errors
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    const token = beginMetrics();
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, listRes, rawRes, nodesRawRes] = await Promise.all([
        metricApi.fetchNodesCostSummary(params),
        metricApi.fetchNodesCost({ ...params, limit: 10, offset: 0 }),
        selectedNode
          ? metricApi.fetchNodeRaw({ nodeName: selectedNode }, params)
          : Promise.resolve<MetricGetResponse | null>(null),
        metricApi.fetchNodesRaw({ ...params, limit: 10, offset: 0 }),
      ]);

      if (!isLatestMetrics(token)) return;

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
          const target =
            (s as { target?: string }).target ?? s.name ?? "unknown";
          return {
            id: target,
            total_cost_usd: last?.cost?.total_cost_usd,
            cpu_cost_usd: last?.cost?.cpu_cost_usd,
            memory_cost_usd: last?.cost?.memory_cost_usd,
            storage_cost_usd: last?.cost?.storage_cost_usd,
          };
        })
      );

      if (rawRes && typeof rawRes === "object" && "data" in rawRes) {
        setNodeRaw(rawRes.data ?? null);
      } else {
        setNodeRaw(null);
      }

      setRawSeries(nodesRawRes.data?.series ?? []);
    } catch (err) {
      if (!isLatestMetrics(token)) return;
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      if (isLatestMetrics(token)) setLoading(false);
    }
  }, [params, selectedNode, beginMetrics, isLatestMetrics]);

  useEffect(() => void loadNodes(), [loadNodes]);
  useEffect(() => void loadNodeReadiness(), [loadNodeReadiness]);
  useDebouncedEffect(() => void loadMetrics(), [loadMetrics], 300);

  useEffect(() => {
    setFilterPayload({ team: "", service: "", env: "" });
    setPricePayload({ fixed_instance_usd: undefined, price_period: undefined });
    setSaveError(null);
    setSaveMessage(null);
  }, [selectedNode]);

  useEffect(() => {
    const loadInfo = async () => {
      if (!selectedNode) return;

      const token = beginInfo();
      setIsLoadingInfo(true);

      try {
        const res = await infoApi.getInfoK8sNode(selectedNode);
        if (!isLatestInfo(token)) return;

        const data = res.data;
        if (data) {
          setFilterPayload({
            team: data.team ?? "",
            service: data.service ?? "",
            env: data.env ?? "",
          });
          setPricePayload({
            fixed_instance_usd: data.fixed_instance_usd,
            price_period: data.price_period,
          });
        }
      } catch {
        // ignore prefill errors
      } finally {
        if (isLatestInfo(token)) setIsLoadingInfo(false);
      }
    };

    void loadInfo();
  }, [selectedNode, beginInfo, isLatestInfo]);

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

  const filteredNodes = useMemo(() => {
    const term = search.toLowerCase().trim();
    const readyFiltered = readyOnly
      ? nodes.filter((n) => nodeReadyMap[n] !== false)
      : nodes;

    const pool = term
      ? readyFiltered.filter((n) => n.toLowerCase().includes(term))
      : readyFiltered;

    return pool.slice(0, 10);
  }, [nodes, search, readyOnly, nodeReadyMap]);

  const filteredTable = useMemo(() => {
    const term = search.toLowerCase().trim();
    return tableData
      .filter((row) => {
        const okSearch = term ? row.id.toLowerCase().includes(term) : true;
        const okReady = !readyOnly || nodeReadyMap[row.id] !== false;
        return okSearch && okReady;
      })
      .slice(0, 10);
  }, [tableData, search, readyOnly, nodeReadyMap]);

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

  const costChartSeriesData: CostPoint[] = useMemo(() => {
    if (!selectedNode) return [];
    const match = trendSeriesMap.get(selectedNode);
    if (!match) return [];

    return (
      match.points?.map((pt) => ({
        time: (pt as { timestamp?: string }).timestamp ?? pt.time,
        total_cost_usd: pt.cost?.total_cost_usd ?? 0,
        cpu_cost_usd: pt.cost?.cpu_cost_usd ?? 0,
        memory_cost_usd: pt.cost?.memory_cost_usd ?? 0,
        storage_cost_usd: pt.cost?.storage_cost_usd ?? 0,
      })) ?? []
    );
  }, [selectedNode, trendSeriesMap]);

  const nodeRawSeriesData: UsagePoint[] = useMemo(() => {
    const series = nodeRaw?.series?.[0];
    return (
      series?.points?.map((pt) => ({
        time: (pt as { timestamp?: string }).timestamp ?? pt.time,
        cpu_cores: (pt.cpu_memory?.cpu_usage_nano_cores ?? 0) / 1_000_000_000,
        memory_gb: (pt.cpu_memory?.memory_usage_bytes ?? 0) / 1_073_741_824,
      })) ?? []
    );
  }, [nodeRaw]);

  // NOTE: Chart series colors are semantic per-metric; keep as-is unless you want theme-driven palettes.
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

  const pricePeriodOptions: InfoK8sNodePricePatchRequest["price_period"][] = [
    "Unit",
    "Hour",
    "Day",
    "Month",
  ];

  const handleSaveFilter = async () => {
    if (!selectedNode) return;
    setIsSavingFilter(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      await infoApi.patchInfoK8sNode(selectedNode, {
        team: filterPayload.team || undefined,
        service: filterPayload.service || undefined,
        env: filterPayload.env || undefined,
      });
      setSaveMessage("Node filters updated.");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update node filters"
      );
    } finally {
      setIsSavingFilter(false);
    }
  };

  const handleSavePrice = async () => {
    if (!selectedNode) return;
    setIsSavingPrice(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      await infoApi.patchInfoK8sNodePrice(selectedNode, {
        fixed_instance_usd: pricePayload.fixed_instance_usd,
        price_period: pricePayload.price_period,
      });
      setSaveMessage("Node pricing updated.");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update node pricing"
      );
    } finally {
      setIsSavingPrice(false);
    }
  };

  const tableColumns = useMemo(
    () => [
      { key: "id", header: "Node", render: (row: NodeRow) => row.id },
      {
        key: "total_cost_usd",
        header: "Total Cost",
        align: "right" as const,
        render: (row: NodeRow) =>
          formatCurrency(row.total_cost_usd ?? 0, "USD"),
      },
      {
        key: "cpu_cost_usd",
        header: "CPU",
        align: "right" as const,
        render: (row: NodeRow) => formatCurrency(row.cpu_cost_usd ?? 0, "USD"),
      },
      {
        key: "memory_cost_usd",
        header: "Memory",
        align: "right" as const,
        render: (row: NodeRow) =>
          formatCurrency(row.memory_cost_usd ?? 0, "USD"),
      },
      {
        key: "storage_cost_usd",
        header: "Storage",
        align: "right" as const,
        render: (row: NodeRow) =>
          formatCurrency(row.storage_cost_usd ?? 0, "USD"),
      },
    ],
    []
  );

  const sparklineNodes = useMemo(
    () => filteredNodes.slice(0, 10),
    [filteredNodes]
  );

  const sparklineCards = useMemo(() => {
    return sparklineNodes.map((nodeName) => {
      const s = rawSeriesMap.get(nodeName);
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

      return { nodeName, metrics, cpuMemSeries, storageNetSeries };
    });
  }, [sparklineNodes, rawSeriesMap]);

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Node Metrics"
        description="Node-level cost and usage"
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.metrics"), to: `${prefix}/workloads/metrics` },
          { label: t("nav.nodes") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Date, team, and environment filters drive every chart and table. Refresh
        after adjusting the window to align summary, trend, and sparkline data.
      </ExplainHint>

      <SharedMetricsFilterBar
        params={params}
        onChange={(key, value) =>
          setParams((prev) => normalizeRange({ ...prev, [key]: value }))
        }
        onRefresh={loadMetrics}
      />

      <MetricsInventorySelector
        label="Search Nodes"
        items={filteredNodes}
        getKey={(n) => n}
        getLabel={(n) => n}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          if (!v) inventory.setSelectedKey(nodes[0] ?? null);
        }}
        onPickByLabel={(label) => {
          if (!label) return;
          inventory.pickByLabel(label);
        }}
        onApply={() => {
          const candidate = filteredNodes[0] ?? nodes[0] ?? null;
          inventory.setSelectedKey(candidate);
          setSearch(candidate ?? "");
        }}
        rightSlot={
          <button
            type="button"
            onClick={() => setReadyOnly((p) => !p)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              readyOnly
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                : "border-(--border) text-(--text) hover:border-(--primary) hover:text-(--primary) dark:border-(--border) dark:text-(--text)"
            }`}
            aria-pressed={readyOnly}
          >
            {readyOnly ? "Ready only" : "All nodes"}
          </button>
        }
      />

      <ExplainHint visible={showExplain}>
        Pick a node to focus the charts and edit metadata. Use the readiness
        toggle to filter inventory, and reset to clear scoped filters quickly.
      </ExplainHint>

      {/* Filters card */}
      <div className={`mt-4 flex flex-wrap gap-4 p-4 md:p-6 ${surfaceCard}`}>
        <div className="flex flex-1 flex-wrap gap-3">
          <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-(--text-subtle)">
            Team
            <input
              value={(params as any).team ?? ""}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  team: e.target.value || undefined,
                }))
              }
              className={`${inputBase} ${inputFocus}`}
              placeholder="team name"
            />
          </label>

          <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-(--text-subtle)">
            Service
            <input
              value={(params as any).service ?? ""}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  service: e.target.value || undefined,
                }))
              }
              className={`${inputBase} ${inputFocus}`}
              placeholder="service"
            />
          </label>

          <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-(--text-subtle)">
            Environment
            <input
              value={(params as any).env ?? ""}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  env: e.target.value || undefined,
                }))
              }
              className={`${inputBase} ${inputFocus}`}
              placeholder="dev / stage / prod"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setParams(
                (prev) =>
                  ({
                    ...prev,
                    team: undefined,
                    service: undefined,
                    env: undefined,
                  } as any)
              );
              setSearch("");
              setReadyOnly(false);
              inventory.setSelectedKey(nodes[0] ?? null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <SharedMetricsSummaryCards cards={summaryCards} isLoading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SharedMetricChart
          title="Cost Trend"
          subtitle={
            selectedNode ? `Cost trend for ${selectedNode}` : "Cost trend"
          }
          metrics={costChartSeriesData}
          series={costChartSeries}
          isLoading={loading}
          getXAxisLabel={(point) => (point.time as string) ?? ""}
        />

        <SharedMetricChart
          title="Usage (Raw)"
          subtitle={
            selectedNode
              ? `CPU & Memory for ${selectedNode}`
              : "CPU & Memory (select a node)"
          }
          metrics={nodeRawSeriesData}
          series={usageSeries}
          isLoading={loading}
          getXAxisLabel={(point) => (point.time as string) ?? ""}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Team/Service filters editor */}
        <div className={`space-y-4 rounded-xl p-4 ${surfaceCard}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-(--text)">
                Team / Service filters
              </p>
              <p className="text-xs text-(--text-subtle)">
                Update node metadata for allocation or filtering.{" "}
                {selectedNode
                  ? `Target: ${selectedNode}`
                  : "Select a node first."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveFilter}
              disabled={isSavingFilter || !selectedNode || isLoadingInfo}
              className={`${btnPrimary} px-3 py-1 text-xs font-semibold`}
            >
              {isSavingFilter ? "Saving..." : "Save filters"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs text-(--text-subtle)">
              Team
              <input
                value={filterPayload.team ?? ""}
                onChange={(e) =>
                  setFilterPayload((prev) => ({
                    ...prev,
                    team: e.target.value,
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className={`mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-sm text-(--text) dark:bg-(--surface-dark) ${inputFocus}`}
                placeholder="team"
              />
            </label>

            <label className="text-xs text-(--text-subtle)">
              Service
              <input
                value={filterPayload.service ?? ""}
                onChange={(e) =>
                  setFilterPayload((prev) => ({
                    ...prev,
                    service: e.target.value,
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className={`mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-sm text-(--text) dark:bg-(--surface-dark) ${inputFocus}`}
                placeholder="service"
              />
            </label>

            <label className="text-xs text-(--text-subtle)">
              Environment
              <input
                value={filterPayload.env ?? ""}
                onChange={(e) =>
                  setFilterPayload((prev) => ({ ...prev, env: e.target.value }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className={`mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-sm text-(--text) dark:bg-(--surface-dark) ${inputFocus}`}
                placeholder="dev / stage / prod"
              />
            </label>
          </div>
        </div>

        {/* Pricing editor */}
        <div className={`space-y-4 rounded-xl p-4 ${surfaceCard}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-(--text)">
                Node pricing
              </p>
              <p className="text-xs text-(--text-subtle)">
                Set fixed instance pricing for cost calculations.{" "}
                {selectedNode
                  ? `Target: ${selectedNode}`
                  : "Select a node first."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSavePrice}
              disabled={isSavingPrice || !selectedNode || isLoadingInfo}
              className={`${btnPrimary} px-3 py-1 text-xs font-semibold`}
            >
              {isSavingPrice ? "Saving..." : "Save price"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-(--text-subtle)">
              Fixed price (USD)
              <input
                type="number"
                inputMode="decimal"
                value={pricePayload.fixed_instance_usd ?? ""}
                onChange={(e) =>
                  setPricePayload((prev) => ({
                    ...prev,
                    fixed_instance_usd:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className={`mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-sm text-(--text) dark:bg-(--surface-dark) ${inputFocus}`}
                placeholder="e.g., 1.23"
                step="0.01"
              />
            </label>

            <label className="text-xs text-(--text-subtle)">
              Billing period
              <select
                value={pricePayload.price_period ?? ""}
                onChange={(e) =>
                  setPricePayload((prev) => ({
                    ...prev,
                    price_period: e.target.value
                      ? (e.target
                          .value as InfoK8sNodePricePatchRequest["price_period"])
                      : undefined,
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className={`mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-sm text-(--text) dark:bg-(--surface-dark) ${inputFocus}`}
              >
                <option value="">Select period</option>
                {pricePeriodOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {(saveMessage || saveError) && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            saveError
              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
              : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
          }`}
        >
          {saveError ?? saveMessage}
        </div>
      )}

      <MetricTable
        title="Node Cost (last point)"
        columns={tableColumns}
        data={filteredTable}
        isLoading={loading}
        emptyMessage="No nodes matched your search"
      />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-(--text)">Node Sparklines</h3>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sparklineCards.map((card) => (
            <div
              key={card.nodeName}
              className="rounded-xl border border-(--border-subtle) bg-(--surface)/70 p-4 shadow-sm dark:border-(--border) dark:bg-(--surface-dark)/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-(--text)">
                  {card.nodeName}
                </h4>
                <span className="text-[11px] uppercase tracking-wide text-(--text-subtle)">
                  up to 10 nodes
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
