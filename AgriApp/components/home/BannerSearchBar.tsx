import { FontAwesome } from '@expo/vector-icons';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type BannerSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPressSearch: () => void;
};

export const BannerSearchBar = ({ value, onChangeText, onPressSearch }: BannerSearchBarProps) => {
  return (
    <View className="px-4">
      <View className="bg-white rounded-full shadow-xl shadow-black/20 border border-white/40 px-2 py-2 flex-row items-center">
        <View className="flex-1 flex-row items-center pl-3 pr-2">
          <FontAwesome name="search" size={16} color="#94A3B8" />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Tim nong san..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-slate-700 text-sm"
          />
        </View>

        <View className="px-4 py-3 rounded-full bg-slate-100 flex-row items-center gap-2">
          <FontAwesome name="filter" size={14} color="#475569" />
          <Text className="text-slate-600 text-sm font-medium">Bo loc</Text>
        </View>

        <TouchableOpacity
          onPress={onPressSearch}
          className="ml-2 w-11 h-11 rounded-full bg-[#16A34A] items-center justify-center"
        >
          <FontAwesome name="search" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};