export interface AlertEvent {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical" | string;
  created_at: string;
  last_updated_at: string;
  active: boolean;
}

export interface AlertsPayload {
  active_alerts: AlertEvent[];
}

export interface ResolveAlertPayload {
  resolved: string;
}
