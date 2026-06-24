import { Text } from 'react-native';

type Props = {
  message: string;
};

export function EmptyState({ message }: Props) {
  return (
    <Text className="text-center text-[#aaa] mt-[60px] text-[15px]">{message}</Text>
  );
}
