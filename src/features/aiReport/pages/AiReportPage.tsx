import { useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { llmApi } from "@/shared/api";
import type {
  ChatResponse,
  ChatWithContextRequest,
} from "@/shared/api/llm";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import type { ApiResponse } from "@/types/api";

export const AiReportPage = () => {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState(
    t("aiReport.prompt.default") as string
  );
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.4);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(800);
  const [stream, setStream] = useState(false);
  const [useContext, setUseContext] = useState(true);
  const [includeClusterSummary, setIncludeClusterSummary] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(60);
  const [responseText, setResponseText] = useState("");
  const [rawResponse, setRawResponse] = useState<ApiResponse<ChatResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const numericInput = (value: string, setter: (v: number) => void) => {
    const parsed = Number(value);
    setter(Number.isFinite(parsed) ? parsed : 0);
  };

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError(t("aiReport.errors.promptRequired"));
      return;
    }

    setLoading(true);
    setError(null);
    setResponseText("");
    setRawResponse(null);

    const payload: ChatWithContextRequest = {
      messages: [{ role: "user", content: trimmedPrompt }],
      stream,
      include_cluster_summary: useContext && includeClusterSummary,
      include_alerts: useContext && includeAlerts,
      time_window_minutes:
        useContext && Number.isFinite(timeWindowMinutes)
          ? Math.max(1, Math.floor(timeWindowMinutes))
          : undefined,
    };

    if (model.trim()) payload.model = model.trim();
    if (Number.isFinite(maxTokens) && maxTokens > 0) payload.max_tokens = maxTokens;
    if (Number.isFinite(temperature)) payload.temperature = temperature;
    if (Number.isFinite(topP)) payload.top_p = topP;

    try {
      const res: ApiResponse<ChatResponse> = await llmApi.chatLlmWithContext(payload);
      setRawResponse(res);
      if (!res.is_successful || !res.data) {
        throw new Error(res.error_msg ?? t("aiReport.errors.requestFailed"));
      }
      const answer = res.data.choices?.[0]?.message?.content ?? "";
      setResponseText(answer);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("aiReport.errors.requestFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title={t("aiReport.title")}
        description={t("aiReport.subtitle")}
        breadcrumbItems={[{ label: t("nav.aiReport") }]}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
              {t("aiReport.controls.badge")}
            </p>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("aiReport.controls.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("aiReport.controls.subtitle")}
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t("aiReport.fields.model")}
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Qwen/Qwen2.5-7B-Instruct:together"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("aiReport.fields.modelHint")}
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {t("aiReport.fields.temperature")}
              </span>
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => numericInput(e.target.value, setTemperature)}
                className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={temperature}
              onChange={(e) => numericInput(e.target.value, setTemperature)}
              className="accent-blue-600"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {t("aiReport.fields.topP")}
              </span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={topP}
                onChange={(e) => numericInput(e.target.value, setTopP)}
                className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={topP}
              onChange={(e) => numericInput(e.target.value, setTopP)}
              className="accent-blue-600"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t("aiReport.fields.maxTokens")}
            </span>
            <input
              type="number"
              min={1}
              value={maxTokens}
              onChange={(e) => numericInput(e.target.value, setMaxTokens)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={stream}
              onChange={(e) => setStream(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            {t("aiReport.fields.stream")}
          </label>

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              checked={useContext}
              onChange={(e) => setUseContext(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            {t("aiReport.fields.useContext")}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("aiReport.hints.context")}
          </p>

          <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeClusterSummary}
                onChange={(e) => setIncludeClusterSummary(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
                disabled={!useContext}
              />
              {t("aiReport.fields.includeCluster")}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeAlerts}
                onChange={(e) => setIncludeAlerts(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
                disabled={!useContext}
              />
              {t("aiReport.fields.includeAlerts")}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {t("aiReport.fields.timeWindow")}
              </span>
              <input
                type="number"
                min={1}
                value={timeWindowMinutes}
                onChange={(e) => numericInput(e.target.value, setTimeWindowMinutes)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                disabled={!useContext}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("aiReport.fields.timeWindowHint")}
              </span>
            </label>
          </fieldset>
        </aside>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("aiReport.prompt.title")}
              </h3>
              <button
                type="button"
                onClick={() => setPrompt(t("aiReport.prompt.default") as string)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t("common.actions.reset")}
              </button>
            </div>
            <textarea
              rows={10}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("aiReport.prompt.placeholder")}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("aiReport.prompt.hint")}
              </span>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleSend()}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? t("common.actions.generating") : t("aiReport.actions.generate")}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-6">
              <LoadingSpinner label={t("aiReport.loading")} />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("aiReport.response.title")}
              </h3>
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300"
              >
                {showRaw
                  ? t("aiReport.response.hideRaw")
                  : t("aiReport.response.viewRaw")}
              </button>
            </div>
            <div className="mt-3 min-h-[180px] whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100">
              {responseText || t("aiReport.response.placeholder")}
            </div>

            {showRaw && rawResponse && (
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </SharedPageLayout>
  );
};
