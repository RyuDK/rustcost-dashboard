import type { IsoDateTimeString } from "@/types/api";

export interface InfoUnitPrice {
  cpu_core_hour: number;
  cpu_spot_core_hour: number;
  memory_gb_hour: number;
  memory_spot_gb_hour: number;
  gpu_hour: number;
  gpu_spot_hour: number;
  storage_gb_hour: number;
  network_local_gb: number;
  network_regional_gb: number;
  network_external_gb: number;
  updated_at: IsoDateTimeString;
}

export interface InfoUnitPriceUpsertRequest {
  cpu_core_hour?: number;
  cpu_spot_core_hour?: number;
  memory_gb_hour?: number;
  memory_spot_gb_hour?: number;
  gpu_hour?: number;
  gpu_spot_hour?: number;
  storage_gb_hour?: number;
  network_local_gb?: number;
  network_regional_gb?: number;
  network_external_gb?: number;
}

