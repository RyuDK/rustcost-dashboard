import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { infoApi } from "@/shared/api";
import type {
  InfoLlmEntity,
  InfoLlmUpsertRequest,
  LlmProvider,
} from "@/shared/api/info";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";
import { useLlmSettings } from "../hooks/useLlmSettings";
import { formatDateTime, useTimezone } from "@/shared/time";

type FormState = {
  provider: LlmProvider;
  base_url: string;
  token: string;
  model: string;
  max_output_tokens: string;
  temperature: string;
  top_p: string;
  top_k: string;
  presence_penalty: string;
  frequency_penalty: string;
  timeout_ms: string;
  stream: boolean;
  stop_sequences: string;
  organization: string;
  user: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const providerOptions: { label: string; value: LlmProvider }[] = [
  { label: "HuggingFace", value: "huggingface" },
  { label: "GPT", value: "gpt" },
  { label: "Gemini", value: "gemini" },
  { label: "Grok", value: "grok" },
];

const defaultFormState: FormState = {
  provider: "gpt",
  base_url: "",
  token: "",
  model: "",
  max_output_tokens: "",
  temperature: "",
  top_p: "",
  top_k: "",
  presence_penalty: "",
  frequency_penalty: "",
  timeout_ms: "",
  stream: false,
  stop_sequences: "",
  organization: "",
  user: "",
};

const mapEntityToForm = (entity: InfoLlmEntity): FormState => ({
  provider: entity.provider,
  base_url: entity.base_url ?? "",
  token: "",
  model: entity.model ?? "",
  max_output_tokens: entity.max_output_tokens?.toString() ?? "",
  temperature: entity.temperature?.toString() ?? "",
  top_p: entity.top_p?.toString() ?? "",
  top_k: entity.top_k?.toString() ?? "",
  presence_penalty: entity.presence_penalty?.toString() ?? "",
  frequency_penalty: entity.frequency_penalty?.toString() ?? "",
  timeout_ms: entity.timeout_ms?.toString() ?? "",
  stream: entity.stream ?? false,
  stop_sequences: entity.stop_sequences?.join(", ") ?? "",
  organization: entity.organization ?? "",
  user: entity.user ?? "",
});

const parseNumberValue = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed.length) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeComparable = (
  state: FormState,
  clearToken: boolean
): Record<string, unknown> => ({
  provider: state.provider,
  base_url: state.base_url.trim(),
  model: state.model.trim(),
  max_output_tokens: state.max_output_tokens.trim(),
  temperature: state.temperature.trim(),
  top_p: state.top_p.trim(),
  top_k: state.top_k.trim(),
  presence_penalty: state.presence_penalty.trim(),
  frequency_penalty: state.frequency_penalty.trim(),
  timeout_ms: state.timeout_ms.trim(),
  stream: state.stream,
  stop_sequences: state.stop_sequences
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  organization: state.organization.trim(),
  user: state.user.trim(),
  tokenAction: clearToken
    ? "clear"
    : state.token.trim().length
    ? "update"
    : "none",
});

const buildPayload = (
  form: FormState,
  clearToken: boolean
): InfoLlmUpsertRequest => {
  const stopSequences = form.stop_sequences
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const payload: InfoLlmUpsertRequest = {
    provider: form.provider,
    base_url: form.base_url.trim() ? form.base_url.trim() : undefined,
    token: undefined,
    model: form.model.trim() ? form.model.trim() : undefined,
    max_output_tokens: parseNumberValue(form.max_output_tokens),
    temperature: parseNumberValue(form.temperature),
    top_p: parseNumberValue(form.top_p),
    top_k: parseNumberValue(form.top_k),
    presence_penalty: parseNumberValue(form.presence_penalty),
    frequency_penalty: parseNumberValue(form.frequency_penalty),
    timeout_ms: parseNumberValue(form.timeout_ms),
    stream: form.stream,
    stop_sequences: form.stop_sequences.trim().length ? stopSequences : [],
    organization: form.organization.trim() ? form.organization.trim() : undefined,
    user: form.user.trim() ? form.user.trim() : undefined,
  };

  if (!clearToken && form.token.trim().length) {
    payload.token = form.token.trim();
  }

  return payload;
};

