import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatMonthDayTime } from '../../../utils/date';
import { getServerNow } from '../../../services/serverTime';
import { VOTE_CATEGORY_LABEL } from '../../../types';
import { VoteWithEntries, getVoteStatus } from '../hooks/useVotes';
import { VoteParticipantList } from './VoteParticipantList';

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  riding: 'bg-[#e3f2fd] text-[#1565c0]',
  mt: 'bg-[#fce4ec] text-[#c2185b]',
  etc: 'bg-[#eceff1] text-[#455a64]',
};

type Props = {
  vote: VoteWithEntries;
  myUserId: string | null;
  isAdmin: boolean;
  joining: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onClose: () => void;
  onDelete: () => void;
  onToggleOwnBoard: () => void;
  onEditCapacity: () => void;
};

export function VoteCard({
  vote,
  myUserId,
  isAdmin,
  joining,
  onJoin,
  onLeave,
  onClose,
  onDelete,
  onToggleOwnBoard,
  onEditCapacity,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const status = getVoteStatus(vote);
  const isRiding = vote.category === 'riding';
  const opensInMs =
    status === 'scheduled' ? new Date(vote.opens_at).getTime() - getServerNow() : 0;
  const showCountdown = opensInMs > 0 && opensInMs <= 60_000;
  const myEntry = vote.vote_entries.find((e) => e.user_id === myUserId);
  const confirmed = vote.vote_entries.filter((e) => e.status === 'confirmed').length;
  const waiting = vote.vote_entries.filter((e) => e.status === 'waiting').length;
  const ownBoardCount = vote.vote_entries.filter((e) => e.uses_own_board).length;
  const statusLabel = status === 'scheduled' ? '예약됨' : status === 'open' ? '진행중' : '종료';
  const statusBadgeClass = status === 'open' ? 'bg-[#1e88e5]' : 'bg-[#9e9e9e]';
  const categoryBadgeClass = CATEGORY_BADGE_CLASS[vote.category] ?? 'bg-[#eee] text-[#555]';
  const [categoryBg, categoryText] = categoryBadgeClass.split(' ');

  return (
    <View className="bg-white rounded-xl p-4 shadow shadow-black/[0.08]">
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center gap-2">
          <View className={`px-2.5 py-1 rounded-full ${statusBadgeClass}`}>
            <Text className="text-white text-xs font-semibold">{statusLabel}</Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full ${categoryBg}`}>
            <Text className={`text-xs font-semibold ${categoryText}`}>
              {VOTE_CATEGORY_LABEL[vote.category]}
            </Text>
          </View>
        </View>
        {isAdmin && (
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onEditCapacity}>
              <Text className="text-[#666] text-[13px]">정원</Text>
            </TouchableOpacity>
            {status === 'open' && (
              <TouchableOpacity onPress={onClose}>
                <Text className="text-[#666] text-[13px]">종료</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDelete}>
              <Text className="text-[#e53935] text-[13px]">삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text className="text-[17px] font-bold mb-1">{vote.title}</Text>
      {vote.description ? (
        <Text className="text-sm text-[#555] mb-1.5">{vote.description}</Text>
      ) : null}

      {showCountdown && (
        <View className="bg-[#e3f2fd] px-3 py-2 rounded-md mb-2 self-start">
          <Text className="text-[#1565c0] font-bold text-[14px]">
            곧 시작 · {Math.ceil(opensInMs / 1000)}초
          </Text>
        </View>
      )}

      <Text className="text-[13px] text-[#888] mb-3">
        {status === 'scheduled' ? `오픈: ${formatMonthDayTime(new Date(vote.opens_at))}  ` : ''}
        확정 {confirmed}/{vote.capacity}명
        {waiting > 0 ? `  |  대기 ${waiting}명` : ''}
        {isRiding && ownBoardCount > 0 ? `  |  개인보드 ${ownBoardCount}명` : ''}
      </Text>

      {myEntry ? (
        <View className="gap-2">
          <View className="flex-row items-center gap-3">
            <View
              className={`px-3.5 py-2 rounded-full ${
                myEntry.status === 'confirmed' ? 'bg-[#43a047]' : 'bg-[#fb8c00]'
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {myEntry.status === 'confirmed'
                  ? `✓ ${myEntry.queue_number}번 확정`
                  : `⏳ 대기 ${myEntry.queue_number - vote.capacity}번`}
              </Text>
            </View>
            {status !== 'closed' && (
              <TouchableOpacity onPress={onLeave}>
                <Text className="text-[#e53935] text-[13px]">취소</Text>
              </TouchableOpacity>
            )}
          </View>

          {isRiding && status !== 'closed' && (
            <TouchableOpacity
              onPress={onToggleOwnBoard}
              className={`self-start px-3 py-1.5 rounded-full border ${
                myEntry.uses_own_board
                  ? 'bg-[#e3f2fd] border-[#1565c0]'
                  : 'bg-white border-[#ddd]'
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  myEntry.uses_own_board ? 'text-[#1565c0]' : 'text-[#888]'
                }`}
              >
                🛹 {myEntry.uses_own_board ? '개인보드 사용 중' : '개인보드 사용'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : status === 'open' ? (
        <TouchableOpacity
          className={`bg-[#1e88e5] rounded-lg p-3 items-center ${joining ? 'opacity-60' : ''}`}
          onPress={onJoin}
          disabled={joining}
        >
          <Text className="text-white font-bold text-[15px]">
            {joining ? '참여 중...' : '참여하기'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {vote.vote_entries.length > 0 && (
        <View className="mt-3 pt-3 border-t border-[#f0f0f0]">
          <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
            <Text className="text-[13px] text-[#1e88e5] font-semibold">
              {expanded
                ? '참여자 숨기기 ▴'
                : `참여자 ${vote.vote_entries.length}명 보기 ▾`}
            </Text>
          </TouchableOpacity>

          {expanded && (
            <VoteParticipantList
              entries={vote.vote_entries}
              myUserId={myUserId}
              capacity={vote.capacity}
              showOwnBoard={isRiding}
            />
          )}
        </View>
      )}
    </View>
  );
}
