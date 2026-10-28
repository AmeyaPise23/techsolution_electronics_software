import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | undefined;
  refetch: () => void;
}

export interface UseAsyncOptions {
  deps?: unknown[];
  subscribeToStore?: boolean;
}

export function useAsync<T>(
  fetcher: () => Promise<T>,
  { deps = [] }: UseAsyncOptions = {}
): AsyncResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const latestReq = useRef(0);
  const hasResolvedOnce = useRef(false);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const reqId = ++latestReq.current;
    setIsFetching(true);
    setError(undefined);
    fetcher()
      .then((result) => {
        if (reqId !== latestReq.current) return;
        setData(result);
        hasResolvedOnce.current = true;
        setIsFetching(false);
      })
      .catch((err: unknown) => {
        if (reqId !== latestReq.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsFetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, isLoading: isFetching && !hasResolvedOnce.current, isFetching, error, refetch };
}
