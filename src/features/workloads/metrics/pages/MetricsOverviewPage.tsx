import { SharedPageHeader } from "@/shared/components/layout/SharedPageHeader";
import { LinkCard } from "@/shared/components/cards/SharedLinkCards";
import { useI18n } from "@/app/providers/i18n/useI18n";

export default function MetricOverviewPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-10 px-6 py-6">
      {/* HEADER */}
      <SharedPageHeader
        eyebrow=""
        title="Metrics Overview"
        description="Explore metrics for nodes, pods, and containers to understand cluster performance."
        breadcrumbItems={[{ label: t("nav.metrics") }]}
      />

      {/* LINKS SECTION */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Metric Types
        </h2>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <LinkCard title="Node Metrics" subtitle="Cluster Nodes" to="nodes" />
          <LinkCard title="Pod Metrics" subtitle="Workload Pods" to="pods" />
          <LinkCard
            title="Container Metrics"
            subtitle="Runtime Containers"
            to="containers"
          />
        </div>
      </div>

      {/* EXPLANATION SECTION */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          What These Metrics Represent
        </h2>

        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Node Metrics
            </h3>
            <p>
              Node metrics provide insights into the performance and resource
              usage of the physical or virtual machines in the cluster. This
              includes CPU utilization, memory usage, storage capacity, and
              network throughput at the node level.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Pod Metrics
            </h3>
            <p>
              Pod metrics track how individual Kubernetes pods consume cluster
              resources over time. These metrics help you understand workload
              efficiency, scaling behavior, and pod-level performance issues.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Container Metrics
            </h3>
            <p>
              Containers represent the smallest compute unit in Kubernetes.
              Container metrics include CPU, memory, network I/O, and storage
              usage for each running container. These metrics are essential for
              debugging performance bottlenecks and analyzing application-level
              behavior.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
