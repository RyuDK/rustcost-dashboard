import { useI18n } from "@/app/providers/i18n/useI18n";
import { InfoCard } from "@/shared/components/InfoCard";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { SharedTimezoneSelector } from "@/shared/components/selector/SharedTimezoneSelector";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { normalizeLanguageCode } from "@/constants/language";
import { buildLanguagePrefix } from "@/constants/language";
import { formatDateTime, useTimezone } from "@/shared/time";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

export const SettingsPage = () => {
  const { t } = useI18n();
  const settings = useSettings();
  const data = settings.data?.is_successful ? settings.data.data : null;
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const { timeZone } = useTimezone();
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const generalRows = data
    ? [
        { label: t("settings.general.language"), value: data.language },
        {
          label: t("settings.general.darkMode"),
          value: data.is_dark_mode
            ? t("common.states.on")
            : t("common.states.off"),
        },
        { label: t("settings.general.version"), value: data.version },
        {
          label: t("settings.general.updated"),
          value: formatDateTime(data.updated_at, { timeZone }),
        },
      ]
    : [];

  const metricsRows = data
    ? [
        {
          label: t("settings.metrics.scrapeInterval"),
          value: data.scrape_interval_sec,
        },
        { label: t("settings.metrics.batchSize"), value: data.metrics_batch_size },
        {
          label: t("settings.metrics.gpuMetrics"),
          value: data.enable_gpu_metrics
            ? t("common.states.enabled")
            : t("common.states.disabled"),
        },
        {
          label: t("settings.metrics.networkMetrics"),
          value: data.enable_network_metrics
            ? t("common.states.enabled")
            : t("common.states.disabled"),
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
      {t("settings.billing.openUnitPrices")}
    </Link>
  );

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title={t("settings.title")}
        description={t("settings.subtitle")}
        breadcrumbItems={[{ label: t("nav.settings") }]}
      />

      <ExplainHint visible={showExplain}>
        {t("settings.hints.overview")}
      </ExplainHint>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* General */}
        <InfoCard
          title={t("settings.sections.general")}
          rows={generalRows}
          isLoading={settings.isLoading}
          error={
            settings.error instanceof Error
              ? settings.error.message
              : settings.error
              ? String(settings.error)
              : !settings.data?.is_successful
              ? settings.data?.error_msg ?? t("settings.errors.load")
              : undefined
          }
        />

        {/* Metrics */}
        <InfoCard
          title={t("settings.sections.metricsRetention")}
          rows={metricsRows}
          isLoading={settings.isLoading}
          error={
            settings.error instanceof Error
              ? settings.error.message
              : settings.error
              ? String(settings.error)
              : !settings.data?.is_successful
              ? settings.data?.error_msg ?? t("settings.errors.load")
              : undefined
          }
        />

        {/* Billing */}
        <InfoCard
          title={t("settings.sections.billing")}
          description={t("settings.billing.description")}
          rows={[]} // no rows → this card is just a section header + footer
          footer={billingFooter}
          isLoading={false}
        />
      </div>

      <ExplainHint visible={showExplain}>
        {t("settings.hints.timezone")}
      </ExplainHint>
      <SharedTimezoneSelector />
    </SharedPageLayout>
  );
};
