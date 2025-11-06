import { useFetch, type UseFetchOptions } from "../../../../shared/hooks/useFetch";
import { createInfoResourceClient } from "../client";
import type {
  InfoQueryParams,
  InfoResponse,
  SettingsConfiguration,
  SettingsMetadata,
} from "../../model/types";

const client = createInfoResourceClient<
  SettingsMetadata,
  SettingsConfiguration
>("settings");

const withDeps = (
  params: InfoQueryParams | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches control-plane metadata and feature flags for RustCost.
 */
export const fetchSettingsMetadata = (params?: InfoQueryParams) =>
  client.metadata(params);

/**
 * Fetches configuration defaults (alerts, sampling, preferences).
 */
export const fetchSettingsConfiguration = (params?: InfoQueryParams) =>
  client.configuration(params);

/**
 * React hook that returns cached settings metadata.
 */
export const useSettingsMetadata = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<SettingsMetadata>>(
    JSON.stringify({
      scope: "info",
      resource: "settings",
      type: "metadata",
      params,
    }),
    () => fetchSettingsMetadata(params),
    withDeps(params, options)
  );

/**
 * React hook that returns cached settings configuration.
 */
export const useSettingsConfiguration = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<SettingsConfiguration>>(
    JSON.stringify({
      scope: "info",
      resource: "settings",
      type: "configuration",
      params,
    }),
    () => fetchSettingsConfiguration(params),
    withDeps(params, options)
  );
