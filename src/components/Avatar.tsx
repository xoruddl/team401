import { Image, Text, View } from 'react-native';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<Size, { wrapper: string; emoji: string }> = {
  sm: { wrapper: 'w-6 h-6', emoji: 'text-[10px]' },
  md: { wrapper: 'w-8 h-8', emoji: 'text-sm' },
  lg: { wrapper: 'w-12 h-12', emoji: 'text-xl' },
  xl: { wrapper: 'w-20 h-20', emoji: 'text-3xl' },
};

type Props = {
  uri?: string | null;
  size?: Size;
};

export function Avatar({ uri, size = 'md' }: Props) {
  const { wrapper, emoji } = SIZE_MAP[size];
  if (uri) {
    return <Image source={{ uri }} className={`${wrapper} rounded-full`} />;
  }
  return (
    <View className={`${wrapper} rounded-full bg-[#eee] items-center justify-center`}>
      <Text className={emoji}>👤</Text>
    </View>
  );
}
