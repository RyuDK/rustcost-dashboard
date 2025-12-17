import { useCallback, useMemo } from "react";
import type { K8sPersistentVolumeClaim } from "@/types/k8s";
import { infoApi } from "@/shared/api";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { Table, type TableColumn } from "@/shared/components/Table";
import { SharedCard } from "@/shared/components/metrics/SharedCard";
import { formatAge, usePaginatedResource } from "../hooks/usePaginatedResource";
import { ResourcePaginationControls } from "../components/ResourcePaginationControls";
import { CommandSection } from "../components/CommandSection";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { useParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

type PersistentVolumeClaimRow = {
  id: string;
  name: string;
  namespace: string;
  status: string;
  request: string;
  storageClass: string;
  volume: string;
  accessModes: string;
  age: string;
  ageValue: number;
  raw: K8sPersistentVolumeClaim;
};

const getPvcId = (pvc: K8sPersistentVolumeClaim) =>
  pvc.metadata?.uid ??
  `${pvc.metadata?.namespace ?? "default"}-${pvc.metadata?.name ?? "unknown"}`;

const mapPvcToRow = (
  pvc: K8sPersistentVolumeClaim
): PersistentVolumeClaimRow => {
  const meta = pvc.metadata ?? {};
  const spec = pvc.spec ?? {};
  const status = pvc.status ?? {};

  return {
    id: getPvcId(pvc),
    name: meta.name ?? "pvc",
    namespace: meta.namespace ?? "default",
    status: status.phase ?? "Unknown",
    request: spec.resources?.requests?.storage ?? "n/a",
    storageClass: spec.storageClassName ?? "n/a",
    volume: spec.volumeName ?? "unbound",
    accessModes: spec.accessModes?.join(", ") ?? "n/a",
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: pvc,
  };
};

export const PersistentVolumeClaimsPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const fetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sPersistentVolumeClaims(params),
    []
  );

  const {
    items: claims,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource<K8sPersistentVolumeClaim>(fetcher, getPvcId);

  const rows = useMemo(() => claims.map((pvc) => mapPvcToRow(pvc)), [claims]);

  const totalCount = total || claims.length;

  const columns: TableColumn<PersistentVolumeClaimRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "PersistentVolumeClaim",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelected(row.raw)}
            className="text-left"
          >
            <p className="text-sm font-semibold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-white">
              {row.name}
            </p>
            <p className="text-xs text-slate-500">ns/{row.namespace}</p>
          </button>
        ),
        sortAccessor: (row) => row.name,
      },
      { key: "status", label: "Status" },
      { key: "request", label: "Request" },
      { key: "storageClass", label: "StorageClass" },
      { key: "volume", label: "Volume" },
      { key: "accessModes", label: "Access Modes" },
      {
        key: "age",
        label: "Age",
        align: "right",
        sortAccessor: (row) => row.ageValue,
      },
    ],
    [setSelected]
  );

  const detailMeta = selected?.metadata ?? {};
  const detailSpec = selected?.spec ?? {};
  const detailStatus = selected?.status ?? {};
  const pvcName = detailMeta.name ?? "pvc";
  const pvcNs = detailMeta.namespace ?? "default";
  const pvcCommands = [
    {
      title: "Create",
      commands: ["kubectl apply -f pvc.yaml"],
    },
    {
      title: "Delete",
      commands: [`kubectl delete pvc ${pvcName} -n ${pvcNs}`],
    },
    {
      title: "Modify",
      commands: [
        `kubectl patch pvc ${pvcName} -n ${pvcNs} -p '{"spec":{"resources":{"requests":{"storage":"10Gi"}}}}'`,
        "Changing storage class typically requires a new PVC with Retain PV.",
      ],
    },
    {
      title: "View",
      commands: [
        `kubectl get pvc ${pvcName} -n ${pvcNs}`,
        `kubectl describe pvc ${pvcName} -n ${pvcNs}`,
      ],
    },
    {
      title: "Debug",
      commands: [
        `kubectl get events -n ${pvcNs}`,
        `kubectl describe pvc ${pvcName} -n ${pvcNs}`,
      ],
    },
    {
      title: "Logs",
      commands: ["PVCs do not have logs."],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title="Persistent Volume Claims"
        description="Claims with requested storage, class, and binding."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.persistentVolumeClaims") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Track claims, storage classes, and bound volumes. Selecting a PVC shows
        capacity requests, access modes, and kubectl commands for binding
        issues.
      </ExplainHint>

      <Table<PersistentVolumeClaimRow>
        title="PersistentVolumeClaims"
        subtitle="Select a claim to inspect storage request and binding."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No persistent volume claims found."
        rowKey={(row) => row.id}
        actions={
          <ResourcePaginationControls
            offset={offset}
            pageSize={pageSize}
            totalCount={totalCount}
            isLoading={isLoading}
            setOffset={setOffset}
            setPageSize={setPageSize}
          />
        }
      />

      <SharedCard
        title={
          selected
            ? `${detailMeta.namespace ?? "default"}/${detailMeta.name ?? "pvc"}`
            : "Select a claim"
        }
        subtitle="Spec, storage class, and binding details."
        isLoading={isLoading && !selected}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Request
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.resources?.requests?.storage ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Access: {detailSpec.accessModes?.join(", ") ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Binding
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {detailSpec.volumeName ?? "Unbound"}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {detailStatus.phase ?? "Unknown"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Storage Class
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {detailSpec.storageClassName ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Created {formatAge(detailMeta.creationTimestamp)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Metadata
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                UID: {detailMeta.uid ?? "n/a"} · ResourceVersion:{" "}
                {detailMeta.resourceVersion ?? "n/a"}
              </p>
            </div>

            <CommandSection heading="Kubectl Commands" groups={pvcCommands} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a claim from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
