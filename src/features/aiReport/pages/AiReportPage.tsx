import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";

export const AiReportPage = () => {
  const { t } = useI18n();

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title={t("nav.aiReport")}
        breadcrumbItems={[{ label: t("nav.aiReport") }]}
      />
    </SharedPageLayout>
  );
};
