import { Text, TouchableOpacity } from 'react-native';

type Props = {
  emoji: string;
  title: string;
  description: string;
  onPress: () => void;
};

export function MenuCard({ emoji, title, description, onPress }: Props) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-6 gap-2 shadow-sm shadow-black/[0.06]"
      onPress={onPress}
    >
      <Text className="text-4xl">{emoji}</Text>
      <Text className="text-xl font-bold text-[#1a1a1a]">{title}</Text>
      <Text className="text-sm text-[#888]">{description}</Text>
    </TouchableOpacity>
  );
}
