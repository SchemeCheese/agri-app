import { ActivityIndicator, View } from 'react-native';

export const LoadingState = () => {
  return (
    <View className="py-10">
      <ActivityIndicator color="#15803d" />
    </View>
  );
};
