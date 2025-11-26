import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  InfoSetting,
  InfoUnitPrice,
  MutationResponse,
} from "@/shared/api/info";
import type { ApiResponse } from "@/types/api";
import type {
  SystemStatusResponse,
  SystemResponse,
  LogLineResponse,
} from "@/types/system";
import { infoApi, systemApi } from "@/shared/api";

type SystemTab =
  | "status"
  | "health"
  | "settings"
  | "unitPrices"
  | "backup"
  | "resync";

export function SystemPage() {
  const [activeTab] = useState<SystemTab>("status");
  const [status, setStatus] =
    useState<ApiResponse<SystemStatusResponse> | null>(null);
  const [health, setHealth] = useState<ApiResponse<SystemResponse> | null>(
    null
  );
  const [settings, setSettings] = useState<ApiResponse<InfoSetting> | null>(
    null
  );
  const [unitPrices, setUnitPrices] =
    useState<ApiResponse<InfoUnitPrice> | null>(null);
  const [backupResult, setBackupResult] =
    useState<ApiResponse<MutationResponse> | null>(null);
  const [resyncResult, setResyncResult] =
    useState<ApiResponse<MutationResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logFileNames, setLogFileNames] = useState<string[] | null>(null);
  const [logLineResponse, setLogLineResponse] =
    useState<LogLineResponse | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadLogLines = useCallback(
    async (date: string, cursor: number = 0, limit: number = 200) => {
      if (isLoadingLogs) return;
      setIsLoadingLogs(true);

      try {
        const res = await systemApi.getSystemLogLines(date, cursor, limit);
        const data = res.data;

        if (!data) {
          setLogLineResponse(null);
          return;
        }

        setLogLineResponse((prev): LogLineResponse | null => {
          if (prev && prev.date === date) {
            return {
              date,
              lines: [...prev.lines, ...data.lines],
              next_cursor: data.next_cursor ?? null,
            };
          }
          return {
            date: data.date,
            lines: data.lines,
            next_cursor: data.next_cursor ?? null,
          };
        });
      } catch (err) {
        console.error(err);
        setLogLineResponse(null);
      } finally {
        setIsLoadingLogs(false);
      }
    },
    [isLoadingLogs]
  );

  const onScrollLogs = useCallback(
    (el: HTMLPreElement | null) => {
      if (!el || isLoadingLogs) return;
      if (!logLineResponse?.next_cursor) return;

      const threshold = 150;
      const reachedBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

      if (reachedBottom) {
        loadLogLines(logLineResponse.date, logLineResponse.next_cursor);
      }
    },
    [logLineResponse, isLoadingLogs, loadLogLines]
  );

  const loadSystemData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [logFileListRes, statusRes, healthRes, settingsRes, pricesRes] =
        await Promise.all([
          systemApi.getSystemLogFileList(),
          systemApi.fetchSystemStatus(),
          systemApi.fetchSystemHealth(),
          infoApi.fetchInfoSettings(),
          infoApi.fetchInfoUnitPrices(),
        ]);
      console.log(logFileListRes.data?.fileNames);
      setLogFileNames(logFileListRes.data?.fileNames ?? null);
      setStatus(statusRes);
      setHealth(healthRes);
      setSettings(settingsRes);
      setUnitPrices(pricesRes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load system data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSystemData();
  }, [loadSystemData]);

  const triggerBackup = useCallback(async () => {
    const res = await systemApi.triggerSystemBackup();
    setBackupResult(res);
  }, []);

  const triggerResync = useCallback(async () => {
    const res = await systemApi.triggerSystemResync();
    setResyncResult(res);
  }, []);

  const systemActions = useMemo(
    () => ({
      triggerBackup,
      triggerResync,
    }),
    [triggerBackup, triggerResync]
  );

  useEffect(() => {
    // Placeholder effect tying actions to future UI handlers
  }, [systemActions]);

  const systemState = useMemo(
    () => ({
      activeTab,
      status,
      health,
      settings,
      unitPrices,
      backupResult,
      resyncResult,
      isLoading,
      error,
    }),
    [
      activeTab,
      backupResult,
      error,
      health,
      isLoading,
      resyncResult,
      settings,
      status,
      unitPrices,
    ]
  );

  useEffect(() => {
    // Placeholder effect for system state consumers
  }, [systemState]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">
          System
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Control Plane
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Monitor status, health, settings, unit prices, and administrative
          actions such as backup and resync.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Status
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {status?.data?.status ?? "unknown"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Health
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {health?.data ? "Available" : "Unknown"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Settings
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {settings?.data?.version ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Unit Price Updated
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {unitPrices?.data?.updated_at
              ? new Date(unitPrices.data.updated_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            System Status
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {status?.data?.components?.length ?? 0} component(s) reported.
          </p>
          <div className="mt-4 space-y-3">
            {status?.data?.components?.map((component) => (
              <div
                key={component.component}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {component.component}
                  </p>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {component.status}
                  </span>
                </div>
              </div>
            ))}
            {!status?.data?.components?.length && (
              <p className="text-sm text-slate-500">
                No detailed status available.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Unit Prices
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Raw rates used for cost allocation.
          </p>
          {unitPrices?.data ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  CPU
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ${unitPrices.data.cpu_core_hour}/core hr
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Memory
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ${unitPrices.data.memory_gb_hour}/GB hr
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Unit prices unavailable.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Backup
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trigger incremental backup to capture configuration.
          </p>
          <button
            type="button"
            onClick={() => systemActions.triggerBackup()}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300"
          >
            Start Backup
          </button>
          {backupResult && (
            <p className="mt-2 text-xs text-slate-500">
              Last response: {backupResult.data?.message}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Resync
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Force resynchronization with upstream components.
          </p>
          <button
            type="button"
            onClick={() => systemActions.triggerResync()}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-red-500 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
          >
            Start Resync
          </button>
          {resyncResult && (
            <p className="mt-2 text-xs text-slate-500">
              Last response: {resyncResult.data?.message}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* File List - 1 column */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Log Files
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a log file to view recent activity.
          </p>

          {isLoading ? (
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              Loading logs…
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {logFileNames?.map((fileName) => {
                const isActive = logLineResponse?.date === fileName;
                return (
                  <li key={fileName}>
                    <button
                      className={`
                  w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "text-blue-700 underline dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  }
                `}
                      onClick={() => loadLogLines(fileName, 0)}
                    >
                      {fileName}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Log Content — 2 Columns */}
        {logLineResponse && (
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Log: {logLineResponse.date}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Scroll to load more… Latest entries first.
            </p>

            <pre
              className="
    mt-3 h-96 overflow-x-auto overflow-y-auto whitespace-pre-wrap text-xs p-4 rounded-xl
    bg-slate-950 text-slate-200 font-mono leading-relaxed
    border border-slate-800 shadow-inner
  "
              style={{
                scrollbarWidth: "thin", // Firefox
                scrollbarColor: "#475569 #1e293b", // Firefox color
              }}
              ref={(el) => {
                if (el) el.onscroll = () => onScrollLogs(el);
              }}
            >
              <style>
                {`
      /* Chrome, Edge, Safari scrollbar styling */
      pre::-webkit-scrollbar {
        height: 7px;
        width: 7px;
      }
      pre::-webkit-scrollbar-track {
        background: #1e293b; /* dark slate */
      }
      pre::-webkit-scrollbar-thumb {
        background-color: #475569;
        border-radius: 9999px;
        border: 2px solid #1e293b;
      }
      pre::-webkit-scrollbar-thumb:hover {
        background-color: #64748b;
      }
    `}
              </style>

              {logLineResponse.lines.join("\n")}
              {isLoadingLogs && (
                <div className="mt-2 text-slate-400 animate-pulse">
                  Loading more…
                </div>
              )}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
