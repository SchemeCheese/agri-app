import { Text, TouchableOpacity, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export const SectionHeader = ({ title, actionLabel, onPressAction }: SectionHeaderProps) => {
  return (
    <View className="flex-row items-end justify-between px-4 mb-3">
      <View className="flex-1 pr-3">
        <Text className="text-[18px] font-bold text-slate-900">{title}</Text>
      </View>
      {actionLabel && onPressAction ? (
        <TouchableOpacity onPress={onPressAction}>
          <Text className="text-sm font-semibold text-[#15803D]">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};