import { useCallback, useEffect, useMemo, useState } from "react";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { SharedCard } from "@/shared/components/metrics/SharedCard";
import { Table, type TableColumn } from "@/shared/components/Table";
import { infoApi } from "@/shared/api";
import type {
  K8sCondition,
  K8sContainerSpec,
  K8sDeployment,
} from "@/types/k8s";
import { CommandSection } from "../components/CommandSection";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { useParams } from "react-router-dom";
import {
  normalizeLanguageCode,
  buildLanguagePrefix,
} from "@/constants/language";
import { ExplainHint } from "@/shared/components/ExplainHint";
import { useAppSelector } from "@/store/hook";

type DeploymentRow = {
  id: string;
  name: string;
  namespace: string;
  readiness: string;
  updated: number;
  available: number;
  age: string;
  ageValue: number;
  strategy: string;
  image: string;
  raw: K8sDeployment;
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const formatAge = (timestamp?: string) => {
  if (!timestamp) {
    return "n/a";
  }
  const created = Date.parse(timestamp);
  if (Number.isNaN(created)) {
    return "n/a";
  }
  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const getDeploymentId = (deployment: K8sDeployment) =>
  deployment.metadata?.uid ??
  `${deployment.metadata?.namespace ?? "default"}-${
    deployment.metadata?.name ?? "unknown"
  }`;

const mapDeploymentToRow = (deployment: K8sDeployment): DeploymentRow => {
  const meta = deployment.metadata ?? {};
  const spec = deployment.spec ?? {};
  const status = deployment.status ?? {};

  const replicas = spec.replicas ?? status.replicas ?? 0;
  const ready = status.readyReplicas ?? 0;
  const available = status.availableReplicas ?? 0;
  const image =
    spec.template?.spec?.containers?.[0]?.image ??
    spec.template?.spec?.containers?.[0]?.name ??
    "n/a";

  return {
    id: getDeploymentId(deployment),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    readiness: `${ready}/${replicas}`,
    updated: status.updatedReplicas ?? 0,
    available,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    strategy: spec.strategy?.type ?? "RollingUpdate",
    image,
    raw: deployment,
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
            : "bg-[color:var(--primary)]/10 text-[var(--primary)]"
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

export const DeploymentsPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);
  const [deployments, setDeployments] = useState<K8sDeployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] =
    useState<K8sDeployment | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount = total || deployments.length;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalCount, 1) / pageSize));

  const loadDeployments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await infoApi.fetchK8sDeployments({
        limit: pageSize,
        offset,
      });

      if (!res.is_successful) {
        throw new Error(res.error_msg ?? "Failed to load deployments");
      }

      const page = res.data;
      const items = page?.items ?? [];
      setDeployments(items);
      setTotal(page?.total ?? items.length);

      const itemIds = new Set(items.map(getDeploymentId));
      setSelectedDeployment((prev) => {
        if (prev && itemIds.has(getDeploymentId(prev))) {
          return prev;
        }
        return items[0] ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch deployments"
      );
    } finally {
      setIsLoading(false);
    }
  }, [offset, pageSize]);

  useEffect(() => {
    void loadDeployments();
  }, [loadDeployments]);

  const rows = useMemo(
    () => deployments.map((deployment) => mapDeploymentToRow(deployment)),
    [deployments]
  );

  const columns: TableColumn<DeploymentRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Deployment",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedDeployment(row.raw)}
            className="text-left"
          >
            <p className="text-sm font-semibold text-slate-900 underline decoration-[color:var(--primary)] decoration-2 underline-offset-4 dark:text-white">
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
        key: "available",
        label: "Available",
        align: "center",
        sortAccessor: (row) => row.available,
      },
      {
        key: "updated",
        label: "Updated",
        align: "center",
        sortAccessor: (row) => row.updated,
      },
      {
        key: "strategy",
        label: "Strategy",
        render: (row) => (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {row.strategy}
          </span>
        ),
      },
      {
        key: "image",
        label: "Image",
        render: (row) => (
          <p className="truncate text-xs text-slate-600 dark:text-slate-300">
            {row.image}
          </p>
        ),
      },
      {
        key: "age",
        label: "Age",
        align: "right",
        sortAccessor: (row) => row.ageValue,
      },
    ],
    []
  );

  const paginationControls = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setOffset((prev) => Math.max(prev - pageSize, 0))}
        disabled={offset === 0 || isLoading}
        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
      >
        Prev
      </button>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() =>
          setOffset((prev) =>
            prev + pageSize < totalCount ? prev + pageSize : prev
          )
        }
        disabled={offset + pageSize >= totalCount || isLoading}
        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
      >
        Next
      </button>
      <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
        Page size
        <select
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
          value={pageSize}
          onChange={(event) => {
            const nextSize = Number(event.target.value);
            setPageSize(nextSize);
            setOffset(0);
          }}
          disabled={isLoading}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const detailMeta = selectedDeployment?.metadata ?? {};
  const detailSpec = selectedDeployment?.spec ?? {};
  const detailStatus = selectedDeployment?.status ?? {};
  const containers = detailSpec.template?.spec?.containers ?? [];
  const conditions = detailStatus.conditions ?? [];

  const deploymentName = detailMeta.name ?? "deployment";
  const deploymentNs = detailMeta.namespace ?? "default";
  const containerName =
    containers[0]?.name ?? containers[0]?.image ?? "container";
  const deploymentCommands = [
    {
      title: "Create",
      commands: [
        `kubectl create deployment ${deploymentName} --image=<image> -n ${deploymentNs}`,
        "kubectl apply -f deployment.yaml",
      ],
    },
    {
      title: "Delete",
      commands: [
        `kubectl delete deployment ${deploymentName} -n ${deploymentNs}`,
      ],
    },
    {
      title: "Modify",
      commands: [
        `kubectl scale deployment ${deploymentName} --replicas=<n> -n ${deploymentNs}`,
        `kubectl set image deployment/${deploymentName} ${containerName}=<image> -n ${deploymentNs}`,
        `kubectl patch deployment ${deploymentName} -n ${deploymentNs} -p '<json>'`,
      ],
    },
    {
      title: "View",
      commands: [
        `kubectl get deployment ${deploymentName} -n ${deploymentNs}`,
        `kubectl describe deployment ${deploymentName} -n ${deploymentNs}`,
        `kubectl get pods -l app=${deploymentName} -n ${deploymentNs}`,
      ],
    },
    {
      title: "Debug",
      commands: [
        `kubectl rollout status deployment/${deploymentName} -n ${deploymentNs}`,
        `kubectl rollout history deployment/${deploymentName} -n ${deploymentNs}`,
        `kubectl rollout undo deployment/${deploymentName} -n ${deploymentNs}`,
        `kubectl get events -n ${deploymentNs}`,
      ],
    },
    {
      title: "Logs",
      commands: [
        `kubectl logs deployment/${deploymentName} -n ${deploymentNs}`,
        `kubectl logs -l app=${deploymentName} --all-containers=true -n ${deploymentNs}`,
      ],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Deployments"
        description="Paginated inventory of Kubernetes deployments with live readiness and rollout metadata."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.deployments") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Page through deployments, sort columns, and pick a row to inspect
        rollout history, container images, and helpful kubectl commands.
      </ExplainHint>

      <Table<DeploymentRow>
        title="Deployment Inventory"
        subtitle="Select a deployment to inspect metadata and status conditions."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No deployments found."
        rowKey={(row) => row.id}
        actions={paginationControls}
      />

      <SharedCard
        title={
          selectedDeployment
            ? `${detailMeta.namespace ?? "default"}/${
                detailMeta.name ?? "deployment"
              }`
            : "Select a deployment"
        }
        subtitle="Details, containers, and rollout signals."
        isLoading={isLoading && !selectedDeployment}
      >
        {selectedDeployment ? (
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
                  Available: {detailStatus.availableReplicas ?? 0} · Updated:{" "}
                  {detailStatus.updatedReplicas ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Strategy
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.strategy?.type ?? "RollingUpdate"}
                </p>
                <p className="text-xs text-slate-500">
                  Max Surge:{" "}
                  {detailSpec.strategy?.rollingUpdate?.maxSurge ?? "default"} ·
                  Max Unavailable:{" "}
                  {detailSpec.strategy?.rollingUpdate?.maxUnavailable ??
                    "default"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatAge(detailMeta.creationTimestamp)}
                </p>
                <p className="text-xs text-slate-500">
                  {detailMeta.creationTimestamp ?? "timestamp unavailable"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Labels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailMeta.labels &&
                  Object.keys(detailMeta.labels).length ? (
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
                    key={`${
                      container.name ?? container.image ?? "container"
                    }-${index}`}
                    container={container}
                  />
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

            <CommandSection
              heading="Kubectl Commands"
              groups={deploymentCommands}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a deployment from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
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
