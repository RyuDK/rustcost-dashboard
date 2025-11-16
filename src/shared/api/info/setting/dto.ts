import type { IsoDateTimeString } from "../../base";
import type { RuntimeType } from "../types";

export interface InfoSetting {
  is_dark_mode: boolean;
  language: string;
  minute_retention_days: number;
  hour_retention_months: number;
  day_retention_years: number;
  retention_policy: string;
  enable_line_num_tracking: boolean;
  enable_index_file: boolean;
  max_storage_gb: number;
  compression_enabled: boolean;
  scrape_interval_sec: number;
  metrics_batch_size: number;
  enable_cluster_health_alert: boolean;
  enable_rustcost_health_alert: boolean;
  global_alert_subject: string;
  linkback_url?: string | null;
  email_recipients: string[];
  slack_webhook_url?: string | null;
  teams_webhook_url?: string | null;
  llm_url?: string | null;
  llm_token?: string | null;
  llm_model?: string | null;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
  version: string;
  runtime_type: RuntimeType;
  enable_k8s_api: boolean;
  enable_container_exporter: boolean;
  enable_gpu_exporter: boolean;
  gpu_exporter_urls: string[];
  container_exporter_urls: string[];
  k8s_api_url?: string | null;
}

export interface InfoSettingUpsertRequest {
  is_dark_mode?: boolean;
  language?: string;
  minute_retention_days?: number;
  hour_retention_months?: number;
  day_retention_years?: number;
  retention_policy?: string;
  enable_line_num_tracking?: boolean;
  enable_index_file?: boolean;
  max_storage_gb?: number;
  compression_enabled?: boolean;
  scrape_interval_sec?: number;
  metrics_batch_size?: number;
  enable_cluster_health_alert?: boolean;
  enable_rustcost_health_alert?: boolean;
  global_alert_subject?: string;
  linkback_url?: string;
  email_recipients?: string[];
  slack_webhook_url?: string;
  teams_webhook_url?: string;
  llm_url?: string;
  llm_token?: string;
  llm_model?: string;
  runtime_type?: RuntimeType;
  enable_k8s_api?: boolean;
  enable_container_exporter?: boolean;
  enable_gpu_exporter?: boolean;
  gpu_exporter_urls?: string[];
  container_exporter_urls?: string[];
  k8s_api_url?: string;
}

