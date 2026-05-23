import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useProfile } from '../mypage/useProfile';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkateboardWithActiveRental } from '../../types';
import { useSkateboards } from './useSkateboards';
import { SkateboardCard } from './SkateboardCard';
import { SkateboardFormModal } from './SkateboardFormModal';

type GridItem = SkateboardWithActiveRental | { __placeholder: true; id: string };

export default function SkateboardRentalScreen() {
  const { profile, isAdmin } = useProfile();
  const myId = profile?.id ?? null;

  const {
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
  } = useSkateboards();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<SkateboardWithActiveRental | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const paddedItems = useMemo<GridItem[]>(() => {
    const remainder = items.length % 3;
    if (remainder === 0) return items;
    const fillers: GridItem[] = Array.from({ length: 3 - remainder }, (_, i) => ({
      __placeholder: true as const,
      id: `__filler_${i}`,
    }));
    return [...items, ...fillers];
  }, [items]);

  if (loading) return <LoadingScreen />;

  const availableCount = items.filter((i) => i.active && !i.activeRental).length;
  const rentedCount = items.filter((i) => i.activeRental).length;

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (board: SkateboardWithActiveRental) => {
    setEditing(board);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
  };

  const handleSubmit = async (params: {
    number: number;
    notes: string | null;
    active: boolean;
  }) => {
    setSubmitting(true);
    const result = await upsertBoard({ editingId: editing?.id ?? null, ...params });
    setSubmitting(false);
    if (!result.ok) return;
    closeModal();
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      <FlatList
        data={paddedItems}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => {
          if ('__placeholder' in item) return <View className="flex-1" />;
          return (
            <SkateboardCard
              board={item}
              myId={myId}
              isAdmin={isAdmin}
              busy={busyBoardId === item.id}
              onRent={() => myId && rent(item, myId)}
              onReturn={() => returnBoard(item)}
              onForceReturn={() => forceReturn(item)}
              onEdit={() => openEdit(item)}
              onDelete={() => removeBoard(item)}
            />
          );
        }}
        numColumns={3}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={
          <View className="gap-3 mb-1">
            <View className="flex-row gap-2">
              <View className="flex-1 bg-white rounded-xl p-3 items-center shadow-sm shadow-black/[0.06]">
                <Text className="text-xs text-[#888]">대여 가능</Text>
                <Text className="text-xl font-bold text-[#43a047]">{availableCount}</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 items-center shadow-sm shadow-black/[0.06]">
                <Text className="text-xs text-[#888]">대여 중</Text>
                <Text className="text-xl font-bold text-[#ef6c00]">{rentedCount}</Text>
              </View>
            </View>

            {isAdmin && (
              <TouchableOpacity
                className="bg-[#1a1a1a] rounded-xl p-3.5 items-center"
                onPress={openCreate}
              >
                <Text className="text-white font-bold text-[15px]">+ 보드 추가</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            message={`등록된 보드가 없습니다.${isAdmin ? ' + 버튼으로 추가하세요.' : ''}`}
          />
        }
      />

      <SkateboardFormModal
        visible={modalVisible}
        editing={editing}
        submitting={submitting}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
