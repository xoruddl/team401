import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../../services/supabase';
import { SeasonEntry } from '../../../types';
import { formatYmd } from '../../../utils/date';

export function useSeasonEntries(selectedDate: Date, isMaster: boolean = false) {
  const [myEntries, setMyEntries] = useState<SeasonEntry[]>([]);
  const [allEntries, setAllEntries] = useState<SeasonEntry[]>([]);
  const [allWithProfiles, setAllWithProfiles] = useState<SeasonEntry[]>([]);
  const [entriesOnDate, setEntriesOnDate] = useState<SeasonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyEntries = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('season_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('in_date');
    setMyEntries(data ?? []);
  }, []);

  const fetchAllEntries = useCallback(async () => {
    const { data } = await supabase
      .from('season_entries')
      .select('id, user_id, in_date, out_date');
    setAllEntries((data ?? []) as SeasonEntry[]);
  }, []);

  const fetchAllWithProfiles = useCallback(async () => {
    if (!isMaster) {
      setAllWithProfiles([]);
      return;
    }
    const { data } = await supabase
      .from('season_entries')
      .select('*, profiles(nickname, avatar_url)')
      .order('in_date');
    setAllWithProfiles((data ?? []) as SeasonEntry[]);
  }, [isMaster]);

  const fetchEntriesOnDate = useCallback(async (date: Date) => {
    const dateStr = formatYmd(date);
    const { data } = await supabase
      .from('season_entries')
      .select('*, profiles(nickname)')
      .lte('in_date', dateStr)
      .gte('out_date', dateStr);
    setEntriesOnDate(data ?? []);
  }, []);

  useEffect(() => {
    Promise.all([fetchMyEntries(), fetchAllEntries(), fetchAllWithProfiles()]).then(() =>
      setLoading(false),
    );
  }, [fetchMyEntries, fetchAllEntries, fetchAllWithProfiles]);

  useEffect(() => {
    fetchEntriesOnDate(selectedDate);
  }, [selectedDate, fetchEntriesOnDate]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      fetchMyEntries(),
      fetchAllEntries(),
      fetchAllWithProfiles(),
      fetchEntriesOnDate(selectedDate),
    ]);
  }, [fetchMyEntries, fetchAllEntries, fetchAllWithProfiles, fetchEntriesOnDate, selectedDate]);

  const saveEntry = async (params: {
    editingId: string | 'new';
    inDate: Date;
    outDate: Date;
    targetUserId?: string;
  }): Promise<{ ok: true } | { ok: false; message: string }> => {
    const { editingId, inDate, outDate, targetUserId } = params;
    if (formatYmd(inDate) === formatYmd(outDate)) {
      return { ok: false, message: '인 날짜와 아웃 날짜는 같을 수 없습니다.' };
    }
    if (inDate > outDate) {
      return { ok: false, message: '인 날짜는 아웃 날짜보다 이전이어야 합니다.' };
    }

    const { error } = await supabase.rpc('upsert_season_entry', {
      p_entry_id: editingId === 'new' ? null : editingId,
      p_in_date: formatYmd(inDate),
      p_out_date: formatYmd(outDate),
      p_target_user_id: targetUserId ?? null,
    });
    if (error) return { ok: false, message: error.message };

    await refetchAll();
    return { ok: true };
  };

  const deleteEntry = (id: string) => {
    const performDelete = async () => {
      const { error } = await supabase.from('season_entries').delete().eq('id', id);
      if (error) {
        Alert.alert('오류', error.message);
        return;
      }
      await refetchAll();
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('이 일정을 삭제할까요?')) performDelete();
    } else {
      Alert.alert('삭제', '이 일정을 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  return {
    myEntries,
    allEntries,
    allWithProfiles,
    entriesOnDate,
    loading,
    saveEntry,
    deleteEntry,
    refresh: refetchAll,
  };
}
