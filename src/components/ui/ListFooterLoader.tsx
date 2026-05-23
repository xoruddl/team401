import { ActivityIndicator, View } from 'react-native';

type Props = {
  visible: boolean;
};

export function ListFooterLoader({ visible }: Props) {
  if (!visible) return null;
  return (
    <View className="py-4 items-center">
      <ActivityIndicator />
    </View>
  );
}
