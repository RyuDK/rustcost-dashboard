import { useFetch, type UseFetchOptions } from "../../../../shared/hooks/useFetch";
import { createInfoResourceClient } from "../client";
import type {
  InfoQueryParams,
  InfoResponse,
  PodConfiguration,
  PodMetadata,
} from "../../model/types";

const client = createInfoResourceClient<PodMetadata, PodConfiguration>("pods");

const withDeps = (
  params: InfoQueryParams | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches pod metadata including namespace, node affinity, and labels.
 */
export const fetchPodMetadata = (params?: InfoQueryParams) =>
  client.metadata(params);

/**
 * Fetches pod configuration such as container specs and resource budgets.
 */
export const fetchPodConfiguration = (params?: InfoQueryParams) =>
  client.configuration(params);

/**
 * React hook providing cached pod metadata.
 */
export const usePodMetadata = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<PodMetadata>>(
    JSON.stringify({ scope: "info", resource: "pods", type: "metadata", params }),
    () => fetchPodMetadata(params),
    withDeps(params, options)
  );

/**
 * React hook providing cached pod configuration.
 */
export const usePodConfiguration = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<PodConfiguration>>(
    JSON.stringify({
      scope: "info",
      resource: "pods",
      type: "configuration",
      params,
    }),
    () => fetchPodConfiguration(params),
    withDeps(params, options)
  );
