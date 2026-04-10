import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <View className="items-center justify-center py-10 px-6">
      <Text className="text-base font-semibold text-gray-700">{title}</Text>
      {description ? <Text className="text-sm text-gray-500 mt-2 text-center">{description}</Text> : null}
    </View>
  );
};
