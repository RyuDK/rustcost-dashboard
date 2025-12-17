import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { infoApi } from "@/shared/api";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { useFetch } from "@/shared/hooks/useFetch";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";
import type {
  AlertMetricType,
  AlertOperator,
  AlertRule,
  AlertSeverity,
  InfoAlertEntity,
  InfoAlertUpsertRequest,
} from "@/shared/api/info";
import { formatDateTime, useTimezone } from "@/shared/time";

const metricOptions: { label: string; value: AlertMetricType }[] = [
  { label: "CPU usage %", value: "CpuUsagePercent" },
  { label: "Memory usage %", value: "MemoryUsagePercent" },
  { label: "Disk usage %", value: "DiskUsagePercent" },
  { label: "GPU usage %", value: "GpuUsagePercent" },
];

const operatorOptions: { label: string; value: AlertOperator }[] = [
  { label: ">", value: "GreaterThan" },
  { label: ">=", value: "GreaterThanOrEqual" },
  { label: "<", value: "LessThan" },
  { label: "<=", value: "LessThanOrEqual" },
];

const severityOptions: { label: string; value: AlertSeverity }[] = [
  { label: "Info", value: "Info" },
  { label: "Warning", value: "Warning" },
  { label: "Critical", value: "Critical" },
];

const defaultAlertState: InfoAlertEntity = {
  enable_cluster_health_alert: false,
  enable_rustcost_health_alert: false,
  global_alert_subject: "RustCost Alert",
  linkback_url: null,
  email_recipients: [],
  slack_webhook_url: null,
  teams_webhook_url: null,
  discord_webhook_url: null,
  rules: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: "1.0.0",
};

const createRule = (): AlertRule => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `rule-${Date.now()}`,
  name: "New alert rule",
  metric_type: "CpuUsagePercent",
  operator: "GreaterThan",
  threshold: 80,
  for_duration_sec: 60,
  severity: "Warning",
  enabled: true,
});

const sanitizeComparable = (value: InfoAlertEntity) => ({
  enable_cluster_health_alert: value.enable_cluster_health_alert,
  enable_rustcost_health_alert: value.enable_rustcost_health_alert,
  global_alert_subject: value.global_alert_subject,
  linkback_url: value.linkback_url ?? "",
  email_recipients: value.email_recipients,
  slack_webhook_url: value.slack_webhook_url ?? "",
  teams_webhook_url: value.teams_webhook_url ?? "",
  discord_webhook_url: value.discord_webhook_url ?? "",
  rules: value.rules,
});

