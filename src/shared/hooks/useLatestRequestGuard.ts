import { useCallback, useMemo, useRef } from "react";

type Guard = {
  begin: () => number;
  isLatest: (token: number) => boolean;
};

export const useLatestRequestGuard = (): Guard => {
  const idRef = useRef(0);

  const begin = useCallback(() => {
    idRef.current += 1;
    return idRef.current;
  }, []);

  const isLatest = useCallback((token: number) => token === idRef.current, []);

  return useMemo(() => ({ begin, isLatest }), [begin, isLatest]);
};
