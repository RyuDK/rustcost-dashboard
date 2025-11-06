import { useFetch, type UseFetchOptions } from "../../../../shared/hooks/useFetch";
import { createInfoResourceClient } from "../client";
import type {
  InfoQueryParams,
  InfoResponse,
  NodeConfiguration,
  NodeMetadata,
} from "../../model/types";

const client = createInfoResourceClient<NodeMetadata, NodeConfiguration>("nodes");

const withDeps = (
  params: InfoQueryParams | undefined,
  options?: UseFetchOptions
): UseFetchOptions => ({
  ...options,
  deps: [JSON.stringify(params ?? {}), ...(options?.deps ?? [])],
});

/**
 * Fetches metadata for cluster nodes (labels, roles, status).
 */
export const fetchNodeMetadata = (params?: InfoQueryParams) =>
  client.metadata(params);

/**
 * Fetches configuration details for nodes (capacity, versions).
 */
export const fetchNodeConfiguration = (params?: InfoQueryParams) =>
  client.configuration(params);

/**
 * React hook that provides cached node metadata.
 */
export const useNodeMetadata = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<NodeMetadata>>(
    JSON.stringify({ scope: "info", resource: "nodes", type: "metadata", params }),
    () => fetchNodeMetadata(params),
    withDeps(params, options)
  );

/**
 * React hook that provides cached node configuration.
 */
export const useNodeConfiguration = (
  params?: InfoQueryParams,
  options?: UseFetchOptions
) =>
  useFetch<InfoResponse<NodeConfiguration>>(
    JSON.stringify({ scope: "info", resource: "nodes", type: "configuration", params }),
    () => fetchNodeConfiguration(params),
    withDeps(params, options)
  );
