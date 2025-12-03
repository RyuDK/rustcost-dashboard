import type { IsoDateTimeString } from "@/types/api";

export interface SystemComponentStatus {
  component: string;
  status: "healthy" | "degraded" | "warning" | "error" | "unknown";
  message?: string;
  lastCheckedAt?: IsoDateTimeString;
}

export interface SystemStatusResponse {
  last_discovered_at: string | null; // ISO datetime or null
  last_error_at: string | null; // ISO datetime or null
  last_error_message: string | null; // backend error or null
  resync_running: boolean; // true → resync still in progress
}

export type SystemResponse = Record<string, unknown>;

export interface SystemActionResponse {
  status: "accepted" | "in_progress" | "completed" | "failed";
  requestedAt: IsoDateTimeString;
  message: string;
}

export interface BackupResponse extends SystemActionResponse {
  backupId: string;
  location?: string;
}

export interface ResyncResponse extends SystemActionResponse {
  resync: string;
}

export interface LogFileInfo {
  date: string; // yyyyMMdd
}

export interface LogLineResponse {
  date: string;
  lines: string[];
  next_cursor: number | null;
}
