import { PropsWithChildren } from 'react';
import { View } from 'react-native';

type ScreenContainerProps = PropsWithChildren<{
  className?: string;
}>;

export const ScreenContainer = ({ children, className }: ScreenContainerProps) => {
  return <View className={`flex-1 bg-[#F8FAFC] ${className ?? ''}`}>{children}</View>;
};
