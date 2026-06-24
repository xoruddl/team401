import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabase';
import { useProfile } from '../features/mypage/hooks/useProfile';
import { Post } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';
import { EmptyState } from '../components/EmptyState';
import { ListFooterLoader } from '../components/ListFooterLoader';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { PostCard } from '../features/board/components/PostCard';
import { PostFormModal } from '../features/board/components/PostFormModal';

const fetchPostsPage = async (cursor: string | null, limit: number) => {
  let query = supabase
    .from('posts')
    .select(
      'id, author_id, title, content, created_at, updated_at, profiles(id, nickname, avatar_url)',
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt('created_at', cursor);
  const { data, error } = await query;
  if (error) {
    Alert.alert('오류', '게시글을 불러오지 못했습니다.');
    return [];
  }
  return (data ?? []) as unknown as Post[];
};

export default function BoardScreen() {
  const { profile, isAdmin } = useProfile();
  const myId = profile?.id ?? null;

  const {
    items: posts,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
  } = usePaginatedList<Post>({
    fetchPage: fetchPostsPage,
    getCursor: (p) => p.created_at,
  });

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

  const openEdit = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
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
      ? await supabase.from('posts').update({ title: t, content: c }).eq('id', editingId)
      : await supabase.from('posts').insert({ title: t, content: c, author_id: myId });
    setSubmitting(false);

    if (error) {
      Alert.alert('오류', error.message);
      return;
    }
    closeModal();
    await refresh();
  }, [title, content, myId, editingId, refresh]);

  const handleDelete = (post: Post) => {
    Alert.alert('삭제', '게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('posts').delete().eq('id', post.id);
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
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            canEdit={item.author_id === myId}
            canDelete={item.author_id === myId || isAdmin}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-[#1e88e5] rounded-xl p-3.5 items-center mb-3"
            onPress={openCompose}
          >
            <Text className="text-white font-bold text-[15px]">+ 글쓰기</Text>
          </TouchableOpacity>
        }
        ListFooterComponent={<ListFooterLoader visible={loadingMore} />}
        ListEmptyComponent={
          <EmptyState message="아직 게시글이 없습니다. 첫 글을 남겨보세요." />
        }
      />

      <PostFormModal
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
