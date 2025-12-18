import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { infoApi } from "@/shared/api";
import { useFetch } from "@/shared/hooks/useFetch";
import type {
  InfoUnitPrice,
  InfoUnitPriceUpsertRequest,
} from "@/shared/api/info";
import { useNavigate, useParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { SharedConfirmModal } from "@/shared/components/modal/SharedConfirmModal";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

export const UnitPricesPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  /** -------------------------------------------
   * FETCH EXISTING UNIT PRICES
   * ------------------------------------------ */
  const { data, error, isLoading, refetch } = useFetch(
    ["unit-prices"],
    async () => {
      const res = await infoApi.fetchInfoUnitPrices();
      if (!res.is_successful || !res.data) {
        throw new Error(res.error_msg ?? t("unitPrices.errors.load"));
      }
      return res.data as InfoUnitPrice;
    },
    { staleTime: 60_000 }
  );

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  /** -------------------------------------------
   * MODAL STATES
   * ------------------------------------------ */
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showNoChanges, setShowNoChanges] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  /** -------------------------------------------
   * LOCAL EDITING STATE
   * ------------------------------------------ */
  const [form, setForm] = useState<InfoUnitPriceUpsertRequest>({});
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  /** Load API data into form */
  useEffect(() => {
    if (data) {
      setForm({
        cpu_core_hour: data.cpu_core_hour,
        cpu_spot_core_hour: data.cpu_spot_core_hour,
        memory_gb_hour: data.memory_gb_hour,
        memory_spot_gb_hour: data.memory_spot_gb_hour,
        gpu_hour: data.gpu_hour,
        gpu_spot_hour: data.gpu_spot_hour,
        storage_gb_hour: data.storage_gb_hour,
        network_local_gb: data.network_local_gb,
        network_regional_gb: data.network_regional_gb,
        network_external_gb: data.network_external_gb,
      });
    }
  }, [data]);

  /** Update form field */
  const updateField = (
    key: keyof InfoUnitPriceUpsertRequest,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : Number(value),
    }));
  };

  /** Detect unsaved changes */
  const isDirty = data
    ? Object.keys(form).some(
        (k) =>
          form[k as keyof InfoUnitPriceUpsertRequest] !==
          data[k as keyof InfoUnitPrice]
      )
    : false;

  /** Save button click handler */
  const trySave = () => {
    if (!isDirty) {
      setShowNoChanges(true);
      return;
    }
    setShowConfirmSave(true);
  };

  /** Cancel button click handler */
  const tryCancel = () => {
    if (isDirty) {
      setShowConfirmCancel(true);
      return;
    }
    navigate(`${prefix}/`);
  };

  /** -------------------------------------------
   * SAVE UPDATED PRICES
   * ------------------------------------------ */
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await infoApi.upsertInfoUnitPrices(form);

      if (!res.is_successful) {
        throw new Error(res.error_msg ?? t("unitPrices.errors.save"));
      }

      setSaveMessage(t("unitPrices.messages.updated"));
      await refetch();
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : t("unitPrices.errors.save")
      );
    } finally {
      setSaving(false);
    }
  };

  /** Reset & navigate */
  const handleCancel = () => {
    if (data) {
      setForm({
        cpu_core_hour: data.cpu_core_hour,
        cpu_spot_core_hour: data.cpu_spot_core_hour,
        memory_gb_hour: data.memory_gb_hour,
        memory_spot_gb_hour: data.memory_spot_gb_hour,
        gpu_hour: data.gpu_hour,
        gpu_spot_hour: data.gpu_spot_hour,
        storage_gb_hour: data.storage_gb_hour,
        network_local_gb: data.network_local_gb,
        network_regional_gb: data.network_regional_gb,
        network_external_gb: data.network_external_gb,
      });
    }
    navigate(`${prefix}/`);
  };

  /** Refresh */
  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title={t("unitPrices.title")}
        description={t("unitPrices.subtitle")}
        breadcrumbItems={[{ label: t("nav.unitPrices") }]}
        primaryAction={{
          label: t("common.refresh"),
          onClick: handleRefresh,
        }}
      />

      <ExplainHint visible={showExplain}>
        {t("unitPrices.hints.overview")}
      </ExplainHint>

      {/* --- Errors --- */}
      {errorMessage && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner label={t("unitPrices.loading")} />
        </div>
      )}

      {!isLoading && data && (
        <>
          <ExplainHint visible={showExplain}>
            {t("unitPrices.hints.editing")}
          </ExplainHint>
          {/* --- Editable Grid --- */}
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EditablePrice
              title={t("unitPrices.resources.cpu")}
              unit={t("unitPrices.units.coreHour")}
              value={form.cpu_core_hour}
              onChange={(v) => updateField("cpu_core_hour", v)}
            />
            <EditablePrice
              title={t("unitPrices.resources.cpuSpot")}
              unit={t("unitPrices.units.coreHour")}
              value={form.cpu_spot_core_hour}
              onChange={(v) => updateField("cpu_spot_core_hour", v)}
            />

            <EditablePrice
              title={t("unitPrices.resources.memory")}
              unit={t("unitPrices.units.gbHour")}
              value={form.memory_gb_hour}
              onChange={(v) => updateField("memory_gb_hour", v)}
            />
            <EditablePrice
              title={t("unitPrices.resources.memorySpot")}
              unit={t("unitPrices.units.gbHour")}
              value={form.memory_spot_gb_hour}
              onChange={(v) => updateField("memory_spot_gb_hour", v)}
            />

            <EditablePrice
              title={t("unitPrices.resources.gpu")}
              unit={t("unitPrices.units.hour")}
              value={form.gpu_hour}
              onChange={(v) => updateField("gpu_hour", v)}
            />
            <EditablePrice
              title={t("unitPrices.resources.gpuSpot")}
              unit={t("unitPrices.units.hour")}
              value={form.gpu_spot_hour}
              onChange={(v) => updateField("gpu_spot_hour", v)}
            />

            <EditablePrice
              title={t("unitPrices.resources.storage")}
              unit={t("unitPrices.units.gbHour")}
              value={form.storage_gb_hour}
              onChange={(v) => updateField("storage_gb_hour", v)}
            />

            <EditablePrice
              title={t("unitPrices.resources.networkLocal")}
              unit={t("unitPrices.units.gb")}
              value={form.network_local_gb}
              onChange={(v) => updateField("network_local_gb", v)}
            />
            <EditablePrice
              title={t("unitPrices.resources.networkRegional")}
              unit={t("unitPrices.units.gb")}
              value={form.network_regional_gb}
              onChange={(v) => updateField("network_regional_gb", v)}
            />
            <EditablePrice
              title={t("unitPrices.resources.networkExternal")}
              unit={t("unitPrices.units.gb")}
              value={form.network_external_gb}
              onChange={(v) => updateField("network_external_gb", v)}
            />
          </section>

          {/* --- Save / Cancel --- */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              onClick={tryCancel}
              disabled={isSaving}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
            >
              {t("common.actions.cancel")}
            </button>

            <button
              onClick={trySave}
              disabled={isSaving}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? t("common.actions.saving") : t("common.actions.save")}
            </button>
          </div>

          {saveMessage && (
            <p className="text-sm text-slate-600 dark:text-slate-300 pt-2">
              {saveMessage}
            </p>
          )}
        </>
      )}

      {/* ---------------------- MODALS ---------------------- */}

      {/* No changes modal */}
      <SharedConfirmModal
        open={showNoChanges}
        title={t("unitPrices.modals.noChanges.title")}
        message={t("unitPrices.modals.noChanges.message")}
        okText={t("common.actions.ok")}
        cancelText=""
        onOk={() => setShowNoChanges(false)}
        onCancel={() => setShowNoChanges(false)}
      />

      {/* Save confirmation */}
      <SharedConfirmModal
        open={showConfirmSave}
        title={t("unitPrices.modals.confirmSave.title")}
        message={t("unitPrices.modals.confirmSave.message")}
        okText={t("common.actions.save")}
        cancelText={t("common.actions.cancel")}
        onOk={() => {
          setShowConfirmSave(false);
          void handleSave();
        }}
        onCancel={() => setShowConfirmSave(false)}
      />

      {/* Cancel confirmation */}
      <SharedConfirmModal
        open={showConfirmCancel}
        title={t("unitPrices.modals.confirmDiscard.title")}
        message={t("unitPrices.modals.confirmDiscard.message")}
        okText={t("unitPrices.modals.confirmDiscard.ok")}
        cancelText={t("unitPrices.modals.confirmDiscard.cancel")}
        onOk={() => handleCancel()}
        onCancel={() => setShowConfirmCancel(false)}
      />
    </SharedPageLayout>
  );
};

/* ---------------------------------------------------------
 * Editable Price Card Component
 * -------------------------------------------------------- */
const EditablePrice = ({
  title,
  value,
  onChange,
  unit,
}: {
  title: string;
  value?: number;
  unit: string;
  onChange: (v: string) => void;
}) => (
  <div
    className="
      rounded-xl border border-slate-200 bg-white p-4 shadow-sm
      dark:border-slate-800 dark:bg-[var(--surface-dark)]/50
      hover:border-blue-400 transition-colors
    "
  >
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">$</span>

        <input
          type="number"
          step="0.00001"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5
            text-sm text-slate-900 shadow-sm
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            dark:border-slate-700 dark:bg-slate-900 dark:text-white
          "
        />

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  </div>
);
