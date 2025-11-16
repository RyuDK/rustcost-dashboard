import { INFO_BASE } from "../../base";
import { request } from "../../http";
import type { ApiResponse } from "../../base";
import type { MutationResponse } from "../types";
import type { InfoUnitPrice, InfoUnitPriceUpsertRequest } from "./dto";

const UNIT_PRICE_URL = `${INFO_BASE}/unit-prices`;

export const fetchInfoUnitPrices = () =>
  request<ApiResponse<InfoUnitPrice>>({
    method: "GET",
    url: UNIT_PRICE_URL,
  });

export const upsertInfoUnitPrices = (payload: InfoUnitPriceUpsertRequest) =>
  request<ApiResponse<MutationResponse>>({
    method: "PUT",
    url: UNIT_PRICE_URL,
    data: payload,
  });

