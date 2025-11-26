import { INFO_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type { ApiResponse } from "@/shared/api/base";
import type { InfoVersion } from "./dto";

const VERSIONS_URL = `${INFO_BASE}/versions`;

export const fetchInfoVersions = () =>
  request<ApiResponse<InfoVersion>>({
    method: "GET",
    url: VERSIONS_URL,
  });

