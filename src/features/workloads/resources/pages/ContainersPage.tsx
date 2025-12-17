import { useMemo } from "react";
import { infoApi } from "@/shared/api";
import type { InfoContainer } from "@/shared/api/info/k8s/container/dto";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedCard } from "@/shared/components/metrics/SharedCard";
import { Table, type TableColumn } from "@/shared/components/Table";
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

type ContainerRow = {
  id: string;
  name: string;
  podName: string;
  namespace: string;
  status: string;
  ready: boolean | undefined;
  restarts: number;
  node: string;
  age: string;
  ageValue: number;
  raw: InfoContainer;
};

const getContainerId = (container: InfoContainer) =>
  container.containerId ?? container.containerName ?? "unknown-container";

const mapContainerToRow = (container: InfoContainer): ContainerRow => {
  const ready = container.ready;
  const status = container.state ?? "Unknown";

  return {
    id: getContainerId(container),
    name: container.containerName ?? "container",
    podName: container.podName ?? "pod",
    namespace: container.namespace ?? "default",
    status,
    ready,
    restarts: container.restartCount ?? 0,
    node: container.nodeName ?? "n/a",
    age: formatAge(container.startTime ?? container.creationTimestamp),
    ageValue: container.startTime
      ? Date.parse(container.startTime)
      : container.creationTimestamp
        ? Date.parse(container.creationTimestamp)
        : 0,
    raw: container,
  };
};

const StatusBadge = ({
  status,
  ready,
}: {
  status: string;
  ready?: boolean;
}) => {
  const normalized = status.toLowerCase();
  const isHealthy = ready ?? normalized === "running";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isHealthy
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

const pillList = (items: string[], color: "amber" | "slate" = "slate") =>
  items.map((item) => (
    <span
      key={item}
      className={`rounded-full ${
        color === "amber"
          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
      } px-3 py-1 text-xs font-semibold`}
    >
      {item}
    </span>
  ));

export const ContainersPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const {
    items: containers,
    selected: selectedContainer,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource(infoApi.fetchK8sLiveContainers, getContainerId);

  const rows = useMemo(
    () => containers.map((container) => mapContainerToRow(container)),
    [containers]
  );

  const columns: TableColumn<ContainerRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Container",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelected(row.raw)}
            className="text-left"
          >
            <p className="text-sm font-semibold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-white">
              {row.name}
            </p>
            <p className="text-xs text-slate-500">
              {row.podName} · ns/{row.namespace}
            </p>
          </button>
        ),
        sortAccessor: (row) => row.name,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <StatusBadge status={row.status} ready={row.ready} />,
      },
      {
        key: "restarts",
        label: "Restarts",
        align: "center",
        sortAccessor: (row) => row.restarts,
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

  const totalCount = total || containers.length;
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

  const container = selectedContainer;
  const mounts = container?.volumeMounts ?? [];
  const labels =
    container?.labels?.split(",").map((item) => item.trim()).filter(Boolean) ??
    [];

  const containerName = container?.containerName ?? "container";
  const podName = container?.podName ?? "pod";
  const namespace = container?.namespace ?? "default";
  const nodeName = container?.nodeName ?? "node";

  const kubectlCommands = [
    {
      title: "Logs",
      commands: [
        `kubectl logs ${podName} -c ${containerName} -n ${namespace}`,
        `kubectl logs ${podName} -c ${containerName} -n ${namespace} --previous`,
      ],
    },
    {
      title: "Exec",
      commands: [
        `kubectl exec -it ${podName} -c ${containerName} -n ${namespace} -- /bin/sh`,
      ],
    },
    {
      title: "Describe",
      commands: [
        `kubectl describe pod ${podName} -n ${namespace}`,
        `kubectl get pod ${podName} -n ${namespace} -o yaml`,
      ],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Containers"
        description="Live Kubernetes containers with readiness, restart count, and placement."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.containers") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Browse containers in real time. Select a row to view runtime details,
        labels, mounts, IDs, and ready-to-run kubectl commands.
      </ExplainHint>

      <Table<ContainerRow>
        title="Container Inventory"
        subtitle="Select a container to view metadata and runtime status."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No containers found."
        rowKey={(row) => row.id}
        actions={paginationControls}
      />

      <SharedCard
        title={
          container
            ? `${namespace}/${podName}/${containerName}`
            : "Select a container"
        }
        subtitle="Container runtime details, mounts, and identifiers."
        isLoading={isLoading && !container}
      >
        {container ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-1">
                  <StatusBadge
                    status={container.state ?? "Unknown"}
                    ready={container.ready ?? undefined}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Restarts: {container.restartCount ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Image
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {container.image ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  ID: {container.imageId ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Node / IPs
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {nodeName}
                </p>
                <p className="text-xs text-slate-500">
                  Pod IP: {container.podIp ?? "n/a"} · Host IP:{" "}
                  {container.hostIp ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Timing
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Started {formatAge(container.startTime)}
                </p>
                <p className="text-xs text-slate-500">
                  Created: {container.creationTimestamp ?? "n/a"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Labels
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {labels.length ? (
                  pillList(labels, "amber")
                ) : (
                  <p className="text-sm text-slate-500">No labels set.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Volume mounts
                </h3>
                <span className="text-xs text-slate-500">
                  {mounts.length} reported
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mounts.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No volume mounts recorded.
                  </p>
                )}
                {pillList(mounts)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  IDs
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Container ID
                  </p>
                  <p className="text-xs text-slate-500">
                    {container.containerId ?? "n/a"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Pod UID
                  </p>
                  <p className="text-xs text-slate-500">
                    {container.podUid ?? "n/a"}
                  </p>
                </div>
              </div>
            </div>

            <CommandSection heading="Kubectl Commands" groups={kubectlCommands} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a container from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
