import { ReactNode } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  visible: boolean;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitVariant?: 'primary' | 'dark';
  children: ReactNode;
};

export function FormModal({
  visible,
  title,
  submitLabel,
  submitting = false,
  onCancel,
  onSubmit,
  submitVariant = 'primary',
  children,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text className="text-[22px] font-bold mb-2">{title}</Text>
        {children}
        <View className="flex-row gap-3 mt-2">
          <PrimaryButton
            label="취소"
            variant="secondary"
            onPress={onCancel}
            className="flex-1"
          />
          <PrimaryButton
            label={submitting ? '저장 중...' : submitLabel}
            variant={submitVariant}
            onPress={onSubmit}
            disabled={submitting}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </Modal>
  );
}
