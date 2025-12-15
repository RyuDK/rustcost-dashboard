import type { IsoDateTimeString } from "@/types/api";

export type AlertMetricType =
  | "CpuUsagePercent"
  | "MemoryUsagePercent"
  | "DiskUsagePercent"
  | "GpuUsagePercent";

export type AlertOperator =
  | "GreaterThan"
  | "LessThan"
  | "GreaterThanOrEqual"
  | "LessThanOrEqual";

export type AlertSeverity = "Info" | "Warning" | "Critical";

export interface AlertRule {
  id: string;
  name: string;
  metric_type: AlertMetricType;
  operator: AlertOperator;
  threshold: number;
  for_duration_sec: number;
  severity: AlertSeverity;
  enabled: boolean;
}

export interface InfoAlertEntity {
  enable_cluster_health_alert: boolean;
  enable_rustcost_health_alert: boolean;
  global_alert_subject: string;
  linkback_url?: string | null;
  email_recipients: string[];
  slack_webhook_url?: string | null;
  teams_webhook_url?: string | null;
  discord_webhook_url?: string | null;
  rules: AlertRule[];
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
  version: string;
}

export interface InfoAlertUpsertRequest {
  enable_cluster_health_alert?: boolean;
  enable_rustcost_health_alert?: boolean;
  global_alert_subject?: string;
  linkback_url?: string | null;
  email_recipients?: string[];
  slack_webhook_url?: string | null;
  teams_webhook_url?: string | null;
  discord_webhook_url?: string | null;
  rules?: AlertRule[];
}
