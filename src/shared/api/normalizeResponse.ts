import { fromUTC } from "@/shared/utils/timezone";
import { isTimeField } from "@/shared/utils/time"; // keep separate

export function normalizeResponse<T>(input: T, timezone: string): T {
  return normalize(input, timezone) as T;
}

function normalize(value: unknown, timezone: string): unknown {
  if (value == null) return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item, timezone));
  }

  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const v = obj[key];

    if (v == null) {
      result[key] = v;
      continue;
    }

    // utc → user timezone
    if (typeof v === "string" && isTimeField(key)) {
      result[key] = fromUTC(v, timezone);
      continue;
    }

    if (typeof v === "object") {
      result[key] = normalize(v, timezone);
      continue;
    }

    result[key] = v;
  }

  return result;
}
