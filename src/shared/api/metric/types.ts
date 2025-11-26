import type {
  IsoDateTimeString,
  MetricGranularity,
  MetricScope,
} from "@/shared/api/base";

export interface CommonMetricValues {
  cpu_usage_nano_cores?: number;
  cpu_usage_core_nano_seconds?: number;
  memory_usage_bytes?: number;
  memory_working_set_bytes?: number;
  memory_rss_bytes?: number;
  memory_page_faults?: number;
}

export interface FilesystemMetric {
  used_bytes?: number;
  capacity_bytes?: number;
  inodes_used?: number;
  inodes?: number;
}

export interface NetworkMetric {
  rx_bytes?: number;
  tx_bytes?: number;
  rx_errors?: number;
  tx_errors?: number;
}

export interface StorageMetric {
  ephemeral?: FilesystemMetric;
  persistent?: FilesystemMetric;
}

export interface CostMetric {
  total_cost_usd?: number;
  cpu_cost_usd?: number;
  memory_cost_usd?: number;
  storage_cost_usd?: number;
}

export interface UniversalMetricPoint {
  time: IsoDateTimeString;
  cpu_memory: CommonMetricValues;
  filesystem?: FilesystemMetric;
  network?: NetworkMetric;
  storage?: StorageMetric;
  cost?: CostMetric;
}

export interface MetricSeries {
  key: string;
  name: string;
  scope: MetricScope;
  points: UniversalMetricPoint[];
}

export interface MetricGetResponse {
  start: IsoDateTimeString;
  end: IsoDateTimeString;
  scope: string;
  target?: string | null;
  granularity: MetricGranularity;
  series: MetricSeries[];
}

export interface MetricRawSummary {
  avg_cpu_cores: number;
  max_cpu_cores: number;
  avg_memory_gb: number;
  max_memory_gb: number;
  avg_storage_gb: number;
  max_storage_gb: number;
  avg_network_gb: number;
  max_network_gb: number;
  node_count: number;
}

export interface MetricRawSummaryResponse {
  start: IsoDateTimeString;
  end: IsoDateTimeString;
  scope: MetricScope;
  granularity: MetricGranularity;
  summary: MetricRawSummary;
}

export interface MetricRawEfficiency {
  cpu_efficiency: number;
  memory_efficiency: number;
  storage_efficiency: number;
  overall_efficiency: number;
  total_cpu_allocatable_cores: number;
  total_memory_allocatable_gb: number;
  total_storage_allocatable_gb: number;
}

export interface MetricRawEfficiencyResponse {
  start: IsoDateTimeString;
  end: IsoDateTimeString;
  scope: MetricScope;
  granularity: MetricGranularity;
  efficiency: MetricRawEfficiency;
}

export interface MetricCostSummary {
  total_cost_usd: number;
  cpu_cost_usd: number;
  memory_cost_usd: number;
  ephemeral_storage_cost_usd: number;
  persistent_storage_cost_usd: number;
  network_cost_usd: number;
}

export interface MetricCostSummaryResponse {
  start: IsoDateTimeString;
  end: IsoDateTimeString;
  scope: MetricScope;
  target?: string | null;
  granularity: MetricGranularity;
  summary: MetricCostSummary;
}

export interface MetricCostTrend {
  start_cost_usd: number;
  end_cost_usd: number;
  cost_diff_usd: number;
  growth_rate_percent: number;
  regression_slope_usd_per_granularity: number;
  predicted_next_cost_usd?: number;
}

export interface MetricCostTrendPoint {
  time: string;
  total_cost_usd: number;
  cpu_cost_usd: number;
  memory_cost_usd: number;
  storage_cost_usd: number;
}

export interface MetricCostTrendDto {
  start_cost_usd: number;
  end_cost_usd: number;
  cost_diff_usd: number;
  growth_rate_percent: number;
  regression_slope_usd_per_granularity: number;
  predicted_next_cost_usd: number | null;
}

export interface MetricCostTrendResponse {
  start: string;
  end: string;
  scope: string;
  target: string | null;
  granularity: string;
  trend: MetricCostTrendDto;
  points: MetricCostTrendPoint[]; // ✅ THIS WAS MISSING
}

export interface NodeMetricTargetParams {
  nodeName: string;
}

export interface PodMetricTargetParams {
  podUid: string;
}

export interface ContainerMetricTargetParams {
  containerId: string;
}

export interface NamespaceMetricTargetParams {
  namespace: string;
}

export interface DeploymentMetricTargetParams {
  deployment: string;
}
