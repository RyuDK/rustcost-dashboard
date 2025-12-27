import { API_BASE } from "@/shared/api/base";
import { request } from "@/shared/api/http";
import type {
  ChatRequest,
  ChatWithContextRequest,
  ChatResponse,
} from "./dto";
import type { ApiResponse } from "@/types/api";

const CHAT_URL = `${API_BASE}/llm/chat`;
const CHAT_WITH_CONTEXT_URL = `${API_BASE}/llm/chat-with-context`;

export const chatLlm = (payload: ChatRequest) =>
  request<ApiResponse<ChatResponse>>({
    method: "POST",
    url: CHAT_URL,
    data: payload,
  });

export const chatLlmWithContext = (payload: ChatWithContextRequest) =>
  request<ApiResponse<ChatResponse>>({
    method: "POST",
    url: CHAT_WITH_CONTEXT_URL,
    data: payload,
  });
