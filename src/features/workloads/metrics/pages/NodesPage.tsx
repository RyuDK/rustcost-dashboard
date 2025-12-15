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
import { useParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { useI18n } from "@/app/providers/i18n/useI18n";
import type {
  InfoK8sNodePatchRequest,
  InfoK8sNodePricePatchRequest,
} from "@/shared/api/info/k8s/node/dto";

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

const getDefaultRange = (): MetricsQueryOptions => {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10) + "T00:00:00",
    end: now.toISOString().slice(0, 10) + "T00:00:00",
    granularity: "day",
  };
};

export const NodesPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const [params, setParams] = useState<MetricsQueryOptions>(getDefaultRange);
  const [nodes, setNodes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
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

  const loadNodes = useCallback(async () => {
    try {
      const res = await stateApi.k8s.fetchK8sRuntimeState();
      const nodeNames = res.data?.nodes ?? [];
      setNodes(nodeNames);
      if (!selectedNode && nodeNames.length > 0) {
        setSelectedNode(nodeNames[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load node inventory"
      );
    }
  }, [selectedNode]);

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
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, listRes, rawRes, nodesRawRes] = await Promise.all([
        metricApi.fetchNodesCostSummary(params),
        metricApi.fetchNodesCost({
          ...params,
          limit: 10,
          offset: 0,
        }),
        selectedNode
          ? metricApi.fetchNodeRaw({ nodeName: selectedNode }, params)
          : Promise.resolve(null),
        metricApi.fetchNodesRaw({
          ...params,
          limit: 10,
          offset: 0,
        }),
      ]);

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

      const rows =
        listRes.data?.series?.map((series) => {
          const points = series.points ?? [];
          const lastPoint = points[points.length - 1];
          const target =
            (series as { target?: string }).target ?? series.name ?? "unknown";
          return {
            id: target,
            total_cost_usd: lastPoint?.cost?.total_cost_usd,
            cpu_cost_usd: lastPoint?.cost?.cpu_cost_usd,
            memory_cost_usd: lastPoint?.cost?.memory_cost_usd,
            storage_cost_usd: lastPoint?.cost?.storage_cost_usd,
          };
        }) ?? [];
      setTableData(rows);

      setTrendSeries(listRes.data?.series ?? []);
      if (rawRes && typeof rawRes === "object" && "data" in rawRes) {
        setNodeRaw(rawRes.data ?? null);
      } else {
        setNodeRaw(null);
      }
      setRawSeries(nodesRawRes.data?.series ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [params, selectedNode]);

  useEffect(() => {
    void loadNodes();
  }, [loadNodes]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    void loadNodeReadiness();
  }, [loadNodeReadiness]);

  useEffect(() => {
    setFilterPayload({ team: "", service: "", env: "" });
    setPricePayload({ fixed_instance_usd: undefined, price_period: undefined });
    setSaveError(null);
    setSaveMessage(null);
  }, [selectedNode]);

  useEffect(() => {
    const loadInfo = async () => {
      if (!selectedNode) return;
      setIsLoadingInfo(true);
      try {
        const res = await infoApi.getInfoK8sNode(selectedNode);
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
        setIsLoadingInfo(false);
      }
    };
    void loadInfo();
  }, [selectedNode]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Cost",
        value: formatCurrency(costSummary.total ?? 0, "USD"),
      },
      {
        label: "CPU Cost",
        value: formatCurrency(costSummary.cpu ?? 0, "USD"),
      },
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
      ? nodes.filter((node) => nodeReadyMap[node] !== false)
      : nodes;
    const pool = term
      ? readyFiltered.filter((node) => node.toLowerCase().includes(term))
      : readyFiltered;
    return pool.slice(0, 10);
  }, [nodes, search, readyOnly, nodeReadyMap]);

  const filteredTable = useMemo(
    () =>
      tableData
        .filter((row) =>
          (search ? row.id.toLowerCase().includes(search.toLowerCase()) : true) &&
          (!readyOnly || nodeReadyMap[row.id] !== false)
        )
        .slice(0, 10),
    [tableData, search, readyOnly, nodeReadyMap]
  );

  const costChartSeriesData: CostPoint[] = useMemo(() => {
    const match =
      trendSeries.find(
        (s) =>
          (s as { target?: string }).target === selectedNode ||
          s.name === selectedNode
      ) ?? trendSeries[0];
    return (
      match?.points?.map((pt) => ({
        time: (pt as { timestamp?: string }).timestamp ?? pt.time,
        total_cost_usd: pt.cost?.total_cost_usd ?? 0,
        cpu_cost_usd: pt.cost?.cpu_cost_usd ?? 0,
        memory_cost_usd: pt.cost?.memory_cost_usd ?? 0,
        storage_cost_usd: pt.cost?.storage_cost_usd ?? 0,
      })) ?? []
    );
  }, [trendSeries, selectedNode]);

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

  const costChartSeries: ChartSeries<CostPoint>[] = [
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
  ];

  const usageSeries: ChartSeries<UsagePoint>[] = [
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

  const tableColumns = [
    { key: "id", header: "Node", render: (row: NodeRow) => row.id },
    {
      key: "total_cost_usd",
      header: "Total Cost",
      align: "right" as const,
      render: (row: NodeRow) => formatCurrency(row.total_cost_usd ?? 0, "USD"),
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
      render: (row: NodeRow) => formatCurrency(row.memory_cost_usd ?? 0, "USD"),
    },
    {
      key: "storage_cost_usd",
      header: "Storage",
      align: "right" as const,
      render: (row: NodeRow) =>
        formatCurrency(row.storage_cost_usd ?? 0, "USD"),
    },
  ];

  const sparklineNodes = useMemo(
    () => filteredNodes.slice(0, 10),
    [filteredNodes]
  );

  const sparklineCards = sparklineNodes.map((nodeName) => {
    const series =
      rawSeries.find(
        (s) =>
          (s as { key?: string }).key === nodeName ||
          (s as { name?: string }).name === nodeName
      ) ?? rawSeries[0];

    const metrics =
      series?.points?.map((pt) => ({
        time: (pt as { timestamp?: string }).timestamp ?? pt.time,
        cpu_cores: (pt.cpu_memory?.cpu_usage_nano_cores ?? 0) / 1_000_000_000,
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

    return {
      nodeName,
      metrics,
      cpuMemSeries,
      storageNetSeries,
    };
  });

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

      {/* Global filters */}
      <SharedMetricsFilterBar
        params={params}
        onChange={(key, value) =>
          setParams((prev) => ({ ...prev, [key]: value }))
        }
        onRefresh={loadMetrics}
      />

      {/* Search + selector */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[var(--surface-dark)]/40 md:p-6">
        <div className="flex flex-col gap-1 w-full md:w-80">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Search Nodes
          </label>
          <input
            type="search"
            list="node-suggestions"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value) {
                setSelectedNode(nodes[0] ?? null);
              }
            }}
            onBlur={(e) => {
              if (e.target.value && nodes.includes(e.target.value)) {
                setSelectedNode(e.target.value);
              }
            }}
            placeholder="Type a node name"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
            aria-label="Search nodes"
          />
          <datalist id="node-suggestions">
            {filteredNodes.map((node) => (
              <option key={node} value={node} />
            ))}
          </datalist>
          <p className="text-[11px] text-gray-500">
            Showing up to 10 matches from runtime inventory.
          </p>
        </div>

        <div className="flex flex-1 flex-wrap gap-3">
          <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Team
            <input
              value={params.team ?? ""}
              onChange={(e) => setParams((prev) => ({ ...prev, team: e.target.value || undefined }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
              placeholder="team name"
            />
          </label>
          <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Service
            <input
              value={params.service ?? ""}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, service: e.target.value || undefined }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
              placeholder="service"
            />
          </label>
          <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Environment
            <input
              value={params.env ?? ""}
              onChange={(e) => setParams((prev) => ({ ...prev, env: e.target.value || undefined }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-[var(--surface-dark)]/70 dark:text-gray-100"
              placeholder="dev / stage / prod"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReadyOnly((prev) => !prev)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              readyOnly
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                : "border-gray-300 text-gray-700 hover:border-amber-300 hover:text-amber-600 dark:border-gray-700 dark:text-gray-200"
            }`}
            aria-pressed={readyOnly}
          >
            {readyOnly ? "Ready only" : "All nodes"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-[var(--border)] dark:bg-[var(--surface-dark)]"
            onClick={() => {
              const candidate = filteredNodes[0] ?? nodes[0] ?? null;
              setSelectedNode(candidate);
              setSearch(candidate ?? "");
              void loadMetrics();
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-amber-300 hover:text-amber-600 dark:border-gray-700 dark:text-gray-200"
            onClick={() => {
              setParams((prev) => ({
                ...prev,
                team: undefined,
                service: undefined,
                env: undefined,
              }));
              setSearch("");
              setReadyOnly(false);
              setSelectedNode(nodes[0] ?? null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* Top-line summary */}
      <SharedMetricsSummaryCards cards={summaryCards} isLoading={loading} />

      {/* Primary charts */}
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
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[var(--surface-dark)]/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Team / Service filters
              </p>
              <p className="text-xs text-gray-500">
                Update node metadata for allocation or filtering.{" "}
                {selectedNode ? `Target: ${selectedNode}` : "Select a node first."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveFilter}
              disabled={isSavingFilter || !selectedNode || isLoadingInfo}
              className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {isSavingFilter ? "Saving..." : "Save filters"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs text-gray-600 dark:text-gray-400">
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
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-[var(--surface-dark)] dark:text-gray-100"
                placeholder="team"
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
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
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-[var(--surface-dark)] dark:text-gray-100"
                placeholder="service"
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Environment
              <input
                value={filterPayload.env ?? ""}
                onChange={(e) =>
                  setFilterPayload((prev) => ({
                    ...prev,
                    env: e.target.value,
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-[var(--surface-dark)] dark:text-gray-100"
                placeholder="dev / stage / prod"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[var(--surface-dark)]/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Node pricing
              </p>
              <p className="text-xs text-gray-500">
                Set fixed instance pricing for cost calculations.{" "}
                {selectedNode ? `Target: ${selectedNode}` : "Select a node first."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSavePrice}
              disabled={isSavingPrice || !selectedNode || isLoadingInfo}
              className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {isSavingPrice ? "Saving..." : "Save price"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Fixed price (USD)
              <input
                type="number"
                inputMode="decimal"
                value={pricePayload.fixed_instance_usd ?? ""}
                onChange={(e) =>
                  setPricePayload((prev) => ({
                    ...prev,
                    fixed_instance_usd:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-[var(--surface-dark)] dark:text-gray-100"
                placeholder="e.g., 1.23"
                step="0.01"
              />
            </label>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Billing period
              <select
                value={pricePayload.price_period ?? ""}
                onChange={(e) =>
                  setPricePayload((prev) => ({
                    ...prev,
                    price_period: e.target.value
                      ? (e.target.value as InfoK8sNodePricePatchRequest["price_period"])
                      : undefined,
                  }))
                }
                disabled={isLoadingInfo || !selectedNode}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-[var(--surface-dark)] dark:text-gray-100"
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

      {/* Cost table */}
      <MetricTable
        title="Node Cost (last point)"
        columns={tableColumns}
        data={filteredTable}
        isLoading={loading}
        emptyMessage="No nodes matched your search"
      />

      {/* Sparklines per node */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Node Sparklines
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sparklineCards.map((card) => (
            <div
              key={card.nodeName}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface-dark)]/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {card.nodeName}
                </h4>
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
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
