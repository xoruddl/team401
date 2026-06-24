import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabase';
import { useProfile } from '../features/mypage/hooks/useProfile';
import { Notice } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';
import { EmptyState } from '../components/EmptyState';
import { ListFooterLoader } from '../components/ListFooterLoader';
import { useNotices } from '../features/notice/hooks/useNotices';
import { NoticeCard } from '../features/notice/components/NoticeCard';
import { NoticeFormModal } from '../features/notice/components/NoticeFormModal';

export default function NoticeScreen() {
  const { profile, isAdmin } = useProfile();
  const myId = profile?.id ?? null;

  const {
    pinned,
    items,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
    pin,
    unpin,
    moveUp,
    moveDown,
  } = useNotices();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCompose = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleSubmit = useCallback(async () => {
    const t = title.trim();
    const c = content.trim();
    if (!t) return Alert.alert('오류', '제목을 입력하세요.');
    if (!c) return Alert.alert('오류', '내용을 입력하세요.');
    if (!myId) return;

    setSubmitting(true);
    const { error } = editingId
      ? await supabase.from('notices').update({ title: t, content: c }).eq('id', editingId)
      : await supabase.from('notices').insert({ title: t, content: c, author_id: myId });
    setSubmitting(false);

    if (error) {
      Alert.alert('오류', error.message);
      return;
    }
    closeModal();
    await refresh();
  }, [title, content, myId, editingId, refresh]);

  const handleDelete = (notice: Notice) => {
    Alert.alert('삭제', '공지사항을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notices').delete().eq('id', notice.id);
          if (error) Alert.alert('오류', error.message);
          else await refresh();
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => {
          const pinnedIdx = item.pinned_order != null
            ? pinned.findIndex((p) => p.id === item.id)
            : -1;
          return (
            <NoticeCard
              notice={item}
              isAdmin={isAdmin}
              canMoveUp={pinnedIdx > 0}
              canMoveDown={pinnedIdx >= 0 && pinnedIdx < pinned.length - 1}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
              onPin={() => pin(item)}
              onUnpin={() => unpin(item)}
              onMoveUp={() => moveUp(item)}
              onMoveDown={() => moveDown(item)}
            />
          );
        }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isAdmin ? (
            <TouchableOpacity
              className="bg-[#1a1a1a] rounded-xl p-3.5 items-center mb-3"
              onPress={openCompose}
            >
              <Text className="text-white font-bold text-[15px]">+ 공지 작성</Text>
            </TouchableOpacity>
          ) : null
        }
        ListFooterComponent={<ListFooterLoader visible={loadingMore} />}
        ListEmptyComponent={<EmptyState message="등록된 공지사항이 없습니다." />}
      />

      <NoticeFormModal
        visible={modalVisible}
        editing={!!editingId}
        title={title}
        content={content}
        submitting={submitting}
        onChangeTitle={setTitle}
        onChangeContent={setContent}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
