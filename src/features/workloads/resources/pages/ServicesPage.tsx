import { useCallback, useMemo } from "react";
import type { K8sService } from "@/types/k8s";
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

type ServiceRow = {
  id: string;
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: number;
  selectorCount: number;
  age: string;
  ageValue: number;
  raw: K8sService;
};

const getServiceId = (service: K8sService) =>
  service.metadata?.uid ??
  `${service.metadata?.namespace ?? "default"}-${
    service.metadata?.name ?? "unknown"
  }`;

const mapServiceToRow = (service: K8sService): ServiceRow => {
  const meta = service.metadata ?? {};
  const spec = service.spec ?? {};
  const ports = spec.ports ?? [];
  const selectorCount = spec.selector ? Object.keys(spec.selector).length : 0;

  return {
    id: getServiceId(service),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    type: spec.type ?? "ClusterIP",
    clusterIP: spec.clusterIP ?? "n/a",
    ports: ports.length,
    selectorCount,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: service,
  };
};

export const ServicesPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const fetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sServices(params),
    []
  );

  const {
    items: services,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource<K8sService>(fetcher, getServiceId);

  const rows = useMemo(
    () => services.map((service) => mapServiceToRow(service)),
    [services]
  );

  const totalCount = total || services.length;

  const columns: TableColumn<ServiceRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Service",
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
        key: "type",
        label: "Type",
      },
      {
        key: "clusterIP",
        label: "Cluster IP",
      },
      {
        key: "ports",
        label: "Ports",
        align: "center",
        sortAccessor: (row) => row.ports,
      },
      {
        key: "selectorCount",
        label: "Selectors",
        align: "center",
        render: (row) => (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {row.selectorCount}
          </span>
        ),
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
  const detailSpec = selected?.spec ?? {};
  const detailStatus = selected?.status ?? {};
  const ports = detailSpec.ports ?? [];
  const selectors = detailSpec.selector ?? {};
  const loadBalancers = detailStatus.loadBalancer?.ingress ?? [];
  const svcName = detailMeta.name ?? "service";
  const svcNs = detailMeta.namespace ?? "default";
  const serviceCommands = [
    {
      title: "Create",
      commands: [
        `kubectl expose deployment ${svcName} --port=<port> --type=<type> -n ${svcNs}`,
        "kubectl apply -f service.yaml",
      ],
    },
    {
      title: "Delete",
      commands: [`kubectl delete svc ${svcName} -n ${svcNs}`],
    },
    {
      title: "Modify",
      commands: [`kubectl patch svc ${svcName} -n ${svcNs} -p '<json>'`],
    },
    {
      title: "View",
      commands: [
        `kubectl get svc ${svcName} -n ${svcNs}`,
        `kubectl describe svc ${svcName} -n ${svcNs}`,
      ],
    },
    {
      title: "Debug",
      commands: [
        `kubectl get endpoints ${svcName} -n ${svcNs}`,
        `kubectl describe endpoints ${svcName} -n ${svcNs}`,
        `kubectl get events -n ${svcNs}`,
      ],
    },
    {
      title: "Logs",
      commands: [
        `kubectl logs -l app=${svcName} --all-containers=true -n ${svcNs}`,
      ],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title="Services"
        description="Service endpoints, selectors, and load balancer ingress."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.services") },
        ]}
      />

      <Table<ServiceRow>
        title="Services"
        subtitle="Select a service to inspect ports and selectors."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No services found."
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
            ? `${detailMeta.namespace ?? "default"}/${detailMeta.name ?? "svc"}`
            : "Select a service"
        }
        subtitle="Ports, selectors, and load balancer status."
        isLoading={isLoading && !selected}
      >
        {selected ? (
          <>
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Type
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {detailSpec.type ?? "ClusterIP"}
                  </p>
                  <p className="text-xs text-slate-500">
                    ClusterIP: {detailSpec.clusterIP ?? "n/a"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Session Affinity
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {detailSpec.sessionAffinity ?? "None"}
                  </p>
                  <p className="text-xs text-slate-500">
                    External IPs: {detailSpec.externalIPs?.join(", ") ?? "none"}
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Ports
                  </h3>
                  <span className="text-xs text-slate-500">
                    {ports.length} defined
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {ports.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No ports configured.
                    </p>
                  )}
                  {ports.map((port, index) => (
                    <div
                      key={`${port.port ?? "port"}-${index}`}
                      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {port.name ?? `Port ${port.port ?? index + 1}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {port.protocol ?? "TCP"} {port.port}
                        {port.targetPort ? ` → ${port.targetPort}` : ""}{" "}
                        {port.nodePort ? ` (node ${port.nodePort})` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Selector
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectors && Object.keys(selectors).length ? (
                      Object.entries(selectors).map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                        >
                          {key}: {value}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No selector recorded.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Load balancer
                  </p>
                  <div className="mt-2 space-y-2">
                    {loadBalancers.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No ingress endpoints reported.
                      </p>
                    )}
                    {loadBalancers.map((ingress, index) => (
                      <div
                        key={`${
                          ingress.hostname ?? ingress.ip ?? "lb"
                        }-${index}`}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                      >
                        {ingress.hostname ?? ingress.ip ?? "endpoint"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <CommandSection
              heading="Kubectl Commands"
              groups={serviceCommands}
            />
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Select a service from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
