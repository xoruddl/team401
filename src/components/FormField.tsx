import { Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
};

export function FormField({ label, multiline, className, ...inputProps }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-[#333]">{label}</Text>
      <TextInput
        className={`border border-[#ddd] rounded-lg p-3 text-[15px] bg-white ${multiline ? 'h-48' : ''} ${className ?? ''}`}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        {...inputProps}
      />
    </View>
  );
}
