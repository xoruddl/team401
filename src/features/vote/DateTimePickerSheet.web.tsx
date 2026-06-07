import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

const toDatetimeLocalValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function DateTimePickerSheet({ visible, title, value, onChange, onClose }: Props) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} className="justify-end bg-black/30">
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      <View className="bg-white rounded-t-2xl pb-[34px]">
        <View className="flex-row justify-between items-center px-5 py-3.5 border-b border-[#eee]">
          <Text className="text-base font-semibold text-[#333]">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base text-[#1e88e5] font-semibold">완료</Text>
          </TouchableOpacity>
        </View>
        {React.createElement('input', {
          type: 'datetime-local',
          value: toDatetimeLocalValue(value),
          onChange: (e: any) => {
            if (e.target.value) onChange(new Date(e.target.value));
          },
          style: {
            display: 'block',
            padding: '16px',
            fontSize: '16px',
            width: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'white',
            boxSizing: 'border-box',
          },
        })}
      </View>
    </View>
  );
}
