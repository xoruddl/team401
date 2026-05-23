import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Notice } from '../../types';

const PAGE_SIZE = 20;
const SELECT =
  'id, author_id, title, content, pinned_order, created_at, updated_at, profiles(id, nickname, avatar_url)';

export function useNotices() {
  const [pinned, setPinned] = useState<Notice[]>([]);
  const [unpinned, setUnpinned] = useState<Notice[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPinned = useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select(SELECT)
      .not('pinned_order', 'is', null)
      .order('pinned_order', { ascending: true });
    if (error) {
      Alert.alert('오류', '고정 공지를 불러오지 못했습니다.');
      return;
    }
    setPinned((data ?? []) as unknown as Notice[]);
  }, []);

  const fetchUnpinnedFirst = useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select(SELECT)
      .is('pinned_order', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (error) {
      Alert.alert('오류', '공지사항을 불러오지 못했습니다.');
      return;
    }
    const page = (data ?? []) as unknown as Notice[];
    setUnpinned(page);
    setHasMore(page.length === PAGE_SIZE);
  }, []);

  const loadFirst = useCallback(async () => {
    await Promise.all([fetchPinned(), fetchUnpinnedFirst()]);
  }, [fetchPinned, fetchUnpinnedFirst]);

  useEffect(() => {
    loadFirst().finally(() => setLoading(false));
  }, [loadFirst]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || unpinned.length === 0) return;
    setLoadingMore(true);
    const cursor = unpinned[unpinned.length - 1].created_at;
    const { data } = await supabase
      .from('notices')
      .select(SELECT)
      .is('pinned_order', null)
      .lt('created_at', cursor)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    const page = (data ?? []) as unknown as Notice[];
    setUnpinned((prev) => [...prev, ...page]);
    setHasMore(page.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [hasMore, loadingMore, unpinned]);

  const pin = async (notice: Notice) => {
    const maxOrder = pinned.reduce((m, p) => Math.max(m, p.pinned_order ?? 0), 0);
    const { error } = await supabase
      .from('notices')
      .update({ pinned_order: maxOrder + 1 })
      .eq('id', notice.id);
    if (error) Alert.alert('오류', error.message);
    else await refresh();
  };

  const unpin = async (notice: Notice) => {
    const { error } = await supabase
      .from('notices')
      .update({ pinned_order: null })
      .eq('id', notice.id);
    if (error) Alert.alert('오류', error.message);
    else await refresh();
  };

  const moveUp = async (notice: Notice) => {
    const idx = pinned.findIndex((p) => p.id === notice.id);
    if (idx <= 0) return;
    const above = pinned[idx - 1];
    if (notice.pinned_order == null || above.pinned_order == null) return;
    await supabase
      .from('notices')
      .update({ pinned_order: above.pinned_order })
      .eq('id', notice.id);
    await supabase
      .from('notices')
      .update({ pinned_order: notice.pinned_order })
      .eq('id', above.id);
    await refresh();
  };

  const moveDown = async (notice: Notice) => {
    const idx = pinned.findIndex((p) => p.id === notice.id);
    if (idx < 0 || idx >= pinned.length - 1) return;
    const below = pinned[idx + 1];
    if (notice.pinned_order == null || below.pinned_order == null) return;
    await supabase
      .from('notices')
      .update({ pinned_order: below.pinned_order })
      .eq('id', notice.id);
    await supabase
      .from('notices')
      .update({ pinned_order: notice.pinned_order })
      .eq('id', below.id);
    await refresh();
  };

  return {
    pinned,
    unpinned,
    items: [...pinned, ...unpinned],
    loading,
    refreshing,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
    pin,
    unpin,
    moveUp,
    moveDown,
  };
}