const validateForm = (
  form: FormState,
  t: (key: string, params?: Record<string, string | number>) => string
): FormErrors => {
  const nextErrors: FormErrors = {};
  const baseUrl = form.base_url.trim();

  if (!form.provider) {
    nextErrors.provider = t("llmSettings.errors.provider");
  }

  if (baseUrl.length) {
    try {
      // eslint-disable-next-line no-new
      new URL(baseUrl);
    } catch {
      nextErrors.base_url = t("llmSettings.errors.baseUrl");
    }
  }

  const checkRange = (
    value: string,
    key: keyof FormState,
    min: number,
    max: number,
    translationKey: string
  ) => {
    const parsed = parseNumberValue(value);
    if (parsed === undefined) return;
    if (parsed < min || parsed > max) {
      nextErrors[key] = t(translationKey, { min, max });
    }
  };

  const checkPositive = (
    value: string,
    key: keyof FormState,
    translationKey: string
  ) => {
    const parsed = parseNumberValue(value);
    if (parsed === undefined) return;
    if (parsed <= 0) {
      nextErrors[key] = t(translationKey);
    }
  };

  checkPositive(form.max_output_tokens, "max_output_tokens", "llmSettings.errors.maxTokens");
  checkPositive(form.timeout_ms, "timeout_ms", "llmSettings.errors.timeout");
  checkRange(form.temperature, "temperature", 0, 2, "llmSettings.errors.temperature");
  checkRange(form.top_p, "top_p", 0, 1, "llmSettings.errors.topP");
  checkRange(form.presence_penalty, "presence_penalty", -2, 2, "llmSettings.errors.presence");
  checkRange(
    form.frequency_penalty,
    "frequency_penalty",
    -2,
    2,
    "llmSettings.errors.frequency"
  );

  const topKParsed = parseNumberValue(form.top_k);
  if (topKParsed !== undefined && topKParsed < 0) {
    nextErrors.top_k = t("llmSettings.errors.topK");
  }

  return nextErrors;
};

