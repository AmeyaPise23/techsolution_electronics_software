// React-Query-shaped async hook. Kept minimal because we don't need the full
// React Query surface for the mock phase, and the zustand store already gives
// us cross-screen reactivity. In Phase C, if we adopt React Query, screens
// switch to `useQuery` with the same call site shape (data/isLoading/error/refetch).

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkStore } from "../mock/store";

export interface AsyncResult<T> {
  data: T | undefined;
  isLoading: boolean;   // first fetch only — screens gate their initial skeleton on this
  isFetching: boolean;  // true during any fetch, including background re-fetches
  error: Error | undefined;
  refetch: () => void;
}

// Options: `deps` controls when the query re-runs (like React Query's queryKey);
// `subscribeToStore` re-runs the fetcher whenever the mock store changes so
// mutations elsewhere in the app propagate to this screen without manual
// invalidation. In real-API mode this option gets ignored.
export interface UseAsyncOptions {
  deps?: unknown[];
  subscribeToStore?: boolean;
}

export function useAsync<T>(
  fetcher: () => Promise<T>,
  { deps = [], subscribeToStore = true }: UseAsyncOptions = {}
): AsyncResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const latestReq = useRef(0);
  const hasResolvedOnce = useRef(false);

  // Bump `tick` whenever the mock store changes, so all useAsync callers
  // re-fetch and pick up mutations across screens. For a real API, wire
  // subscribeToStore=false and invalidate manually / via React Query.
  useEffect(() => {
    if (!subscribeToStore) return;
    return useWorkStore.subscribe(() => setTick((n) => n + 1));
  }, [subscribeToStore]);

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

  // isLoading = "no data yet" — the classic first-paint gate. Background
  // re-fetches (from store mutations) leave isLoading false so screens keep
  // showing the previous data, which is what makes optimistic UI feel instant.
  return { data, isLoading: isFetching && !hasResolvedOnce.current, isFetching, error, refetch };
}
