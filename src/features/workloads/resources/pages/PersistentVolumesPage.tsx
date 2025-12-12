import { useCallback, useMemo } from "react";
import type { K8sPersistentVolume } from "@/types/k8s";
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

type PersistentVolumeRow = {
  id: string;
  name: string;
  capacity: string;
  accessModes: string;
  status: string;
  storageClass: string;
  claim: string;
  age: string;
  ageValue: number;
  raw: K8sPersistentVolume;
};

const getPvId = (pv: K8sPersistentVolume) =>
  pv.metadata?.uid ?? pv.metadata?.name ?? "pv";

const mapPvToRow = (pv: K8sPersistentVolume): PersistentVolumeRow => {
  const meta = pv.metadata ?? {};
  const spec = pv.spec ?? {};
  const status = pv.status ?? {};

  const capacity = spec.capacity?.["storage"] ?? "n/a";
  const accessModes = spec.accessModes?.join(", ") ?? "n/a";
  const claim = spec.claimRef
    ? `${spec.claimRef.namespace ?? "default"}/${spec.claimRef.name ?? "claim"}`
    : "unbound";

  return {
    id: getPvId(pv),
    name: meta.name ?? "volume",
    capacity,
    accessModes,
    status: status.phase ?? "Unknown",
    storageClass: spec.storageClassName ?? "n/a",
    claim,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: pv,
  };
};

export const PersistentVolumesPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const fetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sPersistentVolumes(params),
    []
  );

  const {
    items: volumes,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource<K8sPersistentVolume>(fetcher, getPvId);

  const rows = useMemo(() => volumes.map((pv) => mapPvToRow(pv)), [volumes]);

  const totalCount = total || volumes.length;

  const columns: TableColumn<PersistentVolumeRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "PersistentVolume",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelected(row.raw)}
            className="text-left"
          >
            <p className="text-sm font-semibold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-white">
              {row.name}
            </p>
            <p className="text-xs text-slate-500">{row.claim}</p>
          </button>
        ),
        sortAccessor: (row) => row.name,
      },
      { key: "capacity", label: "Capacity" },
      { key: "accessModes", label: "Access Modes" },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {row.status}
          </span>
        ),
      },
      { key: "storageClass", label: "StorageClass" },
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
  const pvName = detailMeta.name ?? "pv";
  const pvCommands = [
    {
      title: "Create",
      commands: ["kubectl apply -f pv.yaml"],
    },
    {
      title: "Delete",
      commands: [`kubectl delete pv ${pvName}`],
    },
    {
      title: "Modify",
      commands: [
        `kubectl patch pv ${pvName} -p '<json>'`,
        `kubectl patch pv ${pvName} -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'`,
      ],
    },
    {
      title: "View",
      commands: [`kubectl get pv ${pvName}`, `kubectl describe pv ${pvName}`],
    },
    {
      title: "Debug",
      commands: [`kubectl get events`, `kubectl describe pv ${pvName}`],
    },
    {
      title: "Logs",
      commands: ["PVs do not generate logs."],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title="Persistent Volumes"
        description="Cluster persistent volumes with capacity and claim bindings."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.persistentVolumes") },
        ]}
      />

      <Table<PersistentVolumeRow>
        title="PersistentVolumes"
        subtitle="Select a volume to inspect storage class, access, and claim."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No persistent volumes found."
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
        title={selected ? detailMeta.name ?? "volume" : "Select a volume"}
        subtitle="Spec, binding, and reclaim policy."
        isLoading={isLoading && !selected}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Capacity
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.capacity?.["storage"] ?? "n/a"}
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
                  {detailSpec.claimRef
                    ? `${detailSpec.claimRef.namespace ?? "default"}/${
                        detailSpec.claimRef.name ?? "claim"
                      }`
                    : "Unbound"}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {detailStatus.phase ?? "Unknown"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Class &amp; Policy
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {detailSpec.storageClassName ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Reclaim: {detailSpec.persistentVolumeReclaimPolicy ?? "n/a"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Metadata
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                UID: {detailMeta.uid ?? "n/a"} · Created{" "}
                {formatAge(detailMeta.creationTimestamp)}
              </p>
            </div>

            <CommandSection heading="Kubectl Commands" groups={pvCommands} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a volume from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
