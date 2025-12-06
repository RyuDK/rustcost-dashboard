import { useI18n } from "@/app/providers/i18n/useI18n";
import { InfoCard } from "@/shared/components/InfoCard";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { TimezoneSelector } from "@/shared/components/selector/TimezoneSelector";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { normalizeLanguageCode } from "@/constants/language";
import { buildLanguagePrefix } from "@/constants/language";

export const SettingsPage = () => {
  const { t } = useI18n();
  const settings = useSettings();
  const data = settings.data?.is_successful ? settings.data.data : null;
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const generalRows = data
    ? [
        { label: "Language", value: data.language },
        { label: "Dark Mode", value: data.is_dark_mode ? "On" : "Off" },
        { label: "Version", value: data.version },
        { label: "Updated", value: new Date(data.updated_at).toLocaleString() },
      ]
    : [];

  const metricsRows = data
    ? [
        { label: "Scrape Interval (s)", value: data.scrape_interval_sec },
        { label: "Batch Size", value: data.metrics_batch_size },
        {
          label: "GPU Metrics",
          value: data.enable_gpu_metrics ? "Enabled" : "Disabled",
        },
        {
          label: "Network Metrics",
          value: data.enable_network_metrics ? "Enabled" : "Disabled",
        },
      ]
    : [];

  /** ------------------------------------------
   * Billing: use footer for link button
   * ----------------------------------------- */
  const billingFooter = (
    <Link
      to={`${prefix}/unit-prices`}
      className="
        inline-flex items-center justify-center rounded-full border border-slate-300
        px-4 py-2 text-sm font-semibold text-slate-700
        transition-colors hover:border-blue-500 hover:text-blue-600
        dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400
      "
    >
      Open Unit Prices
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("settings.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* General */}
        <InfoCard
          title="General"
          rows={generalRows}
          isLoading={settings.isLoading}
          error={
            settings.error instanceof Error
              ? settings.error.message
              : settings.error
              ? String(settings.error)
              : !settings.data?.is_successful
              ? settings.data?.error_msg ?? "Failed to load settings"
              : undefined
          }
        />

        {/* Metrics */}
        <InfoCard
          title="Metrics & Retention"
          rows={metricsRows}
          isLoading={settings.isLoading}
          error={
            settings.error instanceof Error
              ? settings.error.message
              : settings.error
              ? String(settings.error)
              : !settings.data?.is_successful
              ? settings.data?.error_msg ?? "Failed to load settings"
              : undefined
          }
        />

        {/* Billing */}
        <InfoCard
          title="Billing"
          description="Manage cost-allocation unit prices."
          rows={[]} // no rows → this card is just a section header + footer
          footer={billingFooter}
          isLoading={false}
        />
      </div>

      <TimezoneSelector />
    </div>
  );
};
