import { useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { llmApi } from "@/shared/api";
import type {
  ChatRequest,
  ChatResponse,
  ChatWithContextRequest,
} from "@/shared/api/llm";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import type { ApiResponse } from "@/types/api";

export const AiInsightPage = () => {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(256);
  const [stream, setStream] = useState(false);
  const [useContext, setUseContext] = useState(true);
  const [includeClusterSummary, setIncludeClusterSummary] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(false);
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(15);
  const [responseText, setResponseText] = useState("");
  const [rawResponse, setRawResponse] = useState<ApiResponse<ChatResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError(t("aiInsight.errors.promptRequired"));
      return;
    }

    setLoading(true);
    setError(null);
    setResponseText("");
    setRawResponse(null);

    const shared: ChatRequest = {
      messages: [{ role: "user", content: trimmedPrompt }],
      stream,
    };

    if (model.trim()) shared.model = model.trim();
    if (Number.isFinite(maxTokens) && maxTokens > 0) shared.max_tokens = maxTokens;
    if (Number.isFinite(temperature)) shared.temperature = temperature;
    if (Number.isFinite(topP)) shared.top_p = topP;

    const payload: ChatRequest | ChatWithContextRequest = useContext
      ? {
          ...shared,
          include_cluster_summary: includeClusterSummary,
          include_alerts: includeAlerts,
          time_window_minutes: Number.isFinite(timeWindowMinutes)
            ? Math.max(1, Math.floor(timeWindowMinutes))
            : undefined,
        }
      : shared;

    try {
      const res: ApiResponse<ChatResponse> = useContext
        ? await llmApi.chatLlmWithContext(payload as ChatWithContextRequest)
        : await llmApi.chatLlm(payload);
      setRawResponse(res);
      if (!res.is_successful || !res.data) {
        throw new Error(res.error_msg ?? t("aiInsight.errors.requestFailed"));
      }
      const answer = res.data.choices?.[0]?.message?.content ?? "";
      setResponseText(answer);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("aiInsight.errors.requestFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const numericInput = (value: string, setter: (v: number) => void) => {
    const parsed = Number(value);
    setter(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title={t("aiInsight.title")}
        description={t("aiInsight.subtitle")}
        breadcrumbItems={[{ label: t("nav.aiInsight") }]}
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Controls */}
        <aside className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
              {t("aiInsight.controls.badge")}
            </p>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("aiInsight.controls.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("aiInsight.controls.subtitle")}
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t("aiInsight.fields.model")}
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Qwen/Qwen2.5-7B-Instruct:together"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("aiInsight.fields.modelHint")}
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {t("aiInsight.fields.temperature")}
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
                {t("aiInsight.fields.topP")}
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
              {t("aiInsight.fields.maxTokens")}
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
            {t("aiInsight.fields.stream")}
          </label>

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              checked={useContext}
              onChange={(e) => setUseContext(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            {t("aiInsight.fields.useContext")}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("aiInsight.hints.context")}
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
              {t("aiInsight.fields.includeCluster")}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeAlerts}
                onChange={(e) => setIncludeAlerts(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
                disabled={!useContext}
              />
              {t("aiInsight.fields.includeAlerts")}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {t("aiInsight.fields.timeWindow")}
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
                {t("aiInsight.fields.timeWindowHint")}
              </span>
            </label>
          </fieldset>
        </aside>

        {/* Prompt and response */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("aiInsight.prompt.title")}
              </h3>
              <button
                type="button"
                onClick={() => setPrompt("")}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t("common.actions.clear")}
              </button>
            </div>
            <textarea
              rows={8}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("aiInsight.prompt.placeholder")}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("aiInsight.prompt.hint")}
              </span>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleSend()}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? t("common.actions.generating") : t("aiInsight.actions.send")}
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
              <LoadingSpinner label={t("aiInsight.loading")} />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("aiInsight.response.title")}
              </h3>
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300"
              >
                {showRaw
                  ? t("aiInsight.response.hideRaw")
                  : t("aiInsight.response.viewRaw")}
              </button>
            </div>
            <div className="mt-3 min-h-[120px] whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100">
              {responseText || t("aiInsight.response.placeholder")}
            </div>

            {showRaw && rawResponse && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </SharedPageLayout>
  );
};
