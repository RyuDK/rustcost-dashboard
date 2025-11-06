import { API_BASE_PATH } from "../../../shared/api/constants";
import { request } from "../../../shared/api/http";
import type { InfoQueryParams, InfoResponse } from "../model/types";

type InfoSeries = "metadata" | "configuration";

/**
 * Builds the REST path for an info resource endpoint.
 */
const buildInfoUrl = (resource: string, series: InfoSeries) =>
  `${API_BASE_PATH}/info/${resource}/${series}`;

const serializeParams = (params: InfoQueryParams = {}) => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined
  );
  return Object.fromEntries(entries);
};

/**
 * Factory that produces a typed fetcher for a resource info endpoint.
 */
const makeFetcher =
  <T>(resource: string, series: InfoSeries) =>
  (params?: InfoQueryParams) =>
    request<InfoResponse<T>>({
      method: "GET",
      url: buildInfoUrl(resource, series),
      params: serializeParams(params),
    });

/**
 * Creates a typed client for info resources (metadata + configuration).
 */
export const createInfoResourceClient = <Metadata, Configuration>(
  resource: string
) => ({
  metadata: makeFetcher<Metadata>(resource, "metadata"),
  configuration: makeFetcher<Configuration>(resource, "configuration"),
});
