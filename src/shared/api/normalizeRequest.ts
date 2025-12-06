import { isTimeField } from "../utils/time";
import { toUTC, toUTCDateBoundary } from "../utils/timezone";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeRequest<T>(input: T, timezone: string): T {
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

    // convert string timestamps -> UTC
    if (typeof v === "string" && isTimeField(key)) {
      if (dateOnlyPattern.test(v)) {
        const boundary =
          key.toLowerCase().includes("end") && !key.toLowerCase().includes("start")
            ? "end"
            : "start";
        result[key] = toUTCDateBoundary(v, timezone, boundary);
      } else {
        result[key] = toUTC(v, timezone);
      }
      continue;
    }

    // recurse into nested object
    if (typeof v === "object") {
      result[key] = normalize(v, timezone);
      continue;
    }

    result[key] = v;
  }

  return result;
}
