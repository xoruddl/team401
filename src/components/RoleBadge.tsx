import { Text, View } from 'react-native';
import { Role } from '../types';
import { ROLE_BADGE_CLASS, ROLE_LABEL, ROLE_LABEL_FULL } from '../utils/role';

type Props = {
  role: Role;
  size?: 'sm' | 'md';
  full?: boolean;
};

export function RoleBadge({ role, size = 'sm', full = false }: Props) {
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const label = full ? ROLE_LABEL_FULL[role] : ROLE_LABEL[role];

  return (
    <View className={`self-start rounded-full ${padding} ${ROLE_BADGE_CLASS[role]}`}>
      <Text className={`${text} font-semibold text-white`}>{label}</Text>
    </View>
  );
}
