import { useI18n } from "../../../app/providers/I18nProvider";
import { InfoCard } from "../../../entities/info/ui/InfoCard";
import {
  useSettingsConfiguration,
  useSettingsMetadata,
} from "../../../entities/info/api/endpoints/settings";

export const SettingsPage = () => {
  const { t } = useI18n();
  const metadata = useSettingsMetadata();
  const configuration = useSettingsConfiguration();

  const metadataRows = metadata.data
    ? [
        { label: "Default Currency", value: metadata.data.data.defaultCurrency },
        { label: "Default Date Range", value: `${metadata.data.data.defaultDateRangeDays} days` },
        {
          label: "Notifications",
          value: metadata.data.data.notificationsEnabled ? "Enabled" : "Disabled",
        },
        {
          label: "Feature Flags",
          value: Object.entries(metadata.data.data.featureFlags)
            .map(([key, enabled]) => `${key}: ${enabled ? "on" : "off"}`)
            .join(", "),
        },
      ]
    : [];

  const configurationRows = configuration.data
    ? [
        {
          label: "Cost Alert Threshold",
          value: configuration.data.data.alerts.costThreshold,
        },
        {
          label: "Efficiency Alert Threshold",
          value: configuration.data.data.alerts.efficiencyThreshold,
        },
        {
          label: "Sampling Interval (s)",
          value: configuration.data.data.sampling.intervalSeconds,
        },
        {
          label: "Retention (days)",
          value: configuration.data.data.sampling.retentionDays,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard
          title="Platform Defaults"
          rows={metadataRows}
          isLoading={metadata.isLoading}
          error={
            metadata.error instanceof Error
              ? metadata.error.message
              : metadata.error
                ? String(metadata.error)
                : undefined
          }
        />
        <InfoCard
          title="Alerting & Sampling"
          rows={configurationRows}
          isLoading={configuration.isLoading}
          error={
            configuration.error instanceof Error
              ? configuration.error.message
              : configuration.error
                ? String(configuration.error)
                : undefined
          }
        />
      </div>
    </div>
  );
};
