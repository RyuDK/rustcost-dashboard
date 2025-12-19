import { useCallback, useMemo } from "react";
import type { K8sIngress } from "@/types/k8s";
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

type IngressRow = {
  id: string;
  name: string;
  namespace: string;
  className: string;
  hosts: string;
  rules: number;
  tls: number;
  age: string;
  ageValue: number;
  raw: K8sIngress;
};

const getIngressId = (ingress: K8sIngress) =>
  ingress.metadata?.uid ??
  `${ingress.metadata?.namespace ?? "default"}-${
    ingress.metadata?.name ?? "unknown"
  }`;

const mapIngressToRow = (ingress: K8sIngress): IngressRow => {
  const meta = ingress.metadata ?? {};
  const spec = ingress.spec ?? {};
  const rules = spec.rules ?? [];
  const hosts = rules
    .map((rule) => rule.host)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return {
    id: getIngressId(ingress),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    className: spec.ingressClassName ?? "n/a",
    hosts: hosts || "n/a",
    rules: rules.length,
    tls: spec.tls?.length ?? 0,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: ingress,
  };
};

export const IngressesPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);
  const showExplain = useAppSelector((state) => state.preferences.showExplain);

  const fetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sIngresses(params),
    []
  );

  const {
    items: ingresses,
    selected,
    setSelected,
    pageSize,
    setPageSize,
    offset,
    setOffset,
    total,
    isLoading,
    error,
  } = usePaginatedResource<K8sIngress>(fetcher, getIngressId);

  const rows = useMemo(
    () => ingresses.map((ingress) => mapIngressToRow(ingress)),
    [ingresses]
  );

  const totalCount = total || ingresses.length;

  const columns: TableColumn<IngressRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Ingress",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelected(row.raw)}
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
        key: "className",
        label: "Class",
      },
      {
        key: "hosts",
        label: "Hosts",
        render: (row) => (
          <p className="truncate text-xs text-slate-600 dark:text-slate-300">
            {row.hosts}
          </p>
        ),
      },
      {
        key: "rules",
        label: "Rules",
        align: "center",
        sortAccessor: (row) => row.rules,
      },
      {
        key: "tls",
        label: "TLS",
        align: "center",
        sortAccessor: (row) => row.tls,
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
  const rules = detailSpec.rules ?? [];
  const tlsEntries = detailSpec.tls ?? [];
  const loadBalancers = detailStatus.loadBalancer?.ingress ?? [];
  const ingressName = detailMeta.name ?? "ingress";
  const ingressNs = detailMeta.namespace ?? "default";
  const ingressCommands = [
    {
      title: "Create",
      commands: ["kubectl apply -f ingress.yaml"],
    },
    {
      title: "Delete",
      commands: [`kubectl delete ingress ${ingressName} -n ${ingressNs}`],
    },
    {
      title: "Modify",
      commands: [
        `kubectl patch ingress ${ingressName} -n ${ingressNs} -p '<json>'`,
      ],
    },
    {
      title: "View",
      commands: [
        `kubectl get ingress ${ingressName} -n ${ingressNs}`,
        `kubectl describe ingress ${ingressName} -n ${ingressNs}`,
      ],
    },
    {
      title: "Debug",
      commands: [
        `kubectl get events -n ${ingressNs}`,
        `kubectl describe ingress ${ingressName} -n ${ingressNs}`,
      ],
    },
    {
      title: "Logs",
      commands: [
        "kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx",
      ],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title="Ingresses"
        description="Ingress resources with routing rules and TLS coverage."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.ingresses") },
        ]}
      />

      <ExplainHint visible={showExplain}>
        Review ingress hosts, paths, and backend services. Selecting a row
        surfaces rules and kubectl commands to inspect live routing.
      </ExplainHint>

      <Table<IngressRow>
        title="Ingresses"
        subtitle="Select an ingress to inspect rules, backends, and status."
        data={rows}
        columns={columns}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyMessage="No ingresses found."
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
            ? `${detailMeta.namespace ?? "default"}/${
                detailMeta.name ?? "ingress"
              }`
            : "Select an ingress"
        }
        subtitle="Rules, TLS secrets, and load balancer endpoints."
        isLoading={isLoading && !selected}
      >
        {selected ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Class
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {detailSpec.ingressClassName ?? "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  Default backend:{" "}
                  {detailSpec.defaultBackend?.service?.name ?? "n/a"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Rules
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {rules.length}
                </p>
                <p className="text-xs text-slate-500">
                  TLS: {tlsEntries.length} secrets
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
                  Rules
                </h3>
                <span className="text-xs text-slate-500">
                  {rules.length} defined
                </span>
              </div>
              <div className="space-y-3">
                {rules.length === 0 && (
                  <p className="text-sm text-slate-500">No rules configured.</p>
                )}
                {rules.map((rule, index) => (
                  <div
                    key={`${rule.host ?? "host"}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {rule.host ?? "All hosts"}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {rule.http?.paths?.map((path, pathIndex) => (
                        <div key={`${path.path ?? "/"}-${pathIndex}`}>
                          <span className="font-semibold">
                            {path.path ?? "/"} ({path.pathType ?? "Prefix"}):
                          </span>{" "}
                          {path.backend?.service?.name ?? "backend n/a"}
                          {path.backend?.service?.port?.number
                            ? `:${path.backend.service.port.number}`
                            : ""}
                          {path.backend?.service?.port?.name
                            ? `:${path.backend.service.port.name}`
                            : ""}
                        </div>
                      )) ?? <span>No HTTP paths</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  TLS
                </p>
                <div className="mt-2 space-y-2">
                  {tlsEntries.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No TLS secrets configured.
                    </p>
                  )}
                  {tlsEntries.map((entry, index) => (
                    <div
                      key={`${entry.secretName ?? "tls"}-${index}`}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    >
                      <p className="font-semibold">
                        Secret: {entry.secretName ?? "n/a"}
                      </p>
                      <p>Hosts: {entry.hosts?.join(", ") ?? "n/a"}</p>
                    </div>
                  ))}
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
                      key={`${ingress.hostname ?? ingress.ip ?? "lb"}-${index}`}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    >
                      {ingress.hostname ?? ingress.ip ?? "endpoint"}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <CommandSection
              heading="Kubectl Commands"
              groups={ingressCommands}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select an ingress from the table to view details.
          </p>
        )}
      </SharedCard>
    </SharedPageLayout>
  );
};
