import { useFetch, type UseFetchOptions } from "../../../../shared/hooks/useFetch";
import { createInfoResourceClient } from "../client";
import type {
  ContainerConfiguration,
  ContainerMetadata,
  InfoQueryParams,
  InfoResponse,
} from "../../model/types";

const client = createInfoResourceClient<
  ContainerMetadata,
  ContainerConfiguration
>("containers");

const withDeps = (
  params: InfoQueryParams | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches metadata for containers (image, runtime, restarts).
 */
export const fetchContainerMetadata = (params?: InfoQueryParams) =>
  client.metadata(params);

/**
 * Fetches container configuration such as resource budgets and environment variables.
 */
export const fetchContainerConfiguration = (params?: InfoQueryParams) =>
  client.configuration(params);

/**
 * React hook that returns cached container metadata.
 */
export const useContainerMetadata = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<ContainerMetadata>>(
    JSON.stringify({
      scope: "info",
      resource: "containers",
      type: "metadata",
      params,
    }),
    () => fetchContainerMetadata(params),
    withDeps(params, options)
  );

/**
 * React hook that returns cached container configuration.
 */
export const useContainerConfiguration = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<ContainerConfiguration>>(
    JSON.stringify({
      scope: "info",
      resource: "containers",
      type: "configuration",
      params,
    }),
    () => fetchContainerConfiguration(params),
    withDeps(params, options)
  );
