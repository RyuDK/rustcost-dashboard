import { useCallback, useMemo } from "react";
import type {
  K8sCondition,
  K8sContainerSpec,
  K8sCronJob,
  K8sJob,
} from "@/types/k8s";
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

type JobRow = {
  id: string;
  name: string;
  namespace: string;
  completions: string;
  active: number;
  failed: number;
  age: string;
  ageValue: number;
  raw: K8sJob;
};

type CronJobRow = {
  id: string;
  name: string;
  namespace: string;
  schedule: string;
  suspend: boolean;
  active: number;
  lastSchedule: string;
  lastScheduleValue: number;
  age: string;
  ageValue: number;
  raw: K8sCronJob;
};

const getJobId = (job: K8sJob) =>
  job.metadata?.uid ??
  `${job.metadata?.namespace ?? "default"}-${job.metadata?.name ?? "unknown"}`;

const getCronJobId = (job: K8sCronJob) =>
  job.metadata?.uid ??
  `${job.metadata?.namespace ?? "default"}-${job.metadata?.name ?? "unknown"}`;

const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return "n/a";
  const dt = new Date(timestamp);
  if (Number.isNaN(dt.getTime())) return "n/a";
  return dt.toLocaleString();
};

const mapJobToRow = (job: K8sJob): JobRow => {
  const meta = job.metadata ?? {};
  const spec = job.spec ?? {};
  const status = job.status ?? {};

  const desired = spec.completions ?? spec.parallelism ?? 0;
  const succeeded = status.succeeded ?? 0;

  return {
    id: getJobId(job),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    completions: desired ? `${succeeded}/${desired}` : `${succeeded}`,
    active: status.active ?? 0,
    failed: status.failed ?? 0,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: job,
  };
};

