import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { getServerNow, syncServerTime } from '../../lib/serverTime';
import { Vote, VoteCategory, VoteEntry } from '../../types';

export type VoteWithEntries = Vote & { vote_entries: VoteEntry[] };

export type VoteStatus = 'scheduled' | 'open' | 'closed';

export const getVoteStatus = (vote: Vote): VoteStatus => {
  const nowMs = getServerNow();
  if (new Date(vote.opens_at).getTime() > nowMs) return 'scheduled';
  if (vote.closes_at && new Date(vote.closes_at).getTime() <= nowMs) return 'closed';
  return 'open';
};

export function useVotes() {
  const [votes, setVotes] = useState<VoteWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [synced, setSynced] = useState(false);

  // 마운트 시 서버 시계 1회 동기화 → offset 적용 후 status 재평가 트리거
  useEffect(() => {
    syncServerTime().then(() => setSynced(true));
  }, []);

  const fetchVotes = useCallback(async () => {
    const { data } = await supabase
      .from('votes')
      .select('*, vote_entries(*, profiles(id, nickname, avatar_url))')
      .order('opens_at', { ascending: false });
    if (data) setVotes(data as unknown as VoteWithEntries[]);
  }, []);

  useEffect(() => {
    fetchVotes().then(() => setLoading(false));
  }, [fetchVotes]);

  // Realtime: 다른 사용자의 참여/취소/투표 생성 등을 즉시 반영. 짧은 burst를 묶기 위해 debounce.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        fetchVotes();
      }, 300);
    };

    const channel = supabase
      .channel('votes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        scheduleRefetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vote_entries' },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [fetchVotes]);

  // 시간 경과로 인한 상태 변화는 Realtime 이벤트가 아니므로 수동 re-render 필요.
  // 각 vote 의 opens_at / closes_at 시점에 setTimeout + 자가 보정 fire 로 정시 활성화.
  // serverNow (= Date.now() + offset) 기준으로 계산하므로 폰 시계 오차 무관.
  // sync 완료 시 dep 변경으로 effect 재실행 → 보정된 offset 으로 재스케줄.
  useEffect(() => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const scheduleAt = (iso: string) => {
      const targetMs = new Date(iso).getTime();
      const fire = () => {
        const remaining = targetMs - getServerNow();
        if (remaining <= 0) {
          // 정시 또는 그 이후: 즉시 status 재평가
          setTick((t) => t + 1);
        } else {
          // setTimeout 이 deadline 직전에 깨면 자가 보정 — 남은 시간만큼 다시 등록
          timers.push(setTimeout(fire, Math.max(remaining, 1)));
        }
      };
      const initialDelay = targetMs - getServerNow();
      if (initialDelay > 0 && initialDelay <= ONE_DAY) {
        timers.push(setTimeout(fire, initialDelay));
      }
    };

    for (const vote of votes) {
      scheduleAt(vote.opens_at);
      if (vote.closes_at) scheduleAt(vote.closes_at);
    }

    return () => timers.forEach(clearTimeout);
  }, [votes, synced]);

  // 60초 이내에 활성화/종료 예정인 vote 가 있으면 1초마다 tick → 카운트다운 UI 갱신
  useEffect(() => {
    const id = setInterval(() => {
      const now = getServerNow();
      const hasImminent = votes.some((v) => {
        const openIn = new Date(v.opens_at).getTime() - now;
        if (openIn > 0 && openIn <= 60_000) return true;
        if (v.closes_at) {
          const closeIn = new Date(v.closes_at).getTime() - now;
          if (closeIn > 0 && closeIn <= 60_000) return true;
        }
        return false;
      });
      if (hasImminent) setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [votes, synced]);

  // sleep/wake 등으로 정밀 타이머가 누락됐을 때 백업
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const join = async (voteId: string) => {
    setJoiningId(voteId);
    const { data, error } = await supabase.rpc('join_vote', { p_vote_id: voteId });
    setJoiningId(null);
    if (error) {
      Alert.alert(
        '오류',
        error.message.includes('not open')
          ? '투표가 아직 시작되지 않았습니다.'
          : '참여에 실패했습니다.',
      );
      return;
    }
    // RPC 반환값으로 즉시 로컬 state 업데이트 — 추가 refetch 왕복 생략
    if (data) {
      const newEntry = data as VoteEntry;
      setVotes((prev) =>
        prev.map((v) =>
          v.id === voteId
            ? { ...v, vote_entries: [...v.vote_entries, newEntry] }
            : v,
        ),
      );
    }
    // profile 데이터(닉네임/아바타) 채우기 위한 백그라운드 refetch — await 안 함
    fetchVotes();
  };

  const leave = (entryId: string) => {
    Alert.alert('참여 취소', '정말 참여를 취소하시겠습니까?', [
      { text: '아니요', style: 'cancel' },
      {
        text: '취소하기',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('vote_entries')
            .delete()
            .eq('id', entryId);
          if (error) {
            Alert.alert('오류', '취소에 실패했습니다.');
            return;
          }
          // 즉시 로컬 제거 — 본인 화면 바로 반영
          setVotes((prev) =>
            prev.map((v) => ({
              ...v,
              vote_entries: v.vote_entries.filter((e) => e.id !== entryId),
            })),
          );
          // 다른 사용자의 queue_number 재배치 등을 백그라운드로 갱신
          fetchVotes();
        },
      },
    ]);
  };

  const close = (voteId: string) => {
    Alert.alert('투표 종료', '투표를 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('votes')
            .update({ closes_at: new Date().toISOString() })
            .eq('id', voteId);
          await fetchVotes();
        },
      },
    ]);
  };

  const remove = (voteId: string) => {
    Alert.alert('삭제', '투표를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('votes').delete().eq('id', voteId);
          await fetchVotes();
        },
      },
    ]);
  };

  const create = async (params: {
    title: string;
    description: string | null;
    capacity: number;
    category: VoteCategory;
    opensAt: Date;
    closesAt: Date | null;
    createdBy: string;
  }): Promise<{ ok: true } | { ok: false; message: string }> => {
    const { error } = await supabase.from('votes').insert({
      title: params.title,
      description: params.description,
      capacity: params.capacity,
      category: params.category,
      opens_at: params.opensAt.toISOString(),
      closes_at: params.closesAt?.toISOString() ?? null,
      created_by: params.createdBy,
    });
    if (error) return { ok: false, message: error.message };
    await fetchVotes();
    return { ok: true };
  };

  const setOwnBoard = async (entryId: string, value: boolean) => {
    const { error } = await supabase.rpc('set_own_board', {
      p_entry_id: entryId,
      p_uses_own_board: value,
    });
    if (error) Alert.alert('오류', '개인보드 설정 변경에 실패했습니다.');
    else await fetchVotes();
  };

  const updateCapacity = async (
    voteId: string,
    capacity: number,
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    const { error } = await supabase
      .from('votes')
      .update({ capacity })
      .eq('id', voteId);
    if (error) return { ok: false, message: error.message };
    await fetchVotes();
    return { ok: true };
  };

  return {
    votes,
    loading,
    joiningId,
    join,
    leave,
    close,
    remove,
    create,
    setOwnBoard,
    updateCapacity,
    refresh: fetchVotes,
  };
}
