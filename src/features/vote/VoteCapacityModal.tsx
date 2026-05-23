import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { VoteWithEntries } from './useVotes';

type Props = {
  vote: VoteWithEntries | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (capacity: number) => void;
};

const inputClass = 'border border-[#ddd] rounded-lg p-3 text-[15px] bg-white';

export function VoteCapacityModal({ vote, submitting, onCancel, onSubmit }: Props) {
  const [capacityStr, setCapacityStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vote) {
      setCapacityStr(String(vote.capacity));
      setError(null);
    }
  }, [vote]);

  const totalEntries = vote?.vote_entries.length ?? 0;

  const currentConfirmed = useMemo(
    () => vote?.vote_entries.filter((e) => e.status === 'confirmed').length ?? 0,
    [vote],
  );
  const currentWaiting = totalEntries - currentConfirmed;

  const parsed = parseInt(capacityStr, 10);
  const isValid = !isNaN(parsed) && parsed >= 1;

  const nextConfirmed = isValid ? Math.min(parsed, totalEntries) : 0;
  const nextWaiting = isValid ? Math.max(0, totalEntries - parsed) : 0;

  const promoted = Math.max(0, nextConfirmed - currentConfirmed); // 대기 → 확정
  const demoted = Math.max(0, currentConfirmed - nextConfirmed); // 확정 → 대기
  const noChange = isValid && parsed === vote?.capacity;

  const handleSubmit = () => {
    if (!isValid) {
      setError('1 이상의 숫자를 입력하세요.');
      return;
    }
    if (noChange) {
      onCancel();
      return;
    }
    onSubmit(parsed);
  };

  return (
    <Modal visible={!!vote} animationType="slide" presentationStyle="pageSheet">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text className="text-[22px] font-bold">정원 수정</Text>
        {vote && (
          <Text className="text-sm text-[#666]">
            {vote.title}
          </Text>
        )}

        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-[#333]">새 정원</Text>
          <TextInput
            className={inputClass}
            value={capacityStr}
            onChangeText={(v) => {
              setCapacityStr(v);
              setError(null);
            }}
            placeholder="명"
            keyboardType="number-pad"
          />
          {error && <Text className="text-xs text-[#e53935]">{error}</Text>}
        </View>

        <View className="bg-[#f5f5f5] rounded-lg p-4 gap-2">
          <Text className="text-sm font-semibold text-[#333]">변경 결과</Text>
          <View className="flex-row justify-between">
            <Text className="text-sm text-[#666]">현재</Text>
            <Text className="text-sm text-[#1a1a1a]">
              확정 {currentConfirmed}명 / 대기 {currentWaiting}명
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-[#666]">변경 후</Text>
            <Text className="text-sm font-semibold text-[#1a1a1a]">
              확정 {nextConfirmed}명 / 대기 {nextWaiting}명
            </Text>
          </View>

          {promoted > 0 && (
            <Text className="text-[13px] text-[#2e7d32] mt-1">
              대기 → 확정: {promoted}명 승격
            </Text>
          )}
          {demoted > 0 && (
            <Text className="text-[13px] text-[#e53935] mt-1">
              확정 → 대기: {demoted}명 강등 (주의!)
            </Text>
          )}
          {noChange && (
            <Text className="text-[13px] text-[#888] mt-1">변경 사항 없음</Text>
          )}
        </View>

        <View className="flex-row gap-3 mt-2">
          <PrimaryButton
            label="취소"
            variant="secondary"
            onPress={onCancel}
            className="flex-1"
          />
          <PrimaryButton
            label={submitting ? '저장 중...' : demoted > 0 ? '강등하고 변경' : '변경'}
            variant={demoted > 0 ? 'danger' : 'primary'}
            onPress={handleSubmit}
            disabled={submitting || !isValid}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </Modal>
  );
}
