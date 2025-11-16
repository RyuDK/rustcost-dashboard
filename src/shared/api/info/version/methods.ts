import { INFO_BASE } from "../../base";
import { request } from "../../http";
import type { ApiResponse } from "../../base";
import type { InfoVersion } from "./dto";

const VERSIONS_URL = `${INFO_BASE}/versions`;

export const fetchInfoVersions = () =>
  request<ApiResponse<InfoVersion>>({
    method: "GET",
    url: VERSIONS_URL,
  });

