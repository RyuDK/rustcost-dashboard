import { useMemo } from "react";
import type { K8sNode } from "@/types/k8s";
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

type NodeRow = {
  id: string;
  name: string;
  status: string;
  cpu: string;
  memory: string;
  pods: string;
  age: string;
  ageValue: number;
  raw: K8sNode;
};

const getNodeId = (node: K8sNode) =>
  node.metadata?.uid ?? node.metadata?.name ?? "unknown-node";

const getReadyStatus = (node: K8sNode) =>
  node.status?.conditions?.find((c) => c.type === "Ready")?.status ?? "Unknown";

const mapNodeToRow = (node: K8sNode): NodeRow => {
  const meta = node.metadata ?? {};
  const status = node.status ?? {};
  const capacity = status.capacity ?? {};

  return {
    id: getNodeId(node),
    name: meta.name ?? "unknown",
    status: getReadyStatus(node),
    cpu: capacity.cpu ?? "n/a",
    memory: capacity.memory ?? "n/a",
    pods: capacity.pods ?? "n/a",
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: node,
  };
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase();
  const isReady = normalized === "true";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isReady
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200"
          : "bg-[color:var(--primary)]/10 text-[var(--primary)]"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

export const NodesPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const {
    items: nodes,
    selected: selectedNode,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource(infoApi.fetchK8sLiveNodes, getNodeId);

  const rows = useMemo(() => nodes.map((node) => mapNodeToRow(node)), [nodes]);

  const columns: TableColumn<NodeRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Node",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelected(row.raw)}
            className="text-left"
          >
            <p className="text-sm font-semibold text-slate-900 underline decoration-[color:var(--primary)] decoration-2 underline-offset-4 dark:text-white">
              {row.name}
            </p>
            <p className="text-xs text-slate-500">uid/{row.id}</p>
          </button>
        ),
        sortAccessor: (row) => row.name,
      },
      {
        key: "status",
        label: "Ready",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "cpu",
        label: "CPU",
      },
      {
        key: "memory",
        label: "Memory",
      },
      {
        key: "pods",
        label: "Pods",
        align: "center",
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

  const totalCount = total || nodes.length;
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

  const meta = selectedNode?.metadata ?? {};
  const status = selectedNode?.status ?? {};
  const capacity = status.capacity ?? {};
  const allocatable = status.allocatable ?? {};
  const labels = meta.labels ?? {};
  const annotations = meta.annotations ?? {};
  const addresses = status.addresses ?? [];
  const conditions = status.conditions ?? [];
  const nodeInfo = status.nodeInfo ?? {};

  const nodeName = meta.name ?? "node";
  const readyStatus = getReadyStatus(selectedNode ?? {});

  const nodeCommands = [
    {
      title: "Inspect",
      commands: [
        `kubectl get node ${nodeName}`,
        `kubectl describe node ${nodeName}`,
        `kubectl get events --field-selector involvedObject.kind=Node,involvedObject.name=${nodeName}`,
      ],
    },
    {
      title: "Cordon/Drain",
      commands: [
        `kubectl cordon ${nodeName}`,
        `kubectl drain ${nodeName} --ignore-daemonsets --delete-emptydir-data`,
      ],
    },
    {
      title: "Uncordon",
      commands: [`kubectl uncordon ${nodeName}`],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Nodes"
        description="Live Kubernetes nodes with readiness, capacity, and allocatable resources."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.nodes") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Sort and page through nodes to spot readiness issues. Selecting a row
        surfaces capacity, labels, and kubectl commands for troubleshooting.
      </ExplainHint>

      <Table<NodeRow>
        title="Node Inventory"
        subtitle="Select a node to inspect capacity, labels, and conditions."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No nodes found."
        rowKey={(row) => row.id}
        actions={paginationControls}
      />

      <SharedCard
        title={selectedNode ? meta.name ?? "node" : "Select a node"}
        subtitle="Capacity, allocatable resources, labels, and node conditions."
        isLoading={isLoading && !selectedNode}
      >
        {selectedNode ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Ready
                </p>
                <div className="mt-1">
                  <StatusBadge status={readyStatus} />
                </div>
                <p className="text-xs text-slate-500">
                  Created: {formatAge(meta.creationTimestamp)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  CPU
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {capacity.cpu ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Allocatable: {allocatable.cpu ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Memory
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {capacity.memory ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Allocatable: {allocatable.memory ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Pods
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {capacity.pods ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Allocatable: {allocatable.pods ?? "n/a"}
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
                        className="rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]"
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
                  Addresses
                </h3>
                <span className="text-xs text-slate-500">
                  {addresses.length} reported
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.length === 0 && (
                  <p className="text-sm text-slate-500">No addresses found.</p>
                )}
                {addresses.map((addr) => (
                  <div
                    key={`${addr.type}-${addr.address}`}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {addr.type ?? "Address"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {addr.address ?? "unknown"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Conditions
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
                {conditions.map((condition) => (
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
                  Node Info
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    OS / Kernel
                  </p>
                  <p className="text-xs text-slate-500">
                    {nodeInfo.osImage ?? "n/a"} ·{" "}
                    {nodeInfo.kernelVersion ?? "n/a"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Kubelet / Proxy
                  </p>
                  <p className="text-xs text-slate-500">
                    {nodeInfo.kubeletVersion ?? "n/a"} ·{" "}
                    {nodeInfo.kubeProxyVersion ?? "n/a"}
                  </p>
                </div>
              </div>
            </div>

            <CommandSection heading="Kubectl Commands" groups={nodeCommands} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a node from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
