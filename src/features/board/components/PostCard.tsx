import { Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../../types';
import { Avatar } from '../../../components/Avatar';
import { formatRelativeTime } from '../../../utils/date';

type Props = {
  post: Post;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function PostCard({ post, canEdit, canDelete, onEdit, onDelete }: Props) {
  const author = post.profiles;
  const edited = post.updated_at !== post.created_at;

  return (
    <View className="bg-white rounded-xl p-4 gap-2 shadow-sm shadow-black/[0.06]">
      <View className="flex-row items-center gap-2">
        <Avatar uri={author?.avatar_url} size="md" />
        <Text className="text-sm text-[#1a1a1a] font-semibold">
          {author?.nickname ?? '알 수 없음'}
        </Text>
        <Text className="text-xs text-[#aaa]">
          · {formatRelativeTime(post.created_at)}
          {edited ? ' (수정됨)' : ''}
        </Text>
      </View>

      <Text className="text-base font-bold text-[#1a1a1a]">{post.title}</Text>
      <Text className="text-sm text-[#333] leading-5">{post.content}</Text>

      {(canEdit || canDelete) && (
        <View className="flex-row justify-end gap-3 mt-1">
          {canEdit && (
            <TouchableOpacity onPress={onEdit}>
              <Text className="text-sm text-[#1e88e5]">수정</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity onPress={onDelete}>
              <Text className="text-sm text-[#e53935]">삭제</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
