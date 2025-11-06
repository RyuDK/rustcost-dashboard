export const API_BASE_PATH = "/api/v1";

export const METRIC_RESOURCES = [
  "nodes",
  "pods",
  "containers",
  "namespaces",
  "deployments",
  "cluster",
] as const;

export type MetricResource = (typeof METRIC_RESOURCES)[number];

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_METRICS = ["cpu_usage", "memory_usage"] as const;

export const DEFAULT_DATE_RANGE_DAYS = 7;
