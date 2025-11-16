import type { IsoDateTimeString } from "../base";

export interface SystemComponentStatus {
  component: string;
  status: "healthy" | "degraded" | "warning" | "error" | "unknown";
  message?: string;
  lastCheckedAt?: IsoDateTimeString;
}

export interface SystemStatusResponse {
  status: "healthy" | "degraded" | "maintenance" | "unknown";
  components: SystemComponentStatus[];
  version: string;
  lastUpdated: IsoDateTimeString;
}

export type SystemResponse = Record<string, unknown>;

export interface SystemActionResponse {
  status: "accepted" | "in_progress" | "completed" | "failed";
  requestedAt: IsoDateTimeString;
  message?: string;
}

export interface BackupResponse extends SystemActionResponse {
  backupId: string;
  location?: string;
}

export interface ResyncResponse extends SystemActionResponse {
  resyncId: string;
}
