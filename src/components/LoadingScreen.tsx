import { ActivityIndicator, View } from 'react-native';

type Props = {
  size?: 'small' | 'large';
  background?: boolean;
};

export function LoadingScreen({ size = 'large', background = true }: Props) {
  return (
    <View
      className={`flex-1 items-center justify-center ${background ? 'bg-[#f5f5f5]' : ''}`}
    >
      <ActivityIndicator size={size} />
    </View>
  );
}
