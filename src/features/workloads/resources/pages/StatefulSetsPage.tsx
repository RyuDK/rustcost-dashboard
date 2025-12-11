import { useCallback, useMemo } from "react";
import type {
  K8sCondition,
  K8sContainerSpec,
  K8sStatefulSet,
} from "@/types/k8s";
import { infoApi } from "@/shared/api";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { Table, type TableColumn } from "@/shared/components/Table";
import { SharedCard } from "@/shared/components/metrics/SharedCard";
import {
  formatAge,
  usePaginatedResource,
} from "../hooks/usePaginatedResource";
import { ResourcePaginationControls } from "../components/ResourcePaginationControls";

type StatefulSetRow = {
  id: string;
  name: string;
  namespace: string;
  readiness: string;
  updated: number;
  serviceName: string;
  storage: string;
  age: string;
  ageValue: number;
  raw: K8sStatefulSet;
};

const getStatefulSetId = (statefulSet: K8sStatefulSet) =>
  statefulSet.metadata?.uid ??
  `${statefulSet.metadata?.namespace ?? "default"}-${
    statefulSet.metadata?.name ?? "unknown"
  }`;

const mapStatefulSetToRow = (statefulSet: K8sStatefulSet): StatefulSetRow => {
  const meta = statefulSet.metadata ?? {};
  const spec = statefulSet.spec ?? {};
  const status = statefulSet.status ?? {};

  const replicas = spec.replicas ?? status.replicas ?? 0;
  const ready = status.readyReplicas ?? 0;
  const storage =
    spec.volumeClaimTemplates?.[0]?.spec?.resources?.requests?.storage ??
    "n/a";

  return {
    id: getStatefulSetId(statefulSet),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    readiness: `${ready}/${replicas}`,
    updated: status.updatedReplicas ?? 0,
    serviceName: spec.serviceName ?? "n/a",
    storage,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: statefulSet,
  };
};

const renderCondition = (condition: K8sCondition) => (
  <div
    key={`${condition.type}-${condition.status}-${condition.lastUpdateTime}`}
    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60"
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {condition.type ?? "Unknown"}
      </p>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          condition.status === "True"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-300"
        }`}
      >
        {condition.status ?? "n/a"}
      </span>
    </div>
    {condition.reason && (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {condition.reason}
      </p>
    )}
    {condition.message && (
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {condition.message}
      </p>
    )}
  </div>
);

export const StatefulSetsPage = () => {
  const fetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sStatefulSets(params),
    []
  );

  const {
    items: statefulSets,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource<K8sStatefulSet>(fetcher, getStatefulSetId);

  const rows = useMemo(
    () => statefulSets.map((statefulSet) => mapStatefulSetToRow(statefulSet)),
    [statefulSets]
  );

  const totalCount = total || statefulSets.length;

  const columns: TableColumn<StatefulSetRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "StatefulSet",
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
      {
        key: "readiness",
        label: "Ready",
        align: "center",
      },
      {
        key: "updated",
        label: "Updated",
        align: "center",
        sortAccessor: (row) => row.updated,
      },
      {
        key: "serviceName",
        label: "Service",
      },
      {
        key: "storage",
        label: "Storage",
      },
      {
        key: "age",
        label: "Age",
        align: "right",
        sortAccessor: (row) => row.ageValue,
      },
    ],
    [setSelected]
  );

  const paginationControls = (
    <ResourcePaginationControls
      offset={offset}
      pageSize={pageSize}
      totalCount={totalCount}
      isLoading={isLoading}
      setOffset={setOffset}
      setPageSize={setPageSize}
    />
  );

  const detailMeta = selected?.metadata ?? {};
  const detailSpec = selected?.spec ?? {};
  const detailStatus = selected?.status ?? {};
  const containers = detailSpec.template?.spec?.containers ?? [];
  const volumeClaims = detailSpec.volumeClaimTemplates ?? [];
  const conditions = detailStatus.conditions ?? [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <SharedPageHeader
        eyebrow="Resources"
        title="StatefulSets"
        description="Inventory of StatefulSets with pod identity and storage footprints."
      />

      <Table<StatefulSetRow>
        title="StatefulSet Inventory"
        subtitle="Select a StatefulSet to inspect metadata and status conditions."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No stateful sets found."
        rowKey={(row) => row.id}
        actions={paginationControls}
      />

      <SharedCard
        title={
          selected
            ? `${detailMeta.namespace ?? "default"}/${
                detailMeta.name ?? "statefulset"
              }`
            : "Select a StatefulSet"
        }
        subtitle="Details, pods template, and persistent volume claims."
        isLoading={isLoading && !selected}
      >
        {selected ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Replicas
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailStatus.readyReplicas ?? 0} /{" "}
                  {detailSpec.replicas ?? detailStatus.replicas ?? 0}
                </p>
                <p className="text-xs text-slate-500">
                  Updated: {detailStatus.updatedReplicas ?? 0} · Current:{" "}
                  {detailStatus.currentReplicas ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Strategy
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.updateStrategy?.type ?? "RollingUpdate"}
                </p>
                <p className="text-xs text-slate-500">
                  Partition:{" "}
                  {detailSpec.updateStrategy?.rollingUpdate?.partition ??
                    "none"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Service
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.serviceName ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Created {formatAge(detailMeta.creationTimestamp)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Labels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailMeta.labels && Object.keys(detailMeta.labels).length ? (
                    Object.entries(detailMeta.labels).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {key}: {value}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No labels set.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Selector
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailSpec.selector?.matchLabels &&
                  Object.keys(detailSpec.selector.matchLabels).length ? (
                    Object.entries(detailSpec.selector.matchLabels).map(
                      ([key, value]) => (
                        <span
                          key={key}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                        >
                          {key}: {value}
                        </span>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No selector recorded.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Containers
                </h3>
                <span className="text-xs text-slate-500">
                  {containers.length} found
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {containers.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No container spec found.
                  </p>
                )}
                {containers.map((container, index) => (
                  <ContainerCard
                    key={`${container.name ?? container.image ?? "container"}-${index}`}
                    container={container}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Volume claim templates
                </h3>
                <span className="text-xs text-slate-500">
                  {volumeClaims.length} defined
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {volumeClaims.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No volume claims defined.
                  </p>
                )}
                {volumeClaims.map((claim, index) => (
                  <div
                    key={`${claim.metadata?.name ?? "pvc"}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {claim.metadata?.name ?? "pvc"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Storage:{" "}
                      {claim.spec?.resources?.requests?.storage ?? "n/a"} ·
                      Access: {claim.spec?.accessModes?.join(", ") ?? "n/a"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Class: {claim.spec?.storageClassName ?? "n/a"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Status conditions
                </h3>
                <span className="text-xs text-slate-500">
                  {conditions.length} recorded
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {conditions.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No conditions reported yet.
                  </p>
                )}
                {conditions.map((condition) => renderCondition(condition))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a StatefulSet from the table to view details.
          </p>
        )}
      </SharedCard>
    </div>
  );
};

const ContainerCard = ({ container }: { container: K8sContainerSpec }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
    <p className="text-sm font-semibold text-slate-900 dark:text-white">
      {container.name ?? "container"}
    </p>
    <p className="text-xs text-slate-500">
      {container.image ?? "image not specified"}
    </p>
    <p className="mt-2 text-xs text-slate-500">
      Args: {container.args?.length ?? 0} · Env: {container.env?.length ?? 0} ·
      Mounts: {container.volumeMounts?.length ?? 0}
    </p>
  </div>
);
