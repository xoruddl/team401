import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';
import {
  Skateboard,
  SkateboardRental,
  SkateboardWithActiveRental,
} from '../../types';

export function useSkateboards() {
  const [items, setItems] = useState<SkateboardWithActiveRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyBoardId, setBusyBoardId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const [bResp, rResp] = await Promise.all([
      supabase
        .from('skateboards')
        .select('id, number, notes, active, created_at')
        .order('number'),
      supabase
        .from('skateboard_rentals')
        .select(
          'id, skateboard_id, user_id, rented_at, returned_at, notes, created_at, profiles(id, nickname, avatar_url)',
        )
        .is('returned_at', null),
    ]);

    if (bResp.error) {
      Alert.alert('오류', '보드 목록을 불러오지 못했습니다.');
      return;
    }

    const rentalByBoard = new Map<string, SkateboardRental>();
    for (const r of (rResp.data ?? []) as unknown as SkateboardRental[]) {
      rentalByBoard.set(r.skateboard_id, r);
    }

    const merged: SkateboardWithActiveRental[] = (bResp.data ?? []).map(
      (b: Skateboard) => ({
        ...b,
        activeRental: rentalByBoard.get(b.id) ?? null,
      }),
    );
    setItems(merged);
  }, []);

  useEffect(() => {
    fetchItems().then(() => setLoading(false));
  }, [fetchItems]);

  // Realtime: 다른 사람의 대여/반납이나 운영자의 보드 추가/수정/삭제를 즉시 반영.
  // 동시 대여 시도 시 진 사람이 미리 빨간색 보고 못 누르도록.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        fetchItems();
      }, 300);
    };

    const channel = supabase
      .channel('skateboards_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skateboards' },
        scheduleRefetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skateboard_rentals' },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const rent = async (board: SkateboardWithActiveRental, userId: string) => {
    if (!board.active) return Alert.alert('알림', '이 보드는 현재 사용할 수 없습니다.');
    if (board.activeRental) return Alert.alert('알림', '이미 누군가 대여 중입니다.');

    setBusyBoardId(board.id);
    const { error } = await supabase
      .from('skateboard_rentals')
      .insert({ skateboard_id: board.id, user_id: userId });
    setBusyBoardId(null);

    if (error) {
      // partial unique index 위반 = 동시 대여 race에서 진 케이스
      const isRaceLoss =
        error.code === '23505' || error.message.includes('skateboard_rentals_active_unique');
      if (isRaceLoss) {
        await fetchItems();
        return Alert.alert('알림', '방금 다른 사람이 먼저 빌렸습니다.');
      }
      return Alert.alert('오류', error.message);
    }
    await fetchItems();
  };

  const returnBoard = async (board: SkateboardWithActiveRental) => {
    const rental = board.activeRental;
    if (!rental) return;

    setBusyBoardId(board.id);
    const { error } = await supabase
      .from('skateboard_rentals')
      .update({ returned_at: new Date().toISOString() })
      .eq('id', rental.id);
    setBusyBoardId(null);

    if (error) return Alert.alert('오류', error.message);
    await fetchItems();
  };

  const forceReturn = (board: SkateboardWithActiveRental) => {
    if (!board.activeRental) return;
    Alert.alert(
      '강제 반납',
      `${board.activeRental.profiles?.nickname ?? '대여자'}의 #${board.number} 보드를 반납 처리할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '반납 처리', style: 'destructive', onPress: () => returnBoard(board) },
      ],
    );
  };

  const upsertBoard = async (params: {
    editingId: string | null;
    number: number;
    notes: string | null;
    active: boolean;
  }): Promise<{ ok: true } | { ok: false; message: string }> => {
    const payload = {
      number: params.number,
      notes: params.notes,
      active: params.active,
    };
    const { error } = params.editingId
      ? await supabase.from('skateboards').update(payload).eq('id', params.editingId)
      : await supabase.from('skateboards').insert(payload);
    if (error) return { ok: false, message: error.message };
    await fetchItems();
    return { ok: true };
  };

  const removeBoard = (board: SkateboardWithActiveRental) => {
    if (board.activeRental) {
      return Alert.alert(
        '알림',
        '대여 중인 보드는 삭제할 수 없습니다. 먼저 반납 처리하세요.',
      );
    }
    Alert.alert(
      '삭제',
      `#${board.number} 보드를 삭제할까요? (이전 대여 기록도 모두 삭제됩니다)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('skateboards')
              .delete()
              .eq('id', board.id);
            if (error) Alert.alert('오류', error.message);
            else await fetchItems();
          },
        },
      ],
    );
  };

  return {
    items,
    loading,
    refreshing,
    busyBoardId,
    refresh,
    rent,
    returnBoard,
    forceReturn,
    upsertBoard,
    removeBoard,
  };
}
