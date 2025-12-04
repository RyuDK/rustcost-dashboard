/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import type { InfoSetting, InfoUnitPrice } from "@/shared/api/info";
import type { ApiResponse } from "@/types/api";
import type {
  SystemStatusResponse,
  SystemResponse,
  LogLineResponse,
} from "@/types/system";
import { infoApi, systemApi } from "@/shared/api";

export function SystemPage() {
  const { t } = useI18n();
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
  const [backupResult, setBackupResult] = useState<string | null>(null);
  const [resyncResult, setResyncResult] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logFileNames, setLogFileNames] = useState<string[] | null>(null);
  const [logLineResponse, setLogLineResponse] =
    useState<LogLineResponse | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const logContainerRef = useRef<HTMLPreElement | null>(null);

  /** -------------------------------------------
   * LOAD LINES WITH CURSOR
   * ------------------------------------------ */
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
            date,
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

  /** -------------------------------------------
   * INFINITE SCROLL HANDLER
   * ------------------------------------------ */
  const handleScroll = useCallback(() => {
    const el = logContainerRef.current;
    if (!el || isLoadingLogs || !logLineResponse?.next_cursor) return;

    const reachedBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 150;

    if (reachedBottom) {
      loadLogLines(logLineResponse.date, logLineResponse.next_cursor);
    }
  }, [logLineResponse, isLoadingLogs, loadLogLines]);

  /** Attach scroll listener properly */
  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /** -------------------------------------------
   * LOAD SYSTEM DATA
   * ------------------------------------------ */
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

      console.log(logFileListRes);

      setLogFileNames(logFileListRes.data ?? null);
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

  /** -------------------------------------------
   * LOG FILE CLICK → RESET + LOAD
   * ------------------------------------------ */
  const selectLogFile = (fileName: string) => {
    setLogLineResponse(null); // clear old
    if (logContainerRef.current) logContainerRef.current.scrollTop = 0;
    void loadLogLines(fileName, 0);
  };

  /** -------------------------------------------
   * BACKUP + RESYNC
   * ------------------------------------------ */
  const triggerBackup = async () => {
    await systemApi.triggerSystemBackup();
    setBackupResult("Backup triggered");
  };

  const triggerResync = async () => {
    await systemApi.triggerSystemResync();
    setResyncResult("Resync triggered");
  };

  /** -------------------------------------------
   * SAFE DERIVED VALUES (avoid TS property errors)
   * ------------------------------------------ */
  const overallStatus =
    (status?.data as any)?.status !== undefined
      ? (status?.data as any).status
      : undefined;

  const components =
    ((status?.data as any)?.components as
      | { component: string; status: string }[]
      | undefined) ?? [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <DashboardHeader
        eyebrow={t("common.system")}
        title="Control Plane"
        subtitle="Monitor status, health, settings, unit prices, and administrative actions."
        onRefresh={() => void loadSystemData()}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Status
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {overallStatus ?? "unknown"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Health
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {health?.data ? "Available" : "Unknown"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Settings
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {(settings?.data as any)?.version ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            System Status
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {components.length} component(s) reported.
          </p>
          <div className="mt-4 space-y-3">
            {components.map(
              (component: { component: string; status: string }) => (
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
              )
            )}
            {!components.length && (
              <p className="text-sm text-slate-500">
                No detailed status available.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Backup
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trigger incremental backup to capture configuration.
          </p>
          <button
            type="button"
            onClick={() => {
              void triggerBackup();
            }}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300"
          >
            Start Backup
          </button>
          {backupResult && (
            <p className="mt-2 text-xs text-slate-500">
              Last response: {backupResult}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Resync
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Force resynchronization with upstream components.
          </p>
          <button
            type="button"
            onClick={() => {
              void triggerResync();
            }}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-red-500 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
          >
            Start Resync
          </button>
          {resyncResult && (
            <p className="mt-2 text-xs text-slate-500">
              Last response: {resyncResult}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* File List - 1 column */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
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
                      onClick={() => selectLogFile(fileName)}
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
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Log: {logLineResponse.date}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Scroll to load more… Latest entries first.
            </p>

            <pre
              ref={logContainerRef}
              className="
                mt-3 h-96 overflow-x-auto overflow-y-auto whitespace-pre-wrap text-xs p-4 rounded-xl
                bg-slate-950 text-slate-200 font-mono leading-relaxed
                border border-slate-800 shadow-inner
              "
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#475569 #1e293b",
              }}
            >
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
