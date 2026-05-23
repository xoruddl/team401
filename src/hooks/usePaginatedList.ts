import { useCallback, useEffect, useState } from 'react';

type Options<T> = {
  fetchPage: (cursor: string | null, limit: number) => Promise<T[]>;
  getCursor: (item: T) => string;
  pageSize?: number;
};

export function usePaginatedList<T>({
  fetchPage,
  getCursor,
  pageSize = 20,
}: Options<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadFirst = useCallback(async () => {
    const page = await fetchPage(null, pageSize);
    setItems(page);
    setHasMore(page.length === pageSize);
  }, [fetchPage, pageSize]);

  useEffect(() => {
    loadFirst().finally(() => setLoading(false));
  }, [loadFirst]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || items.length === 0) return;
    setLoadingMore(true);
    const lastCursor = getCursor(items[items.length - 1]);
    const page = await fetchPage(lastCursor, pageSize);
    setItems((prev) => [...prev, ...page]);
    setHasMore(page.length === pageSize);
    setLoadingMore(false);
  }, [fetchPage, getCursor, hasMore, items, loadingMore, pageSize]);

  return { items, loading, refreshing, loadingMore, hasMore, refresh, loadMore };
}
