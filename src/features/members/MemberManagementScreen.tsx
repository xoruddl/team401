import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useProfile } from '../mypage/useProfile';
import { Profile, Role } from '../../types';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { MemberRow } from './MemberRow';

const ROLE_PRIORITY: Record<Role, number> = {
  master: 0,
  admin: 1,
  member: 2,
  pending: 2,
};

export default function MemberManagementScreen() {
  const { profile: me, isAdmin, isMaster, loading: profileLoading } = useProfile();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: true });
    if (error) {
      Alert.alert('오류', '회원 목록을 불러오지 못했습니다.');
      return;
    }
    setMembers((data ?? []) as Profile[]);
  }, []);

  useEffect(() => {
    fetchMembers().then(() => setLoading(false));
  }, [fetchMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const p = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
        if (p !== 0) return p;
        return (a.nickname ?? '').localeCompare(b.nickname ?? '', 'ko');
      }),
    [members],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) => (m.nickname ?? '').toLowerCase().includes(q));
  }, [sorted, search]);

  const pendingCount = useMemo(
    () => members.filter((m) => m.role === 'pending').length,
    [members],
  );

  const changeRole = async (target: Profile, nextRole: Role) => {
    setUpdatingId(target.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', target.id);
    setUpdatingId(null);

    if (error) {
      Alert.alert('오류', error.message);
      return;
    }
    await fetchMembers();
  };

  if (profileLoading || loading) return <LoadingScreen />;

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f5f5] p-6">
        <Text className="text-base text-[#666]">운영자만 접근 가능합니다.</Text>
      </View>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <FlatList
      className="bg-[#f5f5f5]"
      data={filtered}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <MemberRow
          member={item}
          isSelf={item.id === me?.id}
          isMaster={isMaster}
          busy={updatingId === item.id}
          onChangeRole={(newRole) => changeRole(item, newRole)}
        />
      )}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View className="gap-2 mb-2">
          <View className="flex-row items-center gap-2 bg-white border border-[#ddd] rounded-lg px-3">
            <Text className="text-base text-[#888]">🔍</Text>
            <TextInput
              className="flex-1 py-3 text-[15px] text-[#1a1a1a]"
              value={search}
              onChangeText={setSearch}
              placeholder="이름 검색"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {isSearching && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text className="text-base text-[#888]">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isSearching && pendingCount > 0 && (
            <View className="bg-[#fef3c7] border border-[#fbbf24] rounded-xl p-3">
              <Text className="text-sm font-semibold text-[#92400e]">
                승인 대기 중인 회원 {pendingCount}명
              </Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          message={isSearching ? '검색 결과가 없습니다.' : '회원이 없습니다.'}
        />
      }
    />
  );
}
