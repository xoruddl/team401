import { Text, View } from 'react-native';
import { VoteEntry } from '../../../types';
import { Avatar } from '../../../components/Avatar';

type Props = {
  entries: VoteEntry[];
  myUserId: string | null;
  capacity: number;
  showOwnBoard: boolean;
};

export function VoteParticipantList({ entries, myUserId, capacity, showOwnBoard }: Props) {
  return (
    <View className="mt-2 gap-1.5">
      {[...entries]
        .sort((a, b) => a.queue_number - b.queue_number)
        .map((e) => {
          const isConfirmed = e.status === 'confirmed';
          const isMine = e.user_id === myUserId;
          return (
            <View
              key={e.id}
              className="flex-row items-center justify-between py-1.5"
            >
              <View className="flex-row items-center gap-2 flex-1">
                <Avatar uri={e.profiles?.avatar_url} size="md" />
                <Text
                  className={`text-sm ${isMine ? 'font-bold text-[#1a1a1a]' : 'text-[#333]'}`}
                >
                  {e.profiles?.nickname ?? '알 수 없음'}
                  {isMine ? ' (나)' : ''}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {showOwnBoard && e.uses_own_board && (
                  <View className="px-2 py-0.5 rounded-full bg-[#e3f2fd]">
                    <Text className="text-[11px] font-semibold text-[#1565c0]">🛹 개인</Text>
                  </View>
                )}
                <View
                  className={`px-2 py-0.5 rounded-full ${isConfirmed ? 'bg-[#e8f5e9]' : 'bg-[#fff3e0]'}`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${isConfirmed ? 'text-[#2e7d32]' : 'text-[#ef6c00]'}`}
                  >
                    {isConfirmed
                      ? `${e.queue_number}번 확정`
                      : `대기 ${e.queue_number - capacity}번`}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
    </View>
  );
}
