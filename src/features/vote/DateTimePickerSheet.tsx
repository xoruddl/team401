import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  visible: boolean;
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

export function DateTimePickerSheet({ visible, title, value, onChange, onClose }: Props) {
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');
  const [androidTempDate, setAndroidTempDate] = useState(value);

  if (!visible) return null;

  const handleChange = (_: unknown, date?: Date) => {
    if (!date) {
      onClose();
      return;
    }
    if (Platform.OS === 'android') {
      if (androidStep === 'date') {
        setAndroidTempDate(date);
        setAndroidStep('time');
      } else {
        const combined = new Date(androidTempDate);
        combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
        onChange(combined);
        setAndroidStep('date');
        onClose();
      }
    } else {
      onChange(date);
    }
  };

  return (
    <View className="absolute inset-0 justify-end bg-black/30">
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={onClose}
        activeOpacity={1}
      />
      <View className="bg-white rounded-t-2xl pb-[34px]">
        <View className="flex-row justify-between items-center px-5 py-3.5 border-b border-[#eee]">
          <Text className="text-base font-semibold text-[#333]">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base text-[#1e88e5] font-semibold">완료</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={value}
          mode={Platform.OS === 'android' ? androidStep : 'datetime'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          style={Platform.OS === 'ios' ? { backgroundColor: 'white' } : undefined}
        />
      </View>
    </View>
  );
}
