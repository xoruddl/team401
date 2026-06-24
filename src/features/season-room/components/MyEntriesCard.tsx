import { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SeasonEntry } from '../../../types';
import { Card } from '../../../components/Card';
import { formatMonthDayWeekday, formatYmd, parseYmd } from '../../../utils/date';
import { EntryEditForm } from './EntryEditForm';

type EditingId = string | null | 'new';

type Props = {
  entries: SeasonEntry[];
  editingId: EditingId;
  saving: boolean;
  isMaster: boolean;
  title?: string;
  showNickname?: boolean;
  onStartNew: () => void;
  onStartEdit: (entry: SeasonEntry) => void;
  onCancelEdit: () => void;
  onSave: (
    editingId: string | 'new',
    inDate: Date,
    outDate: Date,
    targetUserId?: string,
  ) => void;
  onDelete: (id: string) => void;
};

type UserGroup = {
  userId: string;
  nickname: string;
  totalNights: number;
  entries: SeasonEntry[];
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const nightsOf = (entry: SeasonEntry) => {
  const inMs = parseYmd(entry.in_date).getTime();
  const outMs = parseYmd(entry.out_date).getTime();
  return Math.round((outMs - inMs) / MS_PER_DAY);
};

export function MyEntriesCard({
  entries,
  editingId,
  saving,
  isMaster,
  title = '내 일정',
  showNickname = false,
  onStartNew,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: Props) {
  const today = new Date();
  const todayStr = formatYmd(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isPast = (entry: SeasonEntry) => entry.in_date < todayStr;

  const [expanded, setExpanded] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // 편집/추가 중에는 카드 강제 펼침
  useEffect(() => {
    if (editingId !== null) setExpanded(true);
  }, [editingId]);

  // 마스터 모드에서 entry 편집 시 해당 사용자 그룹 강제 펼침
  useEffect(() => {
    if (!showNickname || editingId === null || editingId === 'new') return;
    const target = entries.find((e) => e.id === editingId);
    if (!target) return;
    setExpandedUsers((prev) => {
      if (prev.has(target.user_id)) return prev;
      const next = new Set(prev);
      next.add(target.user_id);
      return next;
    });
  }, [editingId, entries, showNickname]);

  const groups = useMemo<UserGroup[]>(() => {
    if (!showNickname) return [];
    const map = new Map<string, UserGroup>();
    for (const entry of entries) {
      const existing = map.get(entry.user_id);
      const n = nightsOf(entry);
      if (existing) {
        existing.totalNights += n;
        existing.entries.push(entry);
      } else {
        map.set(entry.user_id, {
          userId: entry.user_id,
          nickname: entry.profiles?.nickname ?? '이름 없음',
          totalNights: n,
          entries: [entry],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.totalNights !== a.totalNights) return b.totalNights - a.totalNights;
      return a.nickname.localeCompare(b.nickname);
    });
  }, [entries, showNickname]);

  const headerCount = showNickname ? groups.length : entries.length;
  const headerCountLabel = showNickname ? `${headerCount}명` : `${headerCount}`;

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddPress = () => {
    setExpanded(true);
    onStartNew();
  };

  const renderEntryRow = (entry: SeasonEntry) => {
    const past = isPast(entry);
    const canDelete = isMaster || !past;

    if (editingId === entry.id) {
      return (
        <View key={entry.id} className="py-2 border-b border-[#f5f5f5]">
          <EntryEditForm
            initialIn={parseYmd(entry.in_date)}
            initialOut={parseYmd(entry.out_date)}
            saving={saving}
            onCancel={onCancelEdit}
            onSave={(inDate, outDate) => onSave(entry.id, inDate, outDate, entry.user_id)}
          />
        </View>
      );
    }

    return (
      <View
        key={entry.id}
        className="flex-row items-center justify-between py-2.5 border-b border-[#f5f5f5]"
      >
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[13px] text-[#4CAF50] font-semibold">
            IN {formatMonthDayWeekday(entry.in_date)}
          </Text>
          <Text className="text-[13px] text-[#ccc]">→</Text>
          <Text className="text-[13px] text-[#FF6B6B] font-semibold">
            OUT {formatMonthDayWeekday(entry.out_date)}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          <TouchableOpacity
            onPress={() => onStartEdit(entry)}
            className="px-2.5 py-1 rounded-md border border-[#ddd]"
          >
            <Text className="text-xs text-[#555]">수정</Text>
          </TouchableOpacity>
          {canDelete && (
            <TouchableOpacity
              onPress={() => onDelete(entry.id)}
              className="px-2.5 py-1 rounded-md border border-[#ffcdd2]"
            >
              <Text className="text-xs text-[#FF6B6B]">삭제</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Card>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity
          className="flex-row items-center gap-1.5 flex-1"
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.6}
        >
          <Text className="text-base font-bold text-[#1a1a1a]">{title}</Text>
          {headerCount > 0 && (
            <Text className="text-sm text-[#888]">({headerCountLabel})</Text>
          )}
          <Text className="text-xs text-[#888] ml-0.5">{expanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {editingId === null && (
          <TouchableOpacity className="bg-[#1a1a1a] px-3 py-1.5 rounded-lg" onPress={handleAddPress}>
            <Text className="text-[13px] font-semibold text-white">+ 추가</Text>
          </TouchableOpacity>
        )}
      </View>

      {expanded && editingId === 'new' && (
        <EntryEditForm
          initialIn={today}
          initialOut={tomorrow}
          saving={saving}
          onCancel={onCancelEdit}
          onSave={(inDate, outDate) => onSave('new', inDate, outDate)}
        />
      )}

      {expanded && entries.length === 0 && editingId === null && (
        <Text className="text-sm text-[#888]">
          {showNickname ? '등록된 일정이 없습니다.' : '아직 일정을 등록하지 않았습니다.'}
        </Text>
      )}

      {expanded && !showNickname && entries.map(renderEntryRow)}

      {expanded && showNickname &&
        groups.map((group) => {
          const userExpanded = expandedUsers.has(group.userId);
          return (
            <View key={group.userId}>
              <TouchableOpacity
                className="flex-row items-center justify-between py-2.5 border-b border-[#eee]"
                onPress={() => toggleUser(group.userId)}
                activeOpacity={0.6}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-[14px] font-semibold text-[#1a1a1a]">
                    {group.nickname}
                  </Text>
                  <Text className="text-[13px] text-[#666]">
                    {group.totalNights}박 · {group.entries.length}건
                  </Text>
                </View>
                <Text className="text-xs text-[#888]">{userExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {userExpanded && (
                <View className="pl-3">{group.entries.map(renderEntryRow)}</View>
              )}
            </View>
          );
        })}
    </Card>
  );
}
