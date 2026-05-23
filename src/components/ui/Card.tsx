import { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  className?: string;
  children: ReactNode;
};

export function Card({ className = '', children }: Props) {
  return (
    <View
      className={`bg-white rounded-2xl p-5 gap-3 shadow-sm shadow-black/[0.06] ${className}`}
    >
      {children}
    </View>
  );
}
