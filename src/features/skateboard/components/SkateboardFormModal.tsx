import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { FormModal } from '../../../components/FormModal';
import { SkateboardWithActiveRental } from '../../../types';

type Props = {
  visible: boolean;
  editing: SkateboardWithActiveRental | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (params: { number: number; notes: string | null; active: boolean }) => void;
};

export function SkateboardFormModal({
  visible,
  editing,
  submitting,
  onCancel,
  onSubmit,
}: Props) {
  const [number, setNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (visible) {
      setNumber(editing ? String(editing.number) : '');
      setNotes(editing?.notes ?? '');
      setActive(editing?.active ?? true);
    }
  }, [visible, editing]);

  const handleSubmit = () => {
    const n = parseInt(number, 10);
    if (isNaN(n) || n < 1) {
      Alert.alert('오류', '번호는 1 이상의 정수여야 합니다.');
      return;
    }
    onSubmit({ number: n, notes: notes.trim() || null, active });
  };

  return (
    <FormModal
      visible={visible}
      title={editing ? '보드 수정' : '보드 추가'}
      submitLabel={editing ? '수정' : '추가'}
      submitting={submitting}
      submitVariant="dark"
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <FormField
        label="번호"
        value={number}
        onChangeText={setNumber}
        placeholder="예: 1"
        keyboardType="number-pad"
      />
      <FormField
        label="메모 (선택)"
        value={notes}
        onChangeText={setNotes}
        placeholder="예: 빨간색 / 베어링 교체 필요"
      />
      <TouchableOpacity
        className="flex-row items-center gap-3 py-2"
        onPress={() => setActive(!active)}
      >
        <View
          className={`w-6 h-6 rounded-md border-2 items-center justify-center ${active ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-[#ccc]'}`}
        >
          {active && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>
        <Text className="text-sm text-[#333]">사용 가능 (체크 해제 시 대여 차단)</Text>
      </TouchableOpacity>
    </FormModal>
  );
}
