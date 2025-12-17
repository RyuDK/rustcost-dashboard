import { useMemo } from "react";
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
import type { K8sContainerStatus, K8sPod } from "@/types/k8s";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

type PodRow = {
  id: string;
  name: string;
  namespace: string;
  status: string;
  ready: string;
  readyValue: number;
  restartCount: number;
  node: string;
  age: string;
  ageValue: number;
  raw: K8sPod;
};

const getPodId = (pod: K8sPod) =>
  pod.metadata?.uid ??
  `${pod.metadata?.namespace ?? "default"}-${pod.metadata?.name ?? "unknown"}`;

const mapPodToRow = (pod: K8sPod): PodRow => {
  const meta = pod.metadata ?? {};
  const spec = pod.spec ?? {};
  const status = pod.status ?? {};
  const containerStatuses = status.containerStatuses ?? [];
  const readyCount = containerStatuses.filter((c) => c.ready).length;
  const totalContainers =
    containerStatuses.length || spec.containers?.length || 0;
  const restartCount = containerStatuses.reduce(
    (sum, curr) => sum + (curr.restartCount ?? 0),
    0
  );

  return {
    id: getPodId(pod),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    status: status.phase ?? "Unknown",
    ready: `${readyCount}/${totalContainers}`,
    readyValue: readyCount,
    restartCount,
    node: spec.nodeName ?? "n/a",
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: pod,
  };
};

const renderStatusBadge = (phase: string) => {
  const normalized = phase.toLowerCase();
  const isHealthy = normalized === "running" || normalized === "succeeded";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isHealthy
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {phase || "Unknown"}
    </span>
  );
};

const ContainerStatusPill = ({ status }: { status: K8sContainerStatus }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/60">
    <div className="flex items-center justify-between">
      <span className="font-semibold text-slate-900 dark:text-white">
        {status.name ?? "container"}
      </span>
      <span className="text-xs text-slate-500">
        {status.ready ? "Ready" : "Not ready"}
      </span>
    </div>
    <p className="mt-1 truncate text-[11px] text-slate-500">
      {status.image ?? "image not reported"}
    </p>
    <p className="text-[11px] text-slate-500">
      Restarts: {status.restartCount ?? 0}
    </p>
  </div>
);

export const PodsPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const {
    items: pods,
    selected: selectedPod,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource(infoApi.fetchK8sLivePods, getPodId);

  const rows = useMemo(() => pods.map((pod) => mapPodToRow(pod)), [pods]);

  const columns: TableColumn<PodRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Pod",
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
        key: "status",
        label: "Status",
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: "ready",
        label: "Ready",
        align: "center",
        sortAccessor: (row) => row.readyValue,
      },
      {
        key: "restartCount",
        label: "Restarts",
        align: "center",
        sortAccessor: (row) => row.restartCount,
      },
      {
        key: "node",
        label: "Node",
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

  const totalCount = total || pods.length;
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

  const detailMeta = selectedPod?.metadata ?? {};
  const detailSpec = selectedPod?.spec ?? {};
  const detailStatus = selectedPod?.status ?? {};
  const containerStatuses = detailStatus.containerStatuses ?? [];
  const labels = detailMeta.labels ?? {};
  const annotations = detailMeta.annotations ?? {};
  const ownerRefs = detailMeta.ownerReferences ?? [];

  const podName = detailMeta.name ?? "pod";
  const podNs = detailMeta.namespace ?? "default";
  const readyCount = containerStatuses.filter((c) => c.ready).length;
  const totalContainers =
    containerStatuses.length || detailSpec.containers?.length || 0;
  const restartCount = containerStatuses.reduce(
    (sum, curr) => sum + (curr.restartCount ?? 0),
    0
  );

  const podCommands = [
    {
      title: "Inspect",
      commands: [
        `kubectl get pod ${podName} -n ${podNs}`,
        `kubectl describe pod ${podName} -n ${podNs}`,
        `kubectl get events -n ${podNs}`,
      ],
    },
    {
      title: "Logs",
      commands: [
        `kubectl logs ${podName} -n ${podNs}`,
        `kubectl logs ${podName} -n ${podNs} --all-containers=true`,
      ],
    },
    {
      title: "Delete",
      commands: [`kubectl delete pod ${podName} -n ${podNs}`],
    },
    {
      title: "Exec",
      commands: [`kubectl exec -it ${podName} -n ${podNs} -- /bin/sh`],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Pods"
        description="Live Kubernetes pods with readiness, restarts, and node placement."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.pods") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Sort or filter the pod table, then select a row to inspect labels,
        annotations, and kubectl-ready commands for quick debugging.
      </ExplainHint>

      <Table<PodRow>
        title="Pod Inventory"
        subtitle="Select a pod to view container status, labels, and placement."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No pods found."
        rowKey={(row) => row.id}
        actions={paginationControls}
      />

      <SharedCard
        title={
          selectedPod
            ? `${detailMeta.namespace ?? "default"}/${detailMeta.name ?? "pod"}`
            : "Select a pod"
        }
        subtitle="Details, container signals, and pod conditions."
        isLoading={isLoading && !selectedPod}
      >
        {selectedPod ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Phase
                </p>
                <div className="mt-1">{renderStatusBadge(detailStatus.phase ?? "Unknown")}</div>
                <p className="text-xs text-slate-500">
                  Started: {formatAge(detailStatus.startTime)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Containers
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {readyCount} / {totalContainers} ready
                </p>
                <p className="text-xs text-slate-500">
                  Restarts: {restartCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Node
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.nodeName ?? "unscheduled"}
                </p>
                <p className="text-xs text-slate-500">
                  Host IP: {detailStatus.hostIP ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Networking
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailStatus.podIP ?? "pending"}
                </p>
                <p className="text-xs text-slate-500">
                  QoS: {detailStatus.qosClass ?? "n/a"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Labels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(labels).length ? (
                    Object.entries(labels).map(([key, value]) => (
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
                  Annotations
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(annotations).length ? (
                    Object.entries(annotations).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
                      >
                        {key}: {value}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No annotations recorded.
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
                  {containerStatuses.length} reported
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {containerStatuses.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No container status found.
                  </p>
                )}
                {containerStatuses.map((status) => (
                  <ContainerStatusPill
                    key={status.containerID ?? status.name ?? "container"}
                    status={status}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Conditions
                </h3>
                <span className="text-xs text-slate-500">
                  {(detailStatus.conditions ?? []).length} recorded
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(detailStatus.conditions ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">
                    No conditions reported yet.
                  </p>
                )}
                {(detailStatus.conditions ?? []).map((condition) => (
                  <div
                    key={`${condition.type}-${condition.status}-${condition.lastTransitionTime}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {condition.type ?? "Unknown"}
                      </p>
                      <span className="text-xs text-slate-500">
                        {condition.status ?? "n/a"}
                      </span>
                    </div>
                    {condition.reason && (
                      <p className="text-xs text-slate-500">
                        {condition.reason}
                      </p>
                    )}
                    {condition.message && (
                      <p className="mt-1 text-xs text-slate-500">
                        {condition.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Owners
                </h3>
                <span className="text-xs text-slate-500">
                  {ownerRefs.length} linked
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ownerRefs.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No owner references reported.
                  </p>
                )}
                {ownerRefs.map((owner) => (
                  <div
                    key={`${owner.kind}-${owner.name}-${owner.uid}`}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {owner.kind ?? "Owner"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {owner.name ?? "unknown"} ({owner.uid ?? "uid n/a"})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <CommandSection heading="Kubectl Commands" groups={podCommands} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a pod from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
