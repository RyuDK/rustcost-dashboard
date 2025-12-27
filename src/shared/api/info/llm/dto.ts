import type { IsoDateTimeString } from "@/types/api";

export type LlmProvider = "huggingface" | "gpt" | "gemini" | "grok";

export interface InfoLlmEntity {
  provider: LlmProvider;
  base_url?: string | null;
  token?: string | null;
  model?: string | null;
  max_output_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  top_k?: number | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  timeout_ms?: number | null;
  stream: boolean;
  stop_sequences?: string[] | null;
  organization?: string | null;
  user?: string | null;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
  version: string;
}

export interface InfoLlmUpsertRequest {
  provider?: LlmProvider;
  base_url?: string;
  token?: string;
  model?: string;
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  timeout_ms?: number;
  stream?: boolean;
  stop_sequences?: string[];
  organization?: string;
  user?: string;
}
