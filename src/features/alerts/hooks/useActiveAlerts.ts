// hooks/useActiveAlerts.ts
import { useMemo } from "react";
import { useFetch } from "@/shared/hooks/useFetch";
import type { ApiResponse } from "@/types/api";
import {
  type AlertEvent,
  fetchActiveAlerts,
} from "@/shared/api/state/alerts/methods";

//
// --- Match helper utilities from your metrics hook ---
//
const extractPayload = <T>(response?: ApiResponse<T>) =>
  response?.is_successful ? response.data : undefined;

const serializeParam = (value: unknown) => JSON.stringify(value ?? {});
//
// ------------------------------------------------------
//

export interface UseActiveAlertsResult {
  alerts: AlertEvent[];
  isLoading: boolean;
  error: unknown;
  refetchAll: () => void;
}

export const useActiveAlerts = (): UseActiveAlertsResult => {
  // dependency for memoizing, even if static
  const depsKey = useMemo(() => serializeParam(null), []);

  const query = useFetch(
    ["system", "alerts", depsKey],
    () => fetchActiveAlerts(),
    { deps: [depsKey] }
  );

  const alerts = extractPayload<AlertEvent[]>(query.data) ?? [];

  return {
    alerts,
    isLoading: query.isLoading,
    error: query.error,
    refetchAll: () => {
      void query.refetch();
    },
  };
};
