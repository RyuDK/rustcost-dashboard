import { fromUTC, toUTC } from "./timezone";
import { isTimeField } from "./time";

export { fromUTC, toUTC, isTimeField };

/**
 * Legacy helper to return the UTC timestamp (ms) for an ISO string
 * interpreted in a specific IANA timezone.
 */
export function getTimestampInZone(iso: string, timeZone: string): number {
  const utcIso = toUTC(iso, timeZone);
  return Date.parse(`${utcIso}Z`);
}
