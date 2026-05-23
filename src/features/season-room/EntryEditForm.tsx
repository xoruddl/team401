import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatYmd } from '../../utils/date';

const dateRowClass =
  'flex-row justify-between items-center py-3 border-b border-[#f0f0f0]';

type Props = {
  initialIn: Date;
  initialOut: Date;
  saving: boolean;
  minimumDate?: Date;
  inLocked?: boolean;
  onCancel: () => void;
  onSave: (inDate: Date, outDate: Date) => void;
};

export function EntryEditForm({
  initialIn,
  initialOut,
  saving,
  minimumDate,
  inLocked = false,
  onCancel,
  onSave,
}: Props) {
  const [editIn, setEditIn] = useState(initialIn);
  const [editOut, setEditOut] = useState(initialOut);
  const [showInPicker, setShowInPicker] = useState(false);
  const [showOutPicker, setShowOutPicker] = useState(false);

  return (
    <View className="gap-3">
      <TouchableOpacity
        className={dateRowClass}
        onPress={() => setShowInPicker(true)}
        disabled={inLocked}
      >
        <Text className="text-[15px] text-[#555]">인 날짜</Text>
        <View className="flex-row items-center gap-1.5">
          <Text
            className={`text-[15px] font-semibold ${inLocked ? 'text-[#999]' : 'text-[#1a1a1a]'}`}
          >
            {formatYmd(editIn)}
          </Text>
          {inLocked && <Text className="text-[11px] text-[#999]">잠김</Text>}
        </View>
      </TouchableOpacity>
      {showInPicker && !inLocked && (
        <DateTimePicker
          value={editIn}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          onChange={(_, d) => {
            setShowInPicker(false);
            if (d) setEditIn(d);
          }}
        />
      )}
      <TouchableOpacity className={dateRowClass} onPress={() => setShowOutPicker(true)}>
        <Text className="text-[15px] text-[#555]">아웃 날짜</Text>
        <Text className="text-[15px] font-semibold text-[#1a1a1a]">{formatYmd(editOut)}</Text>
      </TouchableOpacity>
      {showOutPicker && (
        <DateTimePicker
          value={editOut}
          mode="date"
          display="spinner"
          minimumDate={editIn}
          onChange={(_, d) => {
            setShowOutPicker(false);
            if (d) setEditOut(d);
          }}
        />
      )}
      <View className="flex-row gap-2 mt-1">
        <TouchableOpacity
          className="flex-1 py-3 rounded-[10px] items-center bg-[#f0f0f0]"
          onPress={onCancel}
        >
          <Text className="text-[15px] text-[#555]">취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 rounded-[10px] items-center bg-[#1a1a1a]"
          onPress={() => onSave(editIn, editOut)}
          disabled={saving}
        >
          <Text className="text-[15px] font-semibold text-white">
            {saving ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
