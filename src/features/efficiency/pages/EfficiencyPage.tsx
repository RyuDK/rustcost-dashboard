import { useState } from "react";
import { useI18n } from "../../../app/providers/I18nProvider";
import { EfficiencyTable } from "../components/EfficiencyTable";
import { createDefaultMetricsParams } from "../../dashboard/hooks/useMetrics";
import { useNamespaceEfficiencyMetrics } from "../../../entities/metrics/api/endpoints/namespaces";
import { useDeploymentEfficiencyMetrics } from "../../../entities/metrics/api/endpoints/deployments";

export const EfficiencyPage = () => {
  const { t } = useI18n();
  const [params] = useState(() => createDefaultMetricsParams());

  const namespaceEfficiency = useNamespaceEfficiencyMetrics(params);
  const deploymentEfficiency = useDeploymentEfficiencyMetrics(params);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t("efficiency.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("efficiency.subtitle")}</p>
      </header>

      <EfficiencyTable
        title={t("efficiency.table.namespace")}
        data={namespaceEfficiency.data?.data}
        isLoading={namespaceEfficiency.isLoading}
        error={
          namespaceEfficiency.error instanceof Error
            ? namespaceEfficiency.error.message
            : namespaceEfficiency.error
              ? String(namespaceEfficiency.error)
              : undefined
        }
      />

      <EfficiencyTable
        title={t("efficiency.table.deployment")}
        data={deploymentEfficiency.data?.data}
        isLoading={deploymentEfficiency.isLoading}
        error={
          deploymentEfficiency.error instanceof Error
            ? deploymentEfficiency.error.message
            : deploymentEfficiency.error
              ? String(deploymentEfficiency.error)
              : undefined
        }
      />
    </div>
  );
};
