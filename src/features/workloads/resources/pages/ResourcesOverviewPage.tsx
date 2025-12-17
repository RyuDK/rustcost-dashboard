import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { useParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

export const ResourcesOverviewPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

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

      <ExplainHint visible={showExplain}>
        Resource inventory pages provide live Kubernetes objects with details
        and commands. Additional resource types will surface here as they are
        added.
      </ExplainHint>
    </SharedPageLayout>
  );
};
