import type { MetricGranularity } from "@/types/api";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_DAYS_MS = 48 * ONE_HOUR_MS;

const toValidDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

export const pickGranularity = (
  start?: string,
  end?: string,
  now: Date = new Date()
): MetricGranularity => {
  const startDate = toValidDate(start);
  const endDate = toValidDate(end) ?? now;

  if (!startDate) {
    return "day";
  }

  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());

  if (diffMs < ONE_HOUR_MS) {
    return "minute";
  }

  if (diffMs < TWO_DAYS_MS) {
    return "hour";
  }

  return "day";
};

export const withAutoGranularity = <
  T extends { start?: string; end?: string; granularity?: MetricGranularity }
>(
  params?: T
): T | undefined => {
  if (!params) {
    return undefined;
  }

  if (params.granularity) {
    return params;
  }

  return {
    ...params,
    granularity: pickGranularity(params.start, params.end),
  };
};