const Toast = ({
  message,
  tone,
  onClose,
}: {
  message: string;
  tone: "success" | "error";
  onClose: () => void;
}) => (
  <div className="fixed top-4 right-4 z-50">
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${
        tone === "success"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
      }`}
    >
      <span className="text-sm font-semibold">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ×
      </button>
    </div>
  </div>
);

export const LlmSettingsSection = () => {
  const { t } = useI18n();
  const showExplain = useAppSelector((state) => state.preferences.showExplain);
  const { timeZone } = useTimezone();
  const { data, error, isLoading, refetch } = useLlmSettings({
    staleTime: 60_000,
  });
  const entity = data?.is_successful ? data.data : null;
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [clearToken, setClearToken] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null
  );
  const [isSaving, setSaving] = useState(false);
  const [showSavedToken, setShowSavedToken] = useState(false);
  const maskedToken = entity?.token ?? null;

  useEffect(() => {
    if (entity) {
      setForm(mapEntityToForm(entity));
      setErrors({});
      setClearToken(false);
      setShowSavedToken(false);
    }
  }, [entity]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadError =
    error instanceof Error
      ? error.message
      : error
      ? String(error)
      : !data?.is_successful
      ? data?.error_msg ?? t("llmSettings.errors.load")
      : null;

  const baseComparable = useMemo(
    () =>
      entity
        ? normalizeComparable(mapEntityToForm(entity), false)
        : normalizeComparable(defaultFormState, false),
    [entity]
  );

  const isDirty = useMemo(() => {
    return JSON.stringify(normalizeComparable(form, clearToken)) !== JSON.stringify(baseComparable);
  }, [baseComparable, clearToken, form]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const nextErrors = validateForm(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setToast({ tone: "error", message: t("llmSettings.errors.validation") });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, clearToken);
      const res = await infoApi.upsertInfoLlm(payload);

      if (!res.is_successful) {
        throw new Error(res.error_msg ?? t("llmSettings.errors.save"));
      }

      setToast({
        tone: "success",
        message: res.data?.message ?? t("llmSettings.messages.saved"),
      });
      await refetch();
    } catch (err) {
      setToast({
        tone: "error",
        message: err instanceof Error ? err.message : t("llmSettings.errors.save"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (entity) {
      setForm(mapEntityToForm(entity));
    } else {
      setForm(defaultFormState);
    }
    setErrors({});
    setClearToken(false);
  };

  return (
    <section className="mt-8 space-y-4">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
            {t("llmSettings.badge")}
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("llmSettings.title")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("llmSettings.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
          >
            {t("llmSettings.actions.refresh")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
          >
            {t("common.actions.reset")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? t("common.actions.saving") : t("llmSettings.actions.save")}
          </button>
        </div>
      </div>

      <ExplainHint visible={showExplain}>{t("llmSettings.hints.overview")}</ExplainHint>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label={t("llmSettings.loading")} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-slate-100 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none dark:ring-0">
            <ExplainHint visible={showExplain}>{t("llmSettings.hints.security")}</ExplainHint>

            {/* Connection settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.provider")}
                </span>
                <select
                  value={form.provider}
                  onChange={(e) => updateField("provider", e.target.value as LlmProvider)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {providerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("llmSettings.fields.providerHint")}
                </span>
                {errors.provider && (
                  <span className="text-xs text-red-600 dark:text-red-400">{errors.provider}</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.baseUrl")}
                </span>
                <input
                  type="url"
                  value={form.base_url}
                  onChange={(e) => updateField("base_url", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="https://router.huggingface.co/v1"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("llmSettings.fields.baseUrlHint")}
                </span>
                {errors.base_url && (
                  <span className="text-xs text-red-600 dark:text-red-400">{errors.base_url}</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.token")}
                </span>
                <input
                  type="password"
                  value={form.token}
                  onChange={(e) => updateField("token", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder={t("llmSettings.fields.tokenPlaceholder")}
                />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{t("llmSettings.fields.tokenHint")}</span>
                  {maskedToken && (
                    <button
                      type="button"
                      onClick={() => setShowSavedToken((v) => !v)}
                      className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400"
                    >
                      {showSavedToken
                        ? `${t("llmSettings.fields.tokenMasked")}: ${maskedToken}`
                        : t("llmSettings.fields.tokenHidden")}
                    </button>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={clearToken}
                    onChange={(e) => setClearToken(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  {t("llmSettings.fields.clearToken")}
                </label>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.model")}
                </span>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder={t("llmSettings.fields.modelPlaceholder")}
                />
              </label>
            </div>

            {/* Generation parameters */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.maxTokens")}
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.max_output_tokens}
                  onChange={(e) => updateField("max_output_tokens", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="2048"
                />
                {errors.max_output_tokens && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {errors.max_output_tokens}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("llmSettings.fields.temperature")}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.temperature}
                    onChange={(e) => updateField("temperature", e.target.value)}
                    className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={form.temperature || "0"}
                  onChange={(e) => updateField("temperature", e.target.value)}
                  className="accent-blue-600"
                />
                {errors.temperature && (
                  <span className="text-xs text-red-600 dark:text-red-400">{errors.temperature}</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("llmSettings.fields.topP")}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.top_p}
                    onChange={(e) => updateField("top_p", e.target.value)}
                    className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={form.top_p || "0"}
                  onChange={(e) => updateField("top_p", e.target.value)}
                  className="accent-blue-600"
                />
                {errors.top_p && (
                  <span className="text-xs text-red-600 dark:text-red-400">{errors.top_p}</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.topK")}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.top_k}
                  onChange={(e) => updateField("top_k", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="40"
                />
                {errors.top_k && (
                  <span className="text-xs text-red-600 dark:text-red-400">{errors.top_k}</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("llmSettings.fields.presencePenalty")}
                  </span>
                  <input
                    type="number"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={form.presence_penalty}
                    onChange={(e) => updateField("presence_penalty", e.target.value)}
                    className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={form.presence_penalty || "0"}
                  onChange={(e) => updateField("presence_penalty", e.target.value)}
                  className="accent-blue-600"
                />
                {errors.presence_penalty && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {errors.presence_penalty}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("llmSettings.fields.frequencyPenalty")}
                  </span>
                  <input
                    type="number"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={form.frequency_penalty}
                    onChange={(e) => updateField("frequency_penalty", e.target.value)}
                    className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={form.frequency_penalty || "0"}
                  onChange={(e) => updateField("frequency_penalty", e.target.value)}
                  className="accent-blue-600"
                />
                {errors.frequency_penalty && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {errors.frequency_penalty}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.timeoutMs")}
                </span>
                <input
                  type="number"
                  min={1}
                  step={100}
                  value={form.timeout_ms}
                  onChange={(e) => updateField("timeout_ms", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="30000"
                />
                {errors.timeout_ms && (
                  <span className="text-xs text-red-600 dark:text-red-400">{errors.timeout_ms}</span>
                )}
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={form.stream}
                  onChange={(e) => updateField("stream", e.target.checked)}
                  className="h-5 w-5 accent-blue-600"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {t("llmSettings.fields.stream")}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t("llmSettings.hints.stream")}
                  </span>
                </div>
              </label>
            </div>

            {/* Meta */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.stopSequences")}
                </span>
                <input
                  type="text"
                  value={form.stop_sequences}
                  onChange={(e) => updateField("stop_sequences", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder={t("llmSettings.fields.stopSequencesPlaceholder")}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("llmSettings.fields.stopSequencesHint")}
                </span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.organization")}
                </span>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => updateField("organization", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="team-123"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("llmSettings.fields.user")}
                </span>
                <input
                  type="text"
                  value={form.user}
                  onChange={(e) => updateField("user", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="user@example.com"
                />
              </label>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm shadow-slate-100 ring-1 ring-slate-100 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:shadow-none dark:ring-0">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                {t("llmSettings.summary.title")}
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("llmSettings.summary.subtitle")}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("llmSettings.summary.description")}
              </p>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <span>{t("llmSettings.fields.provider")}</span>
                <span className="font-semibold">{entity?.provider ?? t("common.notAvailable")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("llmSettings.fields.model")}</span>
                <span className="font-semibold">
                  {entity?.model ?? t("common.notAvailable")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("llmSettings.fields.baseUrl")}</span>
                <span className="max-w-[12rem] truncate text-right font-semibold">
                  {entity?.base_url ?? t("common.notAvailable")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>{t("llmSettings.fields.tokenMasked")}</span>
                {maskedToken ? (
                  <button
                    type="button"
                    onClick={() => setShowSavedToken((v) => !v)}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400"
                  >
                    {showSavedToken ? maskedToken : t("llmSettings.fields.tokenHidden")}
                  </button>
                ) : (
                  <span className="font-semibold">{t("common.notAvailable")}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>{t("llmSettings.summary.updated")}</span>
                <span className="text-xs">
                  {entity?.updated_at
                    ? formatDateTime(entity.updated_at, { timeZone })
                    : t("common.notAvailable")}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-200">
              {t("llmSettings.hints.payload")}
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
        >
          {t("common.actions.reset")}
        </button>
        <button
          type="button"
          disabled={!isDirty || isSaving}
          onClick={() => void handleSave()}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? t("common.actions.saving") : t("llmSettings.actions.save")}
        </button>
        {isDirty && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("llmSettings.summary.unsaved")}
          </span>
        )}
      </div>
    </section>
  );
};
