import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { formatMonthDayTime } from '../../../utils/date';
import { VOTE_CATEGORY_LABEL, VoteCategory } from '../../../types';
import { DateTimePickerSheet } from './DateTimePickerSheet';

type Props = {
  visible: boolean;
  creating: boolean;
  onCancel: () => void;
  onSubmit: (params: {
    title: string;
    description: string | null;
    capacity: number;
    category: VoteCategory;
    opensAt: Date;
    closesAt: Date | null;
  }) => void;
};

const inputClass = 'border border-[#ddd] rounded-lg p-3 text-[15px] bg-white';

const CATEGORIES: VoteCategory[] = ['riding', 'mt', 'etc'];

export function VoteCreateModal({ visible, creating, onCancel, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState<VoteCategory>('riding');
  const [opensAt, setOpensAt] = useState(new Date());
  const [closesAt, setClosesAt] = useState<Date | null>(null);

  const [pickerField, setPickerField] = useState<'opens' | 'closes' | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setCapacity('');
    setCategory('riding');
    setOpensAt(new Date());
    setClosesAt(null);
    setPickerField(null);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSubmit = () => {
    if (!title.trim()) return Alert.alert('오류', '제목을 입력하세요.');
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1) return Alert.alert('오류', '인원은 1명 이상이어야 합니다.');
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      capacity: cap,
      category,
      opensAt,
      closesAt,
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
          <Text className="text-[22px] font-bold mb-2">투표 만들기</Text>

          <Text className="text-sm font-semibold text-[#333]">카테고리</Text>
          <View className="flex-row gap-2">
            {CATEGORIES.map((c) => {
              const selected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  className={`flex-1 py-3 rounded-lg items-center border ${
                    selected ? 'bg-[#1e88e5] border-[#1e88e5]' : 'bg-white border-[#ddd]'
                  }`}
                  onPress={() => setCategory(c)}
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      selected ? 'text-white' : 'text-[#555]'
                    }`}
                  >
                    {VOTE_CATEGORY_LABEL[c]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-sm font-semibold text-[#333]">제목</Text>
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={setTitle}
            placeholder="투표 제목"
          />

          <Text className="text-sm font-semibold text-[#333]">설명 (선택)</Text>
          <TextInput
            className={`${inputClass} h-20`}
            value={description}
            onChangeText={setDescription}
            placeholder="활동 설명"
            multiline
          />

          <Text className="text-sm font-semibold text-[#333]">모집 인원</Text>
          <TextInput
            className={inputClass}
            value={capacity}
            onChangeText={setCapacity}
            placeholder="명"
            keyboardType="number-pad"
          />

          <Text className="text-sm font-semibold text-[#333]">오픈 시간</Text>
          <TouchableOpacity
            className={`border rounded-lg p-3 bg-white ${pickerField === 'opens' ? 'border-[#1e88e5]' : 'border-[#ddd]'}`}
            onPress={() => setPickerField('opens')}
          >
            <Text className="text-[15px] text-[#333]">{formatMonthDayTime(opensAt)}</Text>
          </TouchableOpacity>

          <Text className="text-sm font-semibold text-[#333]">종료 시간 (선택)</Text>
          {closesAt ? (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className={`flex-1 border rounded-lg p-3 bg-white ${pickerField === 'closes' ? 'border-[#1e88e5]' : 'border-[#ddd]'}`}
                onPress={() => setPickerField('closes')}
              >
                <Text className="text-[15px] text-[#333]">{formatMonthDayTime(closesAt)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setClosesAt(null);
                  setPickerField(null);
                }}
              >
                <Text className="text-[#e53935] text-[13px]">제거</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="border border-dashed border-[#1e88e5] rounded-lg p-3 items-center"
              onPress={() => {
                const d = new Date(opensAt);
                d.setHours(d.getHours() + 2);
                setClosesAt(d);
              }}
            >
              <Text className="text-[#1e88e5] text-sm font-semibold">+ 종료 시간 설정</Text>
            </TouchableOpacity>
          )}

          <View className="flex-row gap-3 mt-2">
            <PrimaryButton
              label="취소"
              variant="secondary"
              onPress={handleCancel}
              className="flex-1"
            />
            <PrimaryButton
              label={creating ? '생성 중...' : '만들기'}
              variant="primary"
              onPress={handleSubmit}
              disabled={creating}
              className="flex-1"
            />
          </View>
        </ScrollView>

        <DateTimePickerSheet
          visible={pickerField !== null}
          title={pickerField === 'opens' ? '오픈 시간' : '종료 시간'}
          value={pickerField === 'opens' ? opensAt : closesAt ?? new Date()}
          onChange={(date) => {
            if (pickerField === 'opens') setOpensAt(date);
            else setClosesAt(date);
          }}
          onClose={() => setPickerField(null)}
        />
      </View>
    </Modal>
  );
}
