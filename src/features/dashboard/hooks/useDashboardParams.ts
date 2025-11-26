import { useCallback, useState } from "react";
import type { MetricsQueryOptions } from "@/features/metrics/types";
import { createDefaultMetricsParams } from "./useMetrics";

export const useDashboardParams = () => {
  const [params, setParams] = useState<MetricsQueryOptions>(() => ({
    ...createDefaultMetricsParams(),
    sort: "efficiencyScore:desc",
  }));

  const updateParam = useCallback(
    <K extends keyof MetricsQueryOptions>(key: K, value: MetricsQueryOptions[K]) => {
      setParams((prev) => {
        if (value === undefined || value === "") {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return {
          ...prev,
          [key]: value,
        };
      });
    },
    []
  );

  return { params, updateParam };
};
