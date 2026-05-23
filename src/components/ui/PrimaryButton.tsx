import { Text, TouchableOpacity } from 'react-native';

type Variant = 'primary' | 'dark' | 'secondary' | 'danger';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-[#1e88e5]',
  dark: 'bg-[#1a1a1a]',
  secondary: 'bg-[#e0e0e0]',
  danger: 'bg-[#e53935]',
};

const TEXT_CLASS: Record<Variant, string> = {
  primary: 'text-white',
  dark: 'text-white',
  secondary: 'text-[#1a1a1a]',
  danger: 'text-white',
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
}: Props) {
  return (
    <TouchableOpacity
      className={`p-3.5 rounded-[10px] items-center ${VARIANT_CLASS[variant]} ${disabled ? 'opacity-60' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`text-[15px] font-semibold ${TEXT_CLASS[variant]}`}>{label}</Text>
    </TouchableOpacity>
  );
}
