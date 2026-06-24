import { Text, TouchableOpacity, View } from 'react-native';
import { SkateboardWithActiveRental } from '../../../types';
import { formatRelativeTime } from '../../../utils/date';

type Props = {
  board: SkateboardWithActiveRental;
  myId: string | null;
  isAdmin: boolean;
  busy: boolean;
  onRent: () => void;
  onReturn: () => void;
  onForceReturn: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SkateboardCard({
  board,
  myId,
  isAdmin,
  busy,
  onRent,
  onReturn,
  onForceReturn,
  onEdit,
  onDelete,
}: Props) {
  const rental = board.activeRental;
  const isMine = rental?.user_id === myId;
  const inactive = !board.active;

  const showRent = !inactive && !rental;
  const showReturn = !!rental && isMine;
  const showForceReturn = !!rental && !isMine && isAdmin;

  const headerBg = inactive
    ? 'bg-[#e0e0e0]'
    : rental
      ? 'bg-[#fff3e0]'
      : 'bg-[#e8f5e9]';

  return (
    <View
      className={`flex-1 bg-white rounded-xl p-2.5 gap-2 shadow-sm shadow-black/[0.06] ${inactive ? 'opacity-60' : ''}`}
    >
      <View className={`rounded-lg py-3 items-center ${headerBg}`}>
        <Text className="text-2xl">🛹</Text>
        <Text className="text-base font-bold text-[#1a1a1a]">#{board.number}</Text>
      </View>

      <View className="items-center min-h-[36px] justify-center">
        {inactive ? (
          <Text className="text-[11px] font-semibold text-[#666]">사용 불가</Text>
        ) : rental ? (
          <View className="items-center gap-0.5">
            <Text
              className="text-[11px] font-semibold text-[#ef6c00] text-center"
              numberOfLines={1}
            >
              {rental.profiles?.nickname ?? '알 수 없음'}
              {isMine ? ' (나)' : ''}
            </Text>
            <Text className="text-[10px] text-[#999]">
              {formatRelativeTime(rental.rented_at)}
            </Text>
          </View>
        ) : (
          <Text className="text-[11px] font-semibold text-[#43a047]">대여 가능</Text>
        )}
      </View>

      {showRent && (
        <TouchableOpacity
          className={`py-2 rounded-lg items-center bg-[#1e88e5] ${busy ? 'opacity-60' : ''}`}
          onPress={onRent}
          disabled={busy}
        >
          <Text className="text-white font-semibold text-xs">{busy ? '...' : '빌리기'}</Text>
        </TouchableOpacity>
      )}
      {showReturn && (
        <TouchableOpacity
          className={`py-2 rounded-lg items-center bg-[#43a047] ${busy ? 'opacity-60' : ''}`}
          onPress={onReturn}
          disabled={busy}
        >
          <Text className="text-white font-semibold text-xs">{busy ? '...' : '반납'}</Text>
        </TouchableOpacity>
      )}
      {showForceReturn && (
        <TouchableOpacity
          className="py-2 rounded-lg items-center bg-[#ef6c00]"
          onPress={onForceReturn}
          disabled={busy}
        >
          <Text className="text-white font-semibold text-xs">강제 반납</Text>
        </TouchableOpacity>
      )}
      {!showRent && !showReturn && !showForceReturn && <View className="py-2" />}

      {isAdmin && (
        <View className="flex-row justify-center gap-3 pt-0.5">
          <TouchableOpacity onPress={onEdit}>
            <Text className="text-[11px] text-[#1e88e5]">수정</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <Text className="text-[11px] text-[#e53935]">삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
