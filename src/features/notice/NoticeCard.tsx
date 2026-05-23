import { Text, TouchableOpacity, View } from 'react-native';
import { Notice } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { formatRelativeTime } from '../../utils/date';

type Props = {
  notice: Notice;
  isAdmin: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function NoticeCard({
  notice,
  isAdmin,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onMoveUp,
  onMoveDown,
}: Props) {
  const author = notice.profiles;
  const edited = notice.updated_at !== notice.created_at;
  const isPinned = notice.pinned_order != null;

  const borderClass = isPinned ? 'border-[#ea580c]' : 'border-[#fbbf24]';

  return (
    <View
      className={`bg-white rounded-xl p-4 gap-2 border-l-4 ${borderClass} shadow-sm shadow-black/[0.06]`}
    >
      <View className="flex-row items-center gap-2">
        {isPinned && (
          <View className="px-2 py-0.5 rounded-md bg-[#ffedd5]">
            <Text className="text-[11px] font-bold text-[#9a3412]">📌 고정</Text>
          </View>
        )}
        <View className="px-2 py-0.5 rounded-md bg-[#fef3c7]">
          <Text className="text-[11px] font-bold text-[#92400e]">📢 공지</Text>
        </View>
        <Text className="text-xs text-[#aaa]">
          {formatRelativeTime(notice.created_at)}
          {edited ? ' (수정됨)' : ''}
        </Text>
      </View>

      <Text className="text-base font-bold text-[#1a1a1a]">{notice.title}</Text>
      <Text className="text-sm text-[#333] leading-5">{notice.content}</Text>

      <View className="flex-row items-center gap-2 mt-1">
        <Avatar uri={author?.avatar_url} size="sm" />
        <Text className="text-xs text-[#888]">{author?.nickname ?? '관리자'}</Text>
      </View>

      {isAdmin && (
        <View className="flex-row flex-wrap justify-end gap-x-3 gap-y-1.5 mt-1">
          {isPinned ? (
            <>
              <TouchableOpacity onPress={onMoveUp} disabled={!canMoveUp}>
                <Text
                  className={`text-sm ${canMoveUp ? 'text-[#666]' : 'text-[#ccc]'}`}
                >
                  ▲ 위로
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onMoveDown} disabled={!canMoveDown}>
                <Text
                  className={`text-sm ${canMoveDown ? 'text-[#666]' : 'text-[#ccc]'}`}
                >
                  ▼ 아래로
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onUnpin}>
                <Text className="text-sm text-[#9a3412]">고정 해제</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={onPin}>
              <Text className="text-sm text-[#ea580c]">📌 고정</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onEdit}>
            <Text className="text-sm text-[#1e88e5]">수정</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <Text className="text-sm text-[#e53935]">삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