const mapCronJobToRow = (job: K8sCronJob): CronJobRow => {
  const meta = job.metadata ?? {};
  const spec = job.spec ?? {};
  const status = job.status ?? {};

  const lastSchedule = status.lastScheduleTime ?? "";

  return {
    id: getCronJobId(job),
    name: meta.name ?? "unknown",
    namespace: meta.namespace ?? "default",
    schedule: spec.schedule ?? "n/a",
    suspend: spec.suspend ?? false,
    active: status.active?.length ?? 0,
    lastSchedule: lastSchedule ? formatDateTime(lastSchedule) : "n/a",
    lastScheduleValue: lastSchedule ? Date.parse(lastSchedule) : 0,
    age: formatAge(meta.creationTimestamp),
    ageValue: meta.creationTimestamp ? Date.parse(meta.creationTimestamp) : 0,
    raw: job,
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

export const JobsCronJobsPage = () => {
  const { t } = useI18n();
  const { lng } = useParams();
  const activeLanguage = normalizeLanguageCode(lng);
  const prefix = buildLanguagePrefix(activeLanguage);

  const jobFetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sJobs(params),
    []
  );
  const cronJobFetcher = useCallback(
    (params: { limit?: number; offset?: number }) =>
      infoApi.fetchK8sCronJobs(params),
    []
  );

  const {
    items: jobs,
    selected: selectedJob,
    setSelected: setSelectedJob,
    pageSize: jobPageSize,
    setPageSize: setJobPageSize,
    offset: jobOffset,
    setOffset: setJobOffset,
    total: jobTotal,
    isLoading: jobsLoading,
    error: jobsError,
  } = usePaginatedResource<K8sJob>(jobFetcher, getJobId);

  const {
    items: cronJobs,
    selected: selectedCronJob,
    setSelected: setSelectedCronJob,
    pageSize: cronPageSize,
    setPageSize: setCronPageSize,
    offset: cronOffset,
    setOffset: setCronOffset,
    total: cronTotal,
    isLoading: cronLoading,
    error: cronError,
  } = usePaginatedResource<K8sCronJob>(cronJobFetcher, getCronJobId);

  const jobRows = useMemo(() => jobs.map((job) => mapJobToRow(job)), [jobs]);
  const cronJobRows = useMemo(
    () => cronJobs.map((job) => mapCronJobToRow(job)),
    [cronJobs]
  );

  const jobTotalCount = jobTotal || jobs.length;
  const cronTotalCount = cronTotal || cronJobs.length;

  const jobColumns: TableColumn<JobRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Job",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedJob(row.raw)}
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
        key: "completions",
        label: "Completions",
        align: "center",
      },
      {
        key: "active",
        label: "Active",
        align: "center",
        sortAccessor: (row) => row.active,
      },
      {
        key: "failed",
        label: "Failed",
        align: "center",
        sortAccessor: (row) => row.failed,
      },
      {
        key: "age",
        label: "Age",
        align: "right",
        sortAccessor: (row) => row.ageValue,
      },
    ],
    [setSelectedJob]
  );

  const cronColumns: TableColumn<CronJobRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "CronJob",
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedCronJob(row.raw)}
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
        key: "schedule",
        label: "Schedule",
      },
      {
        key: "active",
        label: "Active",
        align: "center",
        sortAccessor: (row) => row.active,
      },
      {
        key: "suspend",
        label: "Suspended",
        align: "center",
        render: (row) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              row.suspend
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {row.suspend ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "lastSchedule",
        label: "Last Schedule",
        sortAccessor: (row) => row.lastScheduleValue,
      },
      {
        key: "age",
        label: "Age",
        align: "right",
        sortAccessor: (row) => row.ageValue,
      },
    ],
    [setSelectedCronJob]
  );

  const selectedJobSpec = selectedJob?.spec ?? {};
  const selectedJobStatus = selectedJob?.status ?? {};
  const selectedJobMeta = selectedJob?.metadata ?? {};
  const selectedJobContainers =
    selectedJob?.spec?.template?.spec?.containers ?? [];
  const jobConditions = selectedJobStatus.conditions ?? [];

  const selectedCronSpec = selectedCronJob?.spec ?? {};
  const selectedCronStatus = selectedCronJob?.status ?? {};
  const selectedCronMeta = selectedCronJob?.metadata ?? {};
  const selectedCronContainers =
    selectedCronJob?.spec?.jobTemplate?.spec?.template?.spec?.containers ?? [];
  const cronConditions = selectedCronStatus.active ?? [];
  const jobName = selectedJobMeta.name ?? "job";
  const jobNs = selectedJobMeta.namespace ?? "default";
  const cronName = selectedCronMeta.name ?? "cronjob";
  const cronNs = selectedCronMeta.namespace ?? "default";

  const jobCommands = [
    {
      title: "Create",
      commands: [
        "kubectl apply -f job.yaml",
        `kubectl create job ${jobName} --image=<image> -n ${jobNs}`,
      ],
    },
    {
      title: "Delete",
      commands: [`kubectl delete job ${jobName} -n ${jobNs}`],
    },
    {
      title: "Modify",
      commands: [
        `kubectl delete job ${jobName} -n ${jobNs} && kubectl apply -f job.yaml`,
      ],
    },
    {
      title: "View",
      commands: [
        `kubectl get job ${jobName} -n ${jobNs}`,
        `kubectl describe job ${jobName} -n ${jobNs}`,
        `kubectl get pods -l job-name=${jobName} -n ${jobNs}`,
      ],
    },
    {
      title: "Debug",
      commands: [
        `kubectl get events -n ${jobNs}`,
        `kubectl logs job/${jobName} -n ${jobNs}`,
      ],
    },
    {
      title: "Logs",
      commands: [
        `kubectl logs job/${jobName} -n ${jobNs}`,
        `kubectl logs -l job-name=${jobName} --all-containers=true -n ${jobNs}`,
      ],
    },
  ];

  const cronCommands = [
    {
      title: "Create",
      commands: ["kubectl apply -f cronjob.yaml"],
    },
    {
      title: "Delete",
      commands: [`kubectl delete cronjob ${cronName} -n ${cronNs}`],
    },
    {
      title: "Modify",
      commands: [`kubectl patch cronjob ${cronName} -n ${cronNs} -p '<json>'`],
    },
    {
      title: "View",
      commands: [
        `kubectl get cronjob ${cronName} -n ${cronNs}`,
        `kubectl describe cronjob ${cronName} -n ${cronNs}`,
        `kubectl get jobs --selector=cronjob-name=${cronName} -n ${cronNs}`,
      ],
    },
    {
      title: "Debug",
      commands: [
        `kubectl get events -n ${cronNs}`,
        `kubectl logs job/<latest-job> -n ${cronNs}`,
      ],
    },
    {
      title: "Logs",
      commands: [`kubectl logs job/<job-name> -n ${cronNs}`],
    },
  ];

  return (
    <SharedPageLayout>
      <SharedPageHeader
        title="Jobs & CronJobs"
        description="Batch workloads with completion status and schedules."
        breadcrumbItems={[
          { label: t("nav.workloads"), to: `${prefix}/workloads` },
          { label: t("nav.resources"), to: `${prefix}/workloads/resources` },
          { label: t("nav.jobsCronJobs") },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Table<JobRow>
            title="Jobs"
            subtitle="Inspect completion state and pod template."
            data={jobRows}
            columns={jobColumns}
            isLoading={jobsLoading}
            error={jobsError ?? undefined}
            emptyMessage="No jobs found."
            rowKey={(row) => row.id}
            actions={
              <ResourcePaginationControls
                offset={jobOffset}
                pageSize={jobPageSize}
                totalCount={jobTotalCount}
                isLoading={jobsLoading}
                setOffset={setJobOffset}
                setPageSize={setJobPageSize}
              />
            }
          />

          <SharedCard
            title={
              selectedJob
                ? `${selectedJobMeta.namespace ?? "default"}/${
                    selectedJobMeta.name ?? "job"
                  }`
                : "Select a job"
            }
            subtitle="Pod template and execution signals."
            isLoading={jobsLoading && !selectedJob}
          >
            {selectedJob ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Completions
                    </p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      {selectedJobStatus.succeeded ?? 0} /{" "}
                      {selectedJobSpec.completions ??
                        selectedJobSpec.parallelism ??
                        0}
                    </p>
                    <p className="text-xs text-slate-500">
                      Active: {selectedJobStatus.active ?? 0} · Failed:{" "}
                      {selectedJobStatus.failed ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Timing
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Start: {formatDateTime(selectedJobStatus.startTime)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Completed:{" "}
                      {formatDateTime(selectedJobStatus.completionTime)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Created
                    </p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      {formatAge(selectedJobMeta.creationTimestamp)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedJobMeta.creationTimestamp ??
                        "timestamp unavailable"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Containers
                    </h3>
                    <span className="text-xs text-slate-500">
                      {selectedJobContainers.length} found
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedJobContainers.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No container spec found.
                      </p>
                    )}
                    {selectedJobContainers.map((container, index) => (
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
                      {jobConditions.length} recorded
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {jobConditions.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No conditions reported yet.
                      </p>
                    )}
                    {jobConditions.map((condition) =>
                      renderCondition(condition)
                    )}
                  </div>
                </div>

                <CommandSection
                  heading="Kubectl Commands"
                  groups={jobCommands}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Select a job from the table to view details.
              </p>
            )}
          </SharedCard>
        </div>

        <div className="space-y-4">
          <Table<CronJobRow>
            title="CronJobs"
            subtitle="Inspect schedules and job templates."
            data={cronJobRows}
            columns={cronColumns}
            isLoading={cronLoading}
            error={cronError ?? undefined}
            emptyMessage="No cron jobs found."
            rowKey={(row) => row.id}
            actions={
              <ResourcePaginationControls
                offset={cronOffset}
                pageSize={cronPageSize}
                totalCount={cronTotalCount}
                isLoading={cronLoading}
                setOffset={setCronOffset}
                setPageSize={setCronPageSize}
              />
            }
          />

          <SharedCard
            title={
              selectedCronJob
                ? `${selectedCronMeta.namespace ?? "default"}/${
                    selectedCronMeta.name ?? "cronjob"
                  }`
                : "Select a cron job"
            }
            subtitle="Schedules, history limits, and job template."
            isLoading={cronLoading && !selectedCronJob}
          >
            {selectedCronJob ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Schedule
                    </p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      {selectedCronSpec.schedule ?? "n/a"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Concurrency:{" "}
                      {selectedCronSpec.concurrencyPolicy ?? "Allow"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      History
                    </p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      Success:{" "}
                      {selectedCronSpec.successfulJobsHistoryLimit ?? "n/a"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Failed: {selectedCronSpec.failedJobsHistoryLimit ?? "n/a"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Last Schedule
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatDateTime(selectedCronStatus.lastScheduleTime)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Active jobs: {selectedCronStatus.active?.length ?? 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Job template containers
                    </h3>
                    <span className="text-xs text-slate-500">
                      {selectedCronContainers.length} found
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedCronContainers.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No container spec found.
                      </p>
                    )}
                    {selectedCronContainers.map((container, index) => (
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
                      Active jobs
                    </h3>
                    <span className="text-xs text-slate-500">
                      {cronConditions.length} active
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cronConditions.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No active jobs recorded.
                      </p>
                    )}
                    {cronConditions.map((jobRef) => (
                      <div
                        key={`${jobRef.namespace ?? "ns"}-${
                          jobRef.name ?? "job"
                        }`}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
                      >
                        {jobRef.namespace ?? "default"}/{jobRef.name ?? "job"}
                      </div>
                    ))}
                  </div>
                </div>

                <CommandSection
                  heading="Kubectl Commands"
                  groups={cronCommands}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Select a cron job from the table to view details.
              </p>
            )}
          </SharedCard>
        </div>
      </div>
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
