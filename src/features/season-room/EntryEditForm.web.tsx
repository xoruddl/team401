import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatYmd } from '../../utils/date';

const dateRowClass = 'flex-row justify-between items-center py-3 border-b border-[#f0f0f0]';

type Props = {
  initialIn: Date;
  initialOut: Date;
  saving: boolean;
  onCancel: () => void;
  onSave: (inDate: Date, outDate: Date) => void;
};

const toDateValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fromDateValue = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const webDateInputStyle = {
  fontSize: 15,
  fontWeight: '600' as const,
  color: '#1a1a1a',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  backgroundColor: 'transparent',
};

export function EntryEditForm({
  initialIn,
  initialOut,
  saving,
  onCancel,
  onSave,
}: Props) {
  const [editIn, setEditIn] = useState(initialIn);
  const [editOut, setEditOut] = useState(initialOut);

  return (
    <View className="gap-3">
      <View className={dateRowClass}>
        <Text className="text-[15px] text-[#555]">인 날짜</Text>
        {React.createElement('input', {
          type: 'date',
          value: toDateValue(editIn),
          onChange: (e: any) => {
            if (e.target.value) {
              const newIn = fromDateValue(e.target.value);
              setEditIn(newIn);
              if (e.target.value >= toDateValue(editOut)) {
                const nextDay = new Date(newIn);
                nextDay.setDate(nextDay.getDate() + 1);
                setEditOut(nextDay);
              }
            }
          },
          style: webDateInputStyle,
        })}
      </View>
      <View className={dateRowClass}>
        <Text className="text-[15px] text-[#555]">아웃 날짜</Text>
        {React.createElement('input', {
          type: 'date',
          value: toDateValue(editOut),
          min: toDateValue(editIn),
          onChange: (e: any) => {
            if (e.target.value) setEditOut(fromDateValue(e.target.value));
          },
          style: webDateInputStyle,
        })}
      </View>
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
