import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useProfile } from '../mypage/useProfile';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useVotes, VoteWithEntries } from './useVotes';
import { VoteCard } from './VoteCard';
import { VoteCreateModal } from './VoteCreateModal';
import { VoteCapacityModal } from './VoteCapacityModal';

export default function VoteScreen() {
  const { profile, isAdmin } = useProfile();
  const myUserId = profile?.id ?? null;

  const {
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
    refresh,
  } = useVotes();

  const { refreshing, onRefresh } = usePullToRefresh(refresh);

  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [capacityEditingVote, setCapacityEditingVote] = useState<VoteWithEntries | null>(null);
  const [updatingCapacity, setUpdatingCapacity] = useState(false);

  if (loading) return <LoadingScreen background={false} />;

  const handleCreate = async (params: Parameters<typeof create>[0]) => {
    setCreating(true);
    const result = await create(params);
    setCreating(false);
    if (!result.ok) {
      Alert.alert('오류', result.message);
      return;
    }
    setModalVisible(false);
  };

  const handleUpdateCapacity = async (capacity: number) => {
    if (!capacityEditingVote) return;
    setUpdatingCapacity(true);
    const result = await updateCapacity(capacityEditingVote.id, capacity);
    setUpdatingCapacity(false);
    if (!result.ok) {
      Alert.alert('오류', result.message);
      return;
    }
    setCapacityEditingVote(null);
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      <FlatList
        data={votes}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => {
          const myEntry = item.vote_entries.find((e) => e.user_id === myUserId);
          return (
            <VoteCard
              vote={item}
              myUserId={myUserId}
              isAdmin={isAdmin}
              joining={joiningId === item.id}
              onJoin={() => join(item.id)}
              onLeave={() => myEntry && leave(myEntry.id)}
              onClose={() => close(item.id)}
              onDelete={() => remove(item.id)}
              onToggleOwnBoard={() =>
                myEntry && setOwnBoard(myEntry.id, !myEntry.uses_own_board)
              }
              onEditCapacity={() => setCapacityEditingVote(item)}
            />
          );
        }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState message="투표가 없습니다." />}
        ListHeaderComponent={
          isAdmin ? (
            <TouchableOpacity
              className="bg-[#1e88e5] rounded-[10px] p-3.5 items-center mb-3"
              onPress={() => setModalVisible(true)}
            >
              <Text className="text-white font-bold text-[15px]">+ 투표 만들기</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <VoteCreateModal
        visible={modalVisible}
        creating={creating}
        onCancel={() => setModalVisible(false)}
        onSubmit={(params) =>
          myUserId && handleCreate({ ...params, createdBy: myUserId })
        }
      />

      <VoteCapacityModal
        vote={capacityEditingVote}
        submitting={updatingCapacity}
        onCancel={() => setCapacityEditingVote(null)}
        onSubmit={handleUpdateCapacity}
      />
    </View>
  );
}
