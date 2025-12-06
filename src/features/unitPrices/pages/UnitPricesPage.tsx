import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
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
import { ConfirmModal } from "@/shared/components/modal/ConfirmModal";

export const UnitPricesPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  /** -------------------------------------------
   * FETCH EXISTING UNIT PRICES
   * ------------------------------------------ */
  const { data, error, isLoading, refetch } = useFetch(
    ["unit-prices"],
    async () => {
      const res = await infoApi.fetchInfoUnitPrices();
      if (!res.is_successful || !res.data) {
        throw new Error(res.error_msg ?? "Failed to load unit prices");
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
        throw new Error(res.error_msg ?? "Failed to save unit prices");
      }

      setSaveMessage("Unit prices updated successfully.");
      await refetch();
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to save unit prices"
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
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <DashboardHeader
        eyebrow={t("common.system")}
        title="Unit Prices"
        subtitle="Modify raw pricing used for workload cost allocation."
        onRefresh={handleRefresh}
      />

      {/* --- Errors --- */}
      {errorMessage && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner label="Loading Unit Prices..." />
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* --- Editable Grid --- */}
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EditablePrice
              title="CPU"
              unit="/core hr"
              value={form.cpu_core_hour}
              onChange={(v) => updateField("cpu_core_hour", v)}
            />
            <EditablePrice
              title="CPU (Spot)"
              unit="/core hr"
              value={form.cpu_spot_core_hour}
              onChange={(v) => updateField("cpu_spot_core_hour", v)}
            />

            <EditablePrice
              title="Memory"
              unit="/GB hr"
              value={form.memory_gb_hour}
              onChange={(v) => updateField("memory_gb_hour", v)}
            />
            <EditablePrice
              title="Memory (Spot)"
              unit="/GB hr"
              value={form.memory_spot_gb_hour}
              onChange={(v) => updateField("memory_spot_gb_hour", v)}
            />

            <EditablePrice
              title="GPU"
              unit="/hr"
              value={form.gpu_hour}
              onChange={(v) => updateField("gpu_hour", v)}
            />
            <EditablePrice
              title="GPU (Spot)"
              unit="/hr"
              value={form.gpu_spot_hour}
              onChange={(v) => updateField("gpu_spot_hour", v)}
            />

            <EditablePrice
              title="Storage"
              unit="/GB hr"
              value={form.storage_gb_hour}
              onChange={(v) => updateField("storage_gb_hour", v)}
            />

            <EditablePrice
              title="Network (Local)"
              unit="/GB"
              value={form.network_local_gb}
              onChange={(v) => updateField("network_local_gb", v)}
            />
            <EditablePrice
              title="Network (Regional)"
              unit="/GB"
              value={form.network_regional_gb}
              onChange={(v) => updateField("network_regional_gb", v)}
            />
            <EditablePrice
              title="Network (External)"
              unit="/GB"
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
              Cancel
            </button>

            <button
              onClick={trySave}
              disabled={isSaving}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
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
      <ConfirmModal
        open={showNoChanges}
        title="No Changes Detected"
        message="There are no modifications to save."
        okText="OK"
        cancelText=""
        onOk={() => setShowNoChanges(false)}
        onCancel={() => setShowNoChanges(false)}
      />

      {/* Save confirmation */}
      <ConfirmModal
        open={showConfirmSave}
        title="Confirm Save"
        message="Are you sure you want to update the unit prices?"
        okText="Save"
        cancelText="Cancel"
        onOk={() => {
          setShowConfirmSave(false);
          void handleSave();
        }}
        onCancel={() => setShowConfirmSave(false)}
      />

      {/* Cancel confirmation */}
      <ConfirmModal
        open={showConfirmCancel}
        title="Discard Changes?"
        message="Your unsaved changes will be lost. Continue?"
        okText="Discard"
        cancelText="Stay"
        onOk={() => handleCancel()}
        onCancel={() => setShowConfirmCancel(false)}
      />
    </div>
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
