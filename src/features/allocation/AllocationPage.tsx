import { useCallback, useEffect, useMemo, useState } from "react";
import { infoApi } from "@/shared/api";
import { request } from "@/shared/api/http";
import { SharedPageLayout } from "@/shared/components/layout/SharedPageLayout";
import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { useI18n } from "@/app/providers/i18n/useI18n";

interface ApiResponse<T> {
  data?: T;
  is_successful?: boolean;
  error_msg?: string;
}

interface ResourceRef {
  name: string;
  namespace?: string;
  kind: string;
  team?: string;
  service?: string;
  env?: string;
  labels?: Record<string, string>;
}

interface OwnershipRecord {
  workload?: string;
  owner?: string;
}

export const AllocationPage = () => {
  const { t } = useI18n();

  const [resources, setResources] = useState<ResourceRef[]>([]);
  const [ownership, setOwnership] = useState<Record<string, OwnershipRecord>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [podsRes, deploymentsRes, containersRes] = await Promise.all([
        infoApi.fetchInfoK8sPods(),
        infoApi.fetchK8sDeployments({ limit: 100, offset: 0 }),
        infoApi.fetchInfoK8sContainers(),
      ]);

      const pods = (podsRes.data ?? []).map((item) => ({
        name: item.podName ?? item.podUid ?? "pod",
        namespace: item.namespace,
        kind: "Pod" as const,
        team: item.team,
        service: item.service,
        env: item.env,
        labels: item.label ? { raw: item.label } : undefined,
      }));

      const deployments = (deploymentsRes.data?.items ?? []).map(
        (deployment) => {
          const meta = deployment.metadata ?? {};
          const labels = meta.labels ?? {};
          return {
            name: meta.name ?? "deployment",
            namespace: meta.namespace,
            kind: "Deployment" as const,
            team: labels.team,
            service: labels.service,
            env: labels.env,
            labels,
          };
        }
      );

      const containerItems = (containersRes.data ?? []).map((item, index) => ({
        name: item.containerName ?? `container-${index}`,
        namespace: item.namespace,
        kind: "Container" as const,
        team: item.team,
        service: item.service,
        env: item.env,
        labels: item.labels ? { raw: item.labels } : undefined,
      }));

      const combined = [...pods, ...deployments, ...containerItems];

      setResources(combined);
      setOwnership(
        combined.reduce<Record<string, OwnershipRecord>>((acc, resource) => {
          const key = `${resource.namespace ?? "default"}/${resource.name}`;
          acc[key] = {
            workload: resource.labels?.workload ?? undefined,
            owner: resource.team ?? resource.labels?.team ?? undefined,
          };
          return acc;
        }, {})
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load allocation data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const allocationSummary = useMemo(() => {
    const teams = new Map<string, number>();
    resources.forEach((resource) => {
      const team = resource.team ?? resource.labels?.team ?? "unassigned";
      teams.set(team, (teams.get(team) ?? 0) + 1);
    });
    return Array.from(teams.entries()).map(([team, count]) => ({
      team,
      count,
    }));
  }, [resources]);

  const allocationState = useMemo(
    () => ({
      resources,
      ownership,
      allocationSummary,
      isLoading,
      error,
    }),
    [allocationSummary, error, isLoading, ownership, resources]
  );

  useEffect(() => {
    // Placeholder effect for allocation state observers
  }, [allocationState]);

  return (
    <SharedPageLayout>
      <SharedPageHeader
        eyebrow=""
        title="Resource Assignment Center"
        description="Review which workloads own pods, deployments, and containers. Reassign
          ownership to keep governance metadata current."
        breadcrumbItems={[{ label: t("nav.allocation") }]}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {allocationSummary.map((team) => (
          <div
            key={team.team}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {team.team}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {team.count} resources
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Resource Inventory
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {resources.length} resource(s) tracked.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadResources()}
            className="inline-flex items-center justify-center rounded-full border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:border-amber-600 hover:text-amber-700 dark:text-amber-300"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-3 p-6">
          {isLoading && (
            <p className="text-sm text-slate-500">Loading resources…</p>
          )}
          {!isLoading && resources.length === 0 && (
            <p className="text-sm text-slate-500">No resources discovered.</p>
          )}
          {resources.slice(0, 20).map((resource) => (
            <div
              key={`${resource.kind}-${resource.namespace ?? "default"}-${
                resource.name
              }`}
              className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {resource.name}
                </p>
                <p className="text-xs text-slate-500">
                  {resource.kind} · namespace {resource.namespace ?? "default"}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Team: {resource.team ?? "—"}</p>
                <p>Service: {resource.service ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AllocationOverview />

      <div className="grid gap-4 lg:grid-cols-2">
        <AssignResourceModal />
        <DeallocateResourceModal />
      </div>
    </SharedPageLayout>
  );
};

export function AllocationOverview() {
  const [nodeAllocations, setNodeAllocations] = useState<
    Array<{ node: string; workloadCount: number }>
  >([]);
  const [allocationHealth, setAllocationHealth] = useState<{
    overAllocated: number;
    underAllocated: number;
  }>({
    overAllocated: 0,
    underAllocated: 0,
  });

  const loadOverview = useCallback(async () => {
    const [nodesRes, podsRes] = await Promise.all([
      infoApi.fetchInfoK8sNodes(),
      infoApi.fetchInfoK8sPods(),
    ]);

    const nodeUsage = new Map<string, number>();
    (podsRes.data ?? []).forEach((pod) => {
      const node = pod.nodeName ?? "unassigned";
      nodeUsage.set(node, (nodeUsage.get(node) ?? 0) + 1);
    });

    setNodeAllocations(
      (nodesRes.data ?? []).map((node) => ({
        node: node.node_name ?? "unknown",
        workloadCount: nodeUsage.get(node.node_name ?? "unknown") ?? 0,
      }))
    );

    const overAllocated = Array.from(nodeUsage.values()).filter(
      (count) => count > 50
    ).length;
    const underAllocated = Array.from(nodeUsage.values()).filter(
      (count) => count < 5
    ).length;
    setAllocationHealth({ overAllocated, underAllocated });
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const overviewState = useMemo(
    () => ({
      nodeAllocations,
      allocationHealth,
    }),
    [allocationHealth, nodeAllocations]
  );

  useEffect(() => {
    // Placeholder effect for overview data
  }, [overviewState]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Node Allocation Overview
        </h2>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Over: {allocationHealth.overAllocated} · Under:{" "}
          {allocationHealth.underAllocated}
        </p>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Distribution of workloads per node to identify hot spots or
        underutilized nodes.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {nodeAllocations.slice(0, 6).map((allocation) => (
          <div
            key={allocation.node}
            className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {allocation.node}
            </p>
            <p className="text-xs text-slate-500">
              {allocation.workloadCount} workload(s) scheduled
            </p>
            <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{
                  width: `${Math.min(allocation.workloadCount, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AssignResourceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [availableResources, setAvailableResources] = useState<ResourceRef[]>(
    []
  );
  const [workloads, setWorkloads] = useState<string[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [selectedWorkload, setSelectedWorkload] = useState<string | null>(null);

  const loadSelectableResources = useCallback(async () => {
    if (!isOpen) {
      return;
    }
    const [podsRes, deploymentsRes] = await Promise.all([
      infoApi.fetchInfoK8sPods(),
      infoApi.fetchK8sDeployments({ limit: 100, offset: 0 }),
    ]);
    const pods = (podsRes.data ?? []).map((item) => ({
      ...item,
      kind: "Pod" as const,
      name: item.podName ?? item.podUid ?? "pod",
    }));
    const deployments = (deploymentsRes.data?.items ?? []).map(
      (deployment) => ({
        name: deployment.metadata?.name ?? "deployment",
        namespace: deployment.metadata?.namespace,
        kind: "Deployment" as const,
      })
    );
    const combined = [...pods, ...deployments];
    setAvailableResources(combined);
    const workloadCandidates = combined
      .map((item) => item.labels?.workload)
      .filter((id): id is string => Boolean(id));
    setWorkloads(workloadCandidates);
    if (!selectedResource && combined.length) {
      setSelectedResource(`${combined[0].kind}:${combined[0].name}`);
    }
    if (!selectedWorkload && workloadCandidates.length) {
      setSelectedWorkload(workloadCandidates[0]);
    }
  }, [isOpen, selectedResource, selectedWorkload]);

  useEffect(() => {
    void loadSelectableResources();
  }, [loadSelectableResources]);

  const assignResource = useCallback(async () => {
    if (!selectedResource || !selectedWorkload) {
      return;
    }
    await request<ApiResponse<unknown>>({
      method: "POST",
      url: "/allocation/assign",
      data: { resource: selectedResource, workload: selectedWorkload },
    });
    setIsOpen(false);
  }, [selectedResource, selectedWorkload]);

  useEffect(() => {
    // Placeholder effect for invoking assignment handler
  }, [assignResource]);

  const assignState = useMemo(
    () => ({
      availableResources,
      workloads,
      selectedResource,
      selectedWorkload,
      isOpen,
    }),
    [availableResources, isOpen, selectedResource, selectedWorkload, workloads]
  );

  useEffect(() => {
    // Placeholder effect for assign modal state
  }, [assignState]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Assign Resource
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Map pods or deployments to a workload record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-600 hover:text-emerald-700 dark:text-emerald-300"
        >
          Assign
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Resource
            </label>
            <select
              value={selectedResource ?? ""}
              onChange={(event) => setSelectedResource(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="" disabled>
                Select resource
              </option>
              {availableResources.map((resource) => (
                <option
                  key={`${resource.kind}:${resource.name}`}
                  value={`${resource.kind}:${resource.name}`}
                >
                  {resource.kind} · {resource.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Workload
            </label>
            <select
              value={selectedWorkload ?? ""}
              onChange={(event) => setSelectedWorkload(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="" disabled>
                Select workload
              </option>
              {workloads.map((workload) => (
                <option key={workload} value={workload}>
                  {workload}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => assignResource()}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeallocateResourceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [assignedResources, setAssignedResources] = useState<
    Array<{ id: string; workload: string }>
  >([]);
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(
    null
  );

  const loadAssignments = useCallback(async () => {
    if (!isOpen) {
      return;
    }
    const res = await request<
      ApiResponse<Array<{ resource_id: string; workload: string }>>
    >({
      method: "GET",
      url: "/allocation/list",
    });
    const formatted = (res.data ?? []).map((record) => ({
      id: record.resource_id,
      workload: record.workload,
    }));
    setAssignedResources(formatted);
    if (!selectedAllocation && formatted.length) {
      setSelectedAllocation(formatted[0].id);
    }
  }, [isOpen, selectedAllocation]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const deallocate = useCallback(async () => {
    if (!selectedAllocation) {
      return;
    }
    await request<ApiResponse<unknown>>({
      method: "POST",
      url: "/allocation/deallocate",
      data: { resource: selectedAllocation },
    });
    setIsOpen(false);
  }, [selectedAllocation]);

  useEffect(() => {
    // Placeholder effect for invoking deallocation handler
  }, [deallocate]);

  const modalState = useMemo(
    () => ({
      assignedResources,
      isOpen,
      selectedAllocation,
    }),
    [assignedResources, isOpen, selectedAllocation]
  );

  useEffect(() => {
    // Placeholder effect for deallocation modal state
  }, [modalState]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[var(--surface-dark)]/40">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Deallocate Resource
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Remove stale ownership mappings from workloads.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-600 hover:text-red-700 dark:text-red-300"
        >
          Deallocate
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Allocation
            </label>
            <select
              value={selectedAllocation ?? ""}
              onChange={(event) => setSelectedAllocation(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="" disabled>
                Select allocation
              </option>
              {assignedResources.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.id} · {record.workload}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deallocate()}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
