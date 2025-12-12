import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { useParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { useI18n } from "@/app/providers/i18n/useI18n";

export const ResourcesOverviewPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title="Resources Overview"
        description="Coming soon: inventory views for Kubernetes workload resources."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources") },
        ]}
      />
    </SharedPageLayout>
  );
};
