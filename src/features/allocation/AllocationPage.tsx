import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";

import { useI18n } from "@/app/providers/i18n/useI18n";
import { infoApi, metricApi } from "@/shared/api";
import { SharedMetricChart, type ChartSeries } from "@/shared/components/chart/SharedMetricChart";
import { SharedMetricsFilterBar } from "@/shared/components/filter/SharedMetricsFilterBar";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import type {
  InfoK8sNodeListQuery,
  InfoK8sNodePatchRequest,
  InfoNode,
} from "@/shared/api/info/k8s/node/dto";
import type { MetricsQueryOptions, MetricSeries } from "@/types/metrics";
import { getDefaultRange, normalizeRange } from "@/shared/utils/metrics";
import { formatCurrency } from "@/shared/utils/format";

type FilterFields = {
  team: string;
  service: string;
  env: string;
  search: string;
};

type CostPoint = {
  time?: string;
} & Record<string, number | string | undefined>;

const PALETTE = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#22c55e",
];

const getSeriesKey = (s: MetricSeries): string =>
  ((s as any)?.key ?? (s as any)?.target ?? s.name ?? "") as string;

export const AllocationPage = () => {
  const { t } = useI18n();

  const [filters, setFilters] = useState<FilterFields>({
    team: "",
    service: "",
    env: "",
    search: "",
  });
  const [range, setRange] = useState<MetricsQueryOptions>(() =>
    getDefaultRange()
  );

  const [nodes, setNodes] = useState<InfoNode[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [nodesError, setNodesError] = useState<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [metadataDraft, setMetadataDraft] = useState<InfoK8sNodePatchRequest>({
    team: "",
    service: "",
    env: "",
  });
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [costSeries, setCostSeries] = useState<MetricSeries[]>([]);
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);

  const loadNodes = useCallback(async () => {
    setIsLoadingNodes(true);
    setNodesError(null);
    const payload: InfoK8sNodeListQuery = {
      team: filters.team || undefined,
      service: filters.service || undefined,
      env: filters.env || undefined,
    };
    try {
      const res = await infoApi.fetchInfoK8sNodes(payload);
      const list = res.data ?? [];
      setNodes(list);
      const firstNode = list.find((n) => n.node_name)?.node_name ?? null;
      setSelectedNode((prev) =>
        prev && list.some((n) => n.node_name === prev) ? prev : firstNode
      );
    } catch (err) {
      setNodesError(
        err instanceof Error
          ? err.message
          : t("allocation.errors.nodesLoad")
      );
    } finally {
      setIsLoadingNodes(false);
    }
  }, [filters, t]);

  const loadCosts = useCallback(async () => {
    const nodeNames = nodes
      .map((n) => n.node_name)
      .filter((name): name is string => Boolean(name));

    if (!nodeNames.length) {
      setCostSeries([]);
      return;
    }

    setIsLoadingCost(true);
    setCostError(null);
    try {
      const res = await metricApi.fetchNodesCost({
        ...range,
        nodeNames,
      });
      setCostSeries(res.data?.series ?? []);
    } catch (err) {
      setCostError(
        err instanceof Error ? err.message : t("allocation.errors.costsLoad")
      );
    } finally {
      setIsLoadingCost(false);
    }
  }, [nodes, range, t]);

  useEffect(() => {
    void loadNodes();
  }, [loadNodes]);

  useEffect(() => {
    void loadCosts();
  }, [loadCosts]);

  useEffect(() => {
    if (!selectedNode) {
      setMetadataDraft({ team: "", service: "", env: "" });
      return;
    }
    const found = nodes.find((n) => n.node_name === selectedNode);
    setMetadataDraft({
      team: found?.team ?? "",
      service: found?.service ?? "",
      env: found?.env ?? "",
    });
  }, [nodes, selectedNode]);

  const handleSaveMetadata = async () => {
    if (!selectedNode) return;
    setIsSavingMeta(true);
    setSaveMessage(null);
    try {
      await infoApi.patchInfoK8sNode(selectedNode, {
        team: metadataDraft.team || undefined,
        service: metadataDraft.service || undefined,
        env: metadataDraft.env || undefined,
      });
      setSaveMessage(t("allocation.messages.metadataSaved"));
      await loadNodes();
    } catch (err) {
      setNodesError(
        err instanceof Error
          ? err.message
          : t("allocation.errors.metadataUpdate")
      );
    } finally {
      setIsSavingMeta(false);
    }
  };

  const filteredNodes = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return term
      ? nodes.filter((n) =>
          (n.node_name ?? "").toLowerCase().includes(term)
        )
      : nodes;
  }, [filters.search, nodes]);

  const teamSummary = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((node) => {
      const team = node.team?.trim() || t("allocation.team.unassigned");
      map.set(team, (map.get(team) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([team, count]) => ({ team, count }));
  }, [nodes, t]);

  const selectedNodeInfo = useMemo(
    () => nodes.find((n) => n.node_name === selectedNode),
    [nodes, selectedNode]
  );

  const { costChartMetrics, costChartSeries } = useMemo(() => {
    if (!costSeries.length) {
      return {
        costChartMetrics: [] as CostPoint[],
        costChartSeries: [] as ChartSeries<CostPoint>[],
      };
    }

    const timeMap = new Map<string, CostPoint>();
    const seriesDefs: ChartSeries<CostPoint>[] = [];

    costSeries.forEach((series, idx) => {
      const key = getSeriesKey(series) || `node-${idx + 1}`;
      seriesDefs.push({
        key: key as keyof CostPoint,
        label: key,
        color: PALETTE[idx % PALETTE.length],
        valueFormatter: (v) => formatCurrency(v, "USD"),
      });

      series.points?.forEach((pt) => {
        const ts = (pt as any).timestamp ?? pt.time;
        if (!ts) return;
        const cost = (pt as any)?.cost?.total_cost_usd ?? 0;
        const existing = timeMap.get(ts) ?? { time: ts };
        (existing as Record<string, number | string>)[key] = cost;
        timeMap.set(ts, existing);
      });
    });

    const metrics = Array.from(timeMap.values()).sort((a, b) => {
      const at = (a.time as string) ?? "";
      const bt = (b.time as string) ?? "";
      return at.localeCompare(bt);
    });

    return { costChartMetrics: metrics, costChartSeries: seriesDefs };
  }, [costSeries]);

  const teamPieOptions = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      series: [
        {
          name: t("allocation.teamCoverage.label"),
          type: "pie",
          radius: ["52%", "78%"],
          avoidLabelOverlap: false,
          label: { formatter: "{b}: {c}" },
          data: teamSummary.map((bucket, idx) => ({
            value: bucket.count,
            name: bucket.team,
            itemStyle: { color: PALETTE[idx % PALETTE.length] },
          })),
        },
      ],
    }),
    [teamSummary, t]
  );

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title={t("allocation.title")}
        description={t("allocation.subtitle")}
        breadcrumbItems={[{ label: t("nav.allocation") }]}
      />

      <ExplainHint>
        {t("allocation.hints.backend")}
      </ExplainHint>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("allocation.filters.team")}
          <input
            value={filters.team}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, team: e.target.value }))
            }
            placeholder={t("allocation.filters.placeholders.team")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("allocation.filters.service")}
          <input
            value={filters.service}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, service: e.target.value }))
            }
            placeholder={t("allocation.filters.placeholders.service")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("allocation.filters.environment")}
          <input
            value={filters.env}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, env: e.target.value }))
            }
            placeholder={t("allocation.filters.placeholders.environment")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => void loadNodes()}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {t("allocation.filters.apply")}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters({ team: "", service: "", env: "", search: "" });
              setRange(getDefaultRange());
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-200"
          >
            {t("common.actions.reset")}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("allocation.filters.searchLabel")}
          <input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder={t("allocation.filters.placeholders.search")}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
      </div>

      {nodesError && (
        <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">
          {nodesError}
        </div>
      )}

      <SharedMetricsFilterBar
        params={range}
        onChange={(key, value) =>
          setRange((prev) => normalizeRange({ ...prev, [key]: value }))
        }
        onRefresh={() => void loadCosts()}
      />

      {costError && (
        <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">
          {costError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("allocation.teamCoverage.title")}
              </p>
              <p className="text-xs text-slate-500">
                {t("allocation.teamCoverage.summary", { count: nodes.length })}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {t("allocation.teamCoverage.chartType")}
            </span>
          </div>
          {teamSummary.length ? (
            <ReactECharts
              option={teamPieOptions}
              style={{ width: "100%", height: 320 }}
              opts={{ renderer: "svg" }}
            />
          ) : (
            <p className="text-sm text-slate-500">
              {t("allocation.teamCoverage.empty")}
            </p>
          )}
        </div>

        <SharedMetricChart
          title={t("allocation.chart.title")}
          subtitle={t("allocation.chart.subtitle")}
          metrics={costChartMetrics}
          series={costChartSeries}
          isLoading={isLoadingCost}
          getXAxisLabel={(point) => (point.time as string) ?? ""}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("allocation.nodes.title")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoadingNodes
                  ? t("allocation.nodes.loading")
                  : t("allocation.nodes.count", {
                      count: filteredNodes.length,
                    })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadNodes()}
              className="rounded-lg border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-500 hover:text-amber-800 dark:border-amber-700 dark:text-amber-200"
            >
              {t("common.refresh")}
            </button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {filteredNodes.map((node) => {
              const isSelected = node.node_name === selectedNode;
              return (
                <button
                  key={node.node_uid ?? node.node_name ?? Math.random()}
                  type="button"
                  onClick={() => setSelectedNode(node.node_name ?? null)}
                  className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30"
                      : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900/40"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {node.node_name ?? t("allocation.nodes.unknown")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("allocation.nodes.meta", {
                      team: node.team ?? t("common.notAvailable"),
                      service: node.service ?? t("common.notAvailable"),
                      env: node.env ?? t("common.notAvailable"),
                    })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("allocation.nodes.capacity", {
                      cpu: node.cpu_capacity_cores ?? 0,
                      memory: Math.round(
                        (node.memory_capacity_bytes ?? 0) / 1_073_741_824
                      ),
                    })}
                  </p>
                </button>
              );
            })}
            {!isLoadingNodes && filteredNodes.length === 0 && (
              <p className="text-sm text-slate-500">
                {t("allocation.nodes.emptyFiltered")}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("allocation.metadata.title")}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedNode
              ? t("allocation.metadata.patchFor", { node: selectedNode })
              : t("allocation.metadata.empty")}
          </p>

          <div className="mt-3 space-y-3">
            <label className="text-xs text-slate-600 dark:text-slate-400">
              {t("allocation.metadata.team")}
              <input
                value={metadataDraft.team ?? ""}
                onChange={(e) =>
                  setMetadataDraft((prev) => ({ ...prev, team: e.target.value }))
                }
                disabled={!selectedNode}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-400">
              {t("allocation.metadata.service")}
              <input
                value={metadataDraft.service ?? ""}
                onChange={(e) =>
                  setMetadataDraft((prev) => ({
                    ...prev,
                    service: e.target.value,
                  }))
                }
                disabled={!selectedNode}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-400">
              {t("allocation.metadata.environment")}
              <input
                value={metadataDraft.env ?? ""}
                onChange={(e) =>
                  setMetadataDraft((prev) => ({ ...prev, env: e.target.value }))
                }
                disabled={!selectedNode}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSaveMetadata()}
              disabled={!selectedNode || isSavingMeta}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {isSavingMeta
                ? t("common.actions.saving")
                : t("allocation.metadata.save")}
            </button>
            {selectedNodeInfo?.fixed_instance_usd != null && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("allocation.metadata.fixedPrice", {
                  price: formatCurrency(
                    selectedNodeInfo.fixed_instance_usd,
                    "USD"
                  ),
                  period: selectedNodeInfo.price_period
                    ? t("allocation.metadata.periodPrefix", {
                        period: selectedNodeInfo.price_period,
                      })
                    : "",
                })}
              </p>
            )}
            {saveMessage && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </SharedPageLayout>
  );
};
