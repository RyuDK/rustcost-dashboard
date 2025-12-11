import { useCallback, useMemo } from "react";
import type { K8sNamespace } from "@/types/k8s";
import { infoApi } from "@/shared/api";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { Table, type TableColumn } from "@/shared/components/Table";
import { SharedCard } from "@/shared/components/metrics/SharedCard";
import {
  formatAge,
  usePaginatedResource,
} from "../hooks/usePaginatedResource";
import { ResourcePaginationControls } from "../components/ResourcePaginationControls";

type NamespaceRow = {
  id: string;
  name: string;
  phase: string;
  labels: number;
  age: string;
  ageValue: number;
  raw: K8sNamespace;
};

const getNamespaceId = (ns: K8sNamespace) =>
  ns.metadata?.uid ?? ns.metadata?.name ?? "namespace";

const mapNamespaceToRow = (ns: K8sNamespace): NamespaceRow => {
  const meta = ns.metadata ?? {};
  const labels = meta.labels ?? {};

  return {
    id: getNamespaceId(ns),
    name: meta.name ?? "namespace",
    phase: ns.status?.phase ?? "Unknown",
    labels: Object.keys(labels).length,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: ns,
  };
};

export const NamespacesPage = () => {
  const fetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sNamespaces(params),
    []
  );

  const {
    items: namespaces,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource<K8sNamespace>(fetcher, getNamespaceId);

  const rows = useMemo(
    () => namespaces.map((ns) => mapNamespaceToRow(ns)),
    [namespaces]
  );

  const totalCount = total || namespaces.length;

  const columns: TableColumn<NamespaceRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Namespace",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelected(row.raw)}
            className="text-left"
          >
            <p className="text-sm font-semibold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-white">
              {row.name}
            </p>
          </button>
        ),
        sortAccessor: (row) => row.name,
      },
      { key: "phase", label: "Phase" },
      {
        key: "labels",
        label: "Labels",
        align: "center",
        sortAccessor: (row) => row.labels,
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

  const detailMeta = selected?.metadata ?? {};
  const detailStatus = selected?.status ?? {};
  const labelEntries = detailMeta.labels ? Object.entries(detailMeta.labels) : [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <SharedPageHeader
        eyebrow="Resources"
        title="Namespaces"
        description="Cluster namespaces with lifecycle state and labels."
      />

      <Table<NamespaceRow>
        title="Namespaces"
        subtitle="Select a namespace to inspect metadata and phase."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No namespaces found."
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
        title={selected ? detailMeta.name ?? "namespace" : "Select a namespace"}
        subtitle="Labels and lifecycle status."
        isLoading={isLoading && !selected}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Phase
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailStatus.phase ?? "Unknown"}
                </p>
                <p className="text-xs text-slate-500">
                  Created {formatAge(detailMeta.creationTimestamp)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  UID
                </p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white break-all">
                  {detailMeta.uid ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  ResourceVersion: {detailMeta.resourceVersion ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Labels
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {labelEntries.length}
                </p>
                <p className="text-xs text-slate-500">
                  Namespace metadata labels
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Labels
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {labelEntries.length === 0 && (
                  <p className="text-sm text-slate-500">No labels set.</p>
                )}
                {labelEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a namespace from the table to view details.
          </p>
        )}
      </SharedCard>
    </div>
  );
};
