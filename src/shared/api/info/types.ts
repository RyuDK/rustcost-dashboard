import type { IsoDateTimeString } from "../base";

export type RuntimeType = "k8s" | "docker" | "containerd" | "baremetal";

export interface MutationResponse {
  message: string;
  updated_at?: IsoDateTimeString;
}

