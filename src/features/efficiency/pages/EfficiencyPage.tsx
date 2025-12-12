import { useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { EfficiencyTable } from "@/features/efficiency/components/EfficiencyTable";
import { createDefaultMetricsParams } from "@/features/dashboard/hooks/useMetrics";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import {
  useNamespaceEfficiencyMetrics,
  useDeploymentEfficiencyMetrics,
} from "@/features/metrics/hooks/resourceHooks";

export const EfficiencyPage = () => {
  const { t } = useI18n();
  const [params] = useState(() => createDefaultMetricsParams());

  const namespaceEfficiency = useNamespaceEfficiencyMetrics(params);
  const deploymentEfficiency = useDeploymentEfficiencyMetrics(params);

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title={t("efficiency.title")}
        description={t("efficiency.subtitle")}
        breadcrumbItems={[{ label: t("nav.efficiency") }]}
      />

      <EfficiencyTable
        title={t("efficiency.table.namespace")}
        data={namespaceEfficiency.data}
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
        data={deploymentEfficiency.data}
        isLoading={deploymentEfficiency.isLoading}
        error={
          deploymentEfficiency.error instanceof Error
            ? deploymentEfficiency.error.message
            : deploymentEfficiency.error
            ? String(deploymentEfficiency.error)
            : undefined
        }
      />
    </SharedPageLayout>
  );
};
