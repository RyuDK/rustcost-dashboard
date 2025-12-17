import { useEffect, useRef } from "react";
import type { DependencyList } from "react";

export const useDebouncedEffect = (
  effect: () => void | (() => void),
  deps: DependencyList,
  delayMs = 300
) => {
  const latestEffectRef = useRef(effect);

  useEffect(() => {
    latestEffectRef.current = effect;
  }, [effect]);

  useEffect(() => {
    let cleanup: void | (() => void);
    const id = window.setTimeout(() => {
      cleanup = latestEffectRef.current();
    }, delayMs);

    return () => {
      window.clearTimeout(id);
      if (cleanup) cleanup();
    };
  }, [...deps, delayMs]);
};
