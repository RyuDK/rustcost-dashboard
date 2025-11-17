import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MetricCostSummaryResponse,
  MetricRawSummaryResponse,
} from "../../shared/api/metric";
import type { SystemResponse } from "../../shared/api/system";
import { metricApi, systemApi } from "../../shared/api";

interface BreakdownPoint {
  label: string;
  value: number;
}

interface Insight {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

type SystemHealthPayload = SystemResponse & {
  status?: string;
  components?: Array<{ component: string; status?: string }>;
};

export function DashboardPage() {
  const [costSummary, setCostSummary] =
    useState<MetricCostSummaryResponse | null>(null);
  const [usageSummary, setUsageSummary] =
    useState<MetricRawSummaryResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<SystemHealthPayload | null>(
    null
  );
  const [teamBreakdown, setTeamBreakdown] = useState<BreakdownPoint[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<BreakdownPoint[]>(
    []
  );
  const [environmentBreakdown, setEnvironmentBreakdown] = useState<
    BreakdownPoint[]
  >([]);
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepareBreakdown = useCallback(
    (summary?: MetricRawSummaryResponse | null) => {
      if (!summary) {
        return {
          team: [],
          service: [],
          environment: [],
        };
      }

      const totalCpu = summary.summary.avg_cpu_cores || 0;
      const totalMemory = summary.summary.avg_memory_gb || 0;

      const createPoints = (factor: number): BreakdownPoint[] => [
        { label: "Team A", value: totalCpu * factor },
        { label: "Team B", value: totalMemory * factor },
        {
          label: "Shared",
          value: Math.max(totalCpu - totalMemory * factor, 0),
        },
      ];

      return {
        team: createPoints(0.4),
        service: createPoints(0.3),
        environment: createPoints(0.2),
      };
    },
    []
  );

  const analyzeInsights = useCallback(
    (
      cost?: MetricCostSummaryResponse | null,
      usage?: MetricRawSummaryResponse | null
    ): Insight[] => {
      if (!cost || !usage) {
        return [];
      }

      const insights: Insight[] = [];
      const cpuCost = cost.summary.cpu_cost_usd;
      const memoryCost = cost.summary.memory_cost_usd;
      const totalCpu = usage.summary.avg_cpu_cores;

      if (cpuCost > memoryCost * 1.5) {
        insights.push({
          id: "cpu-cost-anomaly",
          message:
            "CPU cost significantly exceeds memory cost. Investigate noisy workloads.",
          severity: "warning",
        });
      }

      if (totalCpu > usage.summary.max_cpu_cores * 0.8) {
        insights.push({
          id: "cpu-capacity",
          message:
            "Average CPU usage is nearing max capacity. Consider scaling nodes.",
          severity: "critical",
        });
      }

      if (!insights.length) {
        insights.push({
          id: "stable",
          message:
            "No anomalies detected. Cluster usage is within normal parameters.",
          severity: "info",
        });
      }

      return insights;
    },
    []
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [costRes, usageRes, healthRes, nodeSummaryRes, podSummaryRes] =
        await Promise.all([
          metricApi.fetchClusterCostSummary(),
          metricApi.fetchClusterRawSummary(),
          systemApi.fetchSystemHealth(),
          metricApi.fetchNodesRawSummary(),
          metricApi.fetchPodsRawSummary(),
        ]);

      const costData = costRes.data ?? null;
      const usageData = usageRes.data ?? null;

      setCostSummary(costData);
      setUsageSummary(usageData);
      setHealthStatus(healthRes.data ?? null);

      const nodeBreakdown = prepareBreakdown(nodeSummaryRes.data ?? null);
      const podBreakdown = prepareBreakdown(podSummaryRes.data ?? null);

      setTeamBreakdown(nodeBreakdown.team);
      setServiceBreakdown(podBreakdown.service);
      setEnvironmentBreakdown(nodeBreakdown.environment);
      setAiInsights(analyzeInsights(costData, usageData));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [analyzeInsights, prepareBreakdown]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const readiness = useMemo(
    () => ({
      healthy: healthStatus?.status === "healthy",
      issues:
        healthStatus && Array.isArray(healthStatus.components)
          ? healthStatus.components.filter(
              (component) => component.status !== "healthy"
            ).length
          : 0,
    }),
    [healthStatus]
  );

  const dashboardState = useMemo(
    () => ({
      costSummary,
      usageSummary,
      readiness,
      teamBreakdown,
      serviceBreakdown,
      environmentBreakdown,
      aiInsights,
      isLoading,
      error,
    }),
    [
      aiInsights,
      costSummary,
      environmentBreakdown,
      error,
      isLoading,
      readiness,
      serviceBreakdown,
      teamBreakdown,
      usageSummary,
    ]
  );

  useEffect(() => {
    // Placeholder effect for future UI bindings
  }, [dashboardState]);

  const cards = [
    {
      title: "Cluster Cost",
      value: costSummary ? `$${costSummary.summary.total_cost_usd.toFixed(2)}` : "—",
      subtitle: "Total daily spend",
    },
    {
      title: "CPU Avg",
      value: usageSummary ? `${usageSummary.summary.avg_cpu_cores.toFixed(2)} cores` : "—",
      subtitle: "Across all resources",
    },
    {
      title: "Memory Avg",
      value: usageSummary ? `${usageSummary.summary.avg_memory_gb.toFixed(2)} GB` : "—",
      subtitle: "Working set",
    },
    {
      title: "Health",
      value: readiness.healthy ? "Healthy" : "Needs attention",
      subtitle: `${readiness.issues} issue(s) detected`,
    },
  ];

  const renderBreakdown = (title: string, data: BreakdownPoint[]) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {data.length === 0 && (
        <p className="mt-4 text-xs text-slate-400">No data available for this dimension.</p>
      )}
      {data.map((item) => (
        <div key={item.label} className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{item.label}</span>
            <span>{item.value.toFixed(2)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
              style={{
                width: `${Math.min(Math.max(item.value, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderComponentHealth = () => {
    if (!healthStatus?.components || healthStatus.components.length === 0) {
      return <p className="text-sm text-slate-500">No health data provided.</p>;
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {healthStatus.components.map((component) => (
          <div
            key={component.component}
            className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {component.component}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  component.status === "healthy"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200"
                }`}
              >
                {component.status?.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">
          Dashboard
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Control Plane Overview
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Live cost, usage, and health telemetry for your RustCost deployment. Review trends,
          breakdowns, and AI-generated insights to ensure budgets stay in check.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? "…" : card.value}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{card.subtitle}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cluster Health</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {readiness.healthy
                    ? "All systems look healthy."
                    : "Some components need attention."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadDashboard()}
                className="inline-flex items-center justify-center rounded-full border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:border-amber-600 hover:text-amber-700 dark:text-amber-300"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4">{renderComponentHealth()}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Insights</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Automated reasoning over your latest metrics.
            </p>
            <div className="mt-4 space-y-3">
              {isLoading && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generating insights…
                </p>
              )}
              {!isLoading && aiInsights.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No insights at this time. Check back later.
                </p>
              )}
              {aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {insight.message}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    Severity: {insight.severity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {renderBreakdown("Team Breakdown", teamBreakdown)}
          {renderBreakdown("Service Breakdown", serviceBreakdown)}
          {renderBreakdown("Environment Breakdown", environmentBreakdown)}
        </div>
      </section>
    </div>
  );
}
