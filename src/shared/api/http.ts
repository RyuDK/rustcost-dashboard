import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { store } from "@/store/store";
import { clearLastResync } from "@/store/slices/systemSlice";
import { normalizeRequest } from "./normalizeRequest";
import { normalizeResponse } from "./normalizeResponse";

export interface ApiErrorPayload {
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Normalized API error that carries optional status code and details.
 */
export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.details = payload.details;
  }
}

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BACKEND_URL ?? "";

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
});

httpClient.interceptors.request.use((config) => {
  const timezone = store.getState().preferences.timezone;

  if (timezone) {
    if (config.data) {
      config.data = normalizeRequest(config.data, timezone);
    }
    if (config.params) {
      config.params = normalizeRequest(config.params, timezone);
    }
  }

  return config;
});

const handleResyncRedirect = (payload: unknown) => {
  const errorCode =
    (payload as { error_code?: string } | undefined)?.error_code ?? null;
  if (errorCode === "NotResynced") {
    store.dispatch(clearLastResync());
  }
};

httpClient.interceptors.response.use(
  (response) => {
    const timezone = store.getState().preferences.timezone;
    if (timezone && response?.data) {
      response.data = normalizeResponse(response.data, timezone);
    }

    handleResyncRedirect(response.data);
    return response;
  },
  (error: AxiosError) => {
    handleResyncRedirect(error.response?.data);

    const payload: ApiErrorPayload = {
      message:
        (error.response?.data as { message?: string })?.message ??
        error.message ??
        "Network request failed",
      status: error.response?.status,
      details: error.response?.data ?? error.cause,
    };
    return Promise.reject(new ApiError(payload));
  }
);

/**
 * Thin wrapper around Axios that unwraps the data payload and preserves typings.
 */
export const request = <T>(config: AxiosRequestConfig): Promise<T> =>
  httpClient.request<T>(config).then((response) => response.data);

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type DateFilterParams = {
  start?: string;
  end?: string;
};

export type SortingParam = `${string}:${"asc" | "desc"}`;

export interface MetricsQueryParams extends PaginationParams, DateFilterParams {
  sort?: SortingParam;
  metric?: string | string[];
}
