import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";

export const AiInsightPage = () => {
  const { t } = useI18n();

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title={t("nav.aiInsight")}
        breadcrumbItems={[{ label: t("nav.aiInsight") }]}
      />
    </SharedPageLayout>
  );
};
