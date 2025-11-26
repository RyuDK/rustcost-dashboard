import type { IsoDateTimeString } from "@/types/api";

export type RuntimeType = "k8s" | "docker" | "containerd" | "baremetal";

export interface MutationResponse {
  message: string;
  updated_at?: IsoDateTimeString;
}