export function AlertsPage() {
  const { t } = useI18n();
  const { data, error, isLoading, refetch } = useFetch<InfoAlertEntity>(
    ["info-alerts"],
    async () => {
      const res = await infoApi.fetchInfoAlerts();
      if (!res.is_successful || !res.data) {
        throw new Error(res.error_msg ?? "Failed to load alert settings");
      }
      return res.data;
    },
    { staleTime: 60_000 }
  );

  const [draft, setDraft] = useState<InfoAlertEntity>(defaultAlertState);
  const [original, setOriginal] = useState<InfoAlertEntity>(defaultAlertState);
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [recipientInput, setRecipientInput] = useState("");
  const { timeZone } = useTimezone();
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  useEffect(() => {
    if (data) {
      setDraft(data);
      setOriginal(data);
    }
  }, [data]);

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(sanitizeComparable(draft)) !==
      JSON.stringify(sanitizeComparable(original))
    );
  }, [draft, original]);

  const updateField = <K extends keyof InfoAlertEntity>(
    key: K,
    value: InfoAlertEntity[K]
  ) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addRecipient = () => {
    const email = recipientInput.trim();
    if (!email) return;
    if (draft.email_recipients.includes(email)) {
      setRecipientInput("");
      return;
    }
    updateField("email_recipients", [...draft.email_recipients, email]);
    setRecipientInput("");
  };

  const removeRecipient = (email: string) => {
    updateField(
      "email_recipients",
      draft.email_recipients.filter((item) => item !== email)
    );
  };

  const updateRule = <K extends keyof AlertRule>(
    id: string,
    key: K,
    value: AlertRule[K]
  ) => {
    setDraft((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === id ? { ...rule, [key]: value } : rule
      ),
    }));
  };

  const removeRule = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== id),
    }));
  };

  const normalizeNullableUrl = (v?: string | null) => {
    const trimmed = (v ?? "").trim();
    return trimmed.length ? trimmed : null;
  };

  const buildPayload = (state: InfoAlertEntity): InfoAlertUpsertRequest => ({
    enable_cluster_health_alert: state.enable_cluster_health_alert,
    enable_rustcost_health_alert: state.enable_rustcost_health_alert,
    global_alert_subject: state.global_alert_subject,
    linkback_url: normalizeNullableUrl(state.linkback_url),
    email_recipients: state.email_recipients,
    slack_webhook_url: normalizeNullableUrl(state.slack_webhook_url),
    teams_webhook_url: normalizeNullableUrl(state.teams_webhook_url),
    discord_webhook_url: normalizeNullableUrl(state.discord_webhook_url),
    rules: state.rules.map((rule) => ({ ...rule })),
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload = buildPayload(draft);
      const res = await infoApi.upsertInfoAlerts(payload);

      if (!res.is_successful) {
        throw new Error(res.error_msg ?? "Failed to update alert settings");
      }

      setSaveMessage(res.data?.message ?? "Alert settings updated.");
      await refetch();
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to save alert settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(original);
    setSaveMessage(null);
  };

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow="Observability"
        title="Alert Settings"
        description="Manage alert delivery targets, subjects, and evaluation rules served by the backend."
        breadcrumbItems={[{ label: t("nav.alerts") }]}
        primaryAction={{
          label: t("common.refresh"),
          onClick: () => void refetch(),
        }}
      />

      <ExplainHint visible={showExplain}>
        Refresh pulls alert delivery settings from the backend. Changes apply to
        all channels listed below—remember to save after editing.
      </ExplainHint>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Loading alert settings..." />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          <ExplainHint visible={showExplain}>
            Configure delivery targets first, then define rules that evaluate
            metrics server-side. Use save/reset controls at the bottom to commit
            or discard edits.
          </ExplainHint>
          <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm shadow-slate-100 ring-1 ring-slate-100 dark:from-slate-900 dark:to-slate-950 dark:border-slate-800 dark:shadow-none dark:ring-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                  Delivery
                </p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Delivery preferences
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Turn built-in health alerts on or off and set a shared subject
                  for all channels.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400">
                  <input
                    type="checkbox"
                    checked={draft.enable_cluster_health_alert}
                    onChange={(e) =>
                      updateField(
                        "enable_cluster_health_alert",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                  Cluster health
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400">
                  <input
                    type="checkbox"
                    checked={draft.enable_rustcost_health_alert}
                    onChange={(e) =>
                      updateField(
                        "enable_rustcost_health_alert",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                  RustCost health
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner shadow-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Global subject
                </span>
                <input
                  type="text"
                  value={draft.global_alert_subject}
                  onChange={(e) =>
                    updateField("global_alert_subject", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="RustCost Alert"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Used as the subject line for all channels.
                </span>
              </label>

              <label className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner shadow-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Linkback URL (optional)
                </span>
                <input
                  type="url"
                  value={draft.linkback_url ?? ""}
                  onChange={(e) => updateField("linkback_url", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="https://dashboard.example.com/alerts"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Included in alert bodies for quick navigation.
                </span>
              </label>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm shadow-slate-100 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none dark:ring-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Email recipients
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add addresses one-by-one. All recipients receive every alert.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="user@example.com"
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  disabled={!recipientInput.trim()}
                >
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.email_recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-300"
                      aria-label={`Remove ${email}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {!draft.email_recipients.length && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    No recipients added yet.
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {draft.email_recipients.length} recipient
                {draft.email_recipients.length === 1 ? "" : "s"} configured.
              </p>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm shadow-slate-100 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none dark:ring-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Webhooks
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Send alerts to chat systems. Leave blank to disable a channel.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Slack webhook
                  </span>
                  <input
                    type="url"
                    value={draft.slack_webhook_url ?? ""}
                    onChange={(e) =>
                      updateField("slack_webhook_url", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="https://hooks.slack.com/..."
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Microsoft Teams webhook
                  </span>
                  <input
                    type="url"
                    value={draft.teams_webhook_url ?? ""}
                    onChange={(e) =>
                      updateField("teams_webhook_url", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="https://outlook.office.com/webhook/..."
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Discord webhook
                  </span>
                  <input
                    type="url"
                    value={draft.discord_webhook_url ?? ""}
                    onChange={(e) =>
                      updateField("discord_webhook_url", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-100 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/40 dark:shadow-none dark:ring-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Alert rules
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Declarative conditions evaluated by the backend scheduler.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    rules: [...prev.rules, createRule()],
                  }))
                }
                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:border-blue-400"
              >
                Add rule
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {draft.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-100 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {rule.name || "Rule"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        ID: {rule.id}
                      </span>
                      {rule.enabled ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                          Enabled
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) =>
                            updateRule(rule.id, "enabled", e.target.checked)
                          }
                          className="h-4 w-4 accent-blue-600"
                        />
                        Enable
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:border-red-600 dark:hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Name
                      </span>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) =>
                          updateRule(rule.id, "name", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="High CPU on node"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Metric
                      </span>
                      <select
                        value={rule.metric_type}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "metric_type",
                            e.target.value as AlertMetricType
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        {metricOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Operator
                      </span>
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "operator",
                            e.target.value as AlertOperator
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        {operatorOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Threshold
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={rule.threshold}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "threshold",
                            Number.isNaN(Number(e.target.value))
                              ? 0
                              : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="80"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        For (seconds)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={rule.for_duration_sec}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "for_duration_sec",
                            Number.isNaN(Number(e.target.value))
                              ? 0
                              : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="60"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Severity
                      </span>
                      <select
                        value={rule.severity}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "severity",
                            e.target.value as AlertSeverity
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        {severityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ))}

              {!draft.rules.length && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No alert rules configured yet. Add one to start evaluating
                  metrics.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm shadow-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/60 dark:shadow-none">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={!isDirty || isSaving}
                onClick={() => void handleSave()}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save alert settings"}
              </button>
              {saveMessage && (
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {saveMessage}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-sm shadow-slate-100 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-[var(--surface-dark)]/40 dark:text-slate-300 dark:shadow-none dark:ring-0">
              <p className="font-semibold text-slate-900 dark:text-white">
                Version {draft.version}
              </p>
              <p>
                Updated: {formatDateTime(draft.updated_at, { timeZone })}
              </p>
              <p>
                Created: {formatDateTime(draft.created_at, { timeZone })}
              </p>
            </div>
          </section>
        </div>
      )}
    </SharedPageLayout>
  );
}
