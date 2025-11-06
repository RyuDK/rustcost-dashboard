import { useCallback, useState } from "react";
import { request } from "../../../../shared/api/http";
import { API_BASE_PATH } from "../../../../shared/api/constants";
import type { ResyncResponse } from "../types";

const RESYNC_URL = `${API_BASE_PATH}/system/resync`;

export interface ResyncPayload {
  force?: boolean;
  scope?: "metrics" | "info" | "all";
}

/**
 * Requests a resynchronisation with upstream RustCost Core services.
 *
 * @param payload - Optional parameters to control the resync scope.
 */
export const triggerSystemResync = (payload?: ResyncPayload) =>
  request<ResyncResponse>({
    method: "POST",
    url: RESYNC_URL,
    data: payload ?? {},
  });

/**
 * Hook returning a trigger function and state for the system resync action.
 */
export const useSystemResync = () => {
  const [data, setData] = useState<ResyncResponse | undefined>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async (payload?: ResyncPayload) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await triggerSystemResync(payload);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { trigger, data, error, isLoading };
};
