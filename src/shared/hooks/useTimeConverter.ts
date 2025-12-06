import { useAppSelector } from "@/store/hook";
import {
  toUTC as toUTCBase,
  fromUTC as fromUTCBase,
} from "@/shared/utils/timeConverter";

export function useTimeConverter() {
  const timezone = useAppSelector((s) => s.preferences.timezone);

  return {
    toUTC: (iso: string) => toUTCBase(iso, timezone),
    fromUTC: (iso: string) => fromUTCBase(iso, timezone),
    timezone,
  };
}
