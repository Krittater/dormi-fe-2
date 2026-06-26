"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/format";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Generic data fetching hook. Pass `null` as fetcher to skip fetching
 * (e.g. when an apartmentId is not yet available).
 */
export function useFetch<T>(
  fetcher: (() => Promise<T>) | null,
  deps: React.DependencyList
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(fetcher));
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!fetcher) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run, setData };
}
