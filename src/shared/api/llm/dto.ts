export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  tool_calls?: unknown[];
}

export interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface ChatWithContextRequest extends ChatRequest {
  include_cluster_summary?: boolean;
  include_alerts?: boolean;
  time_window_minutes?: number;
}

export interface ChatChoice {
  index?: number;
  message?: ChatMessage;
  finish_reason?: string | null;
  logprobs?: unknown;
  seed?: number;
}

export interface ChatResponse {
  id?: string;
  model?: string;
  created?: number;
  object?: string;
  prompt?: unknown;
  choices?: ChatChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cached_tokens?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
