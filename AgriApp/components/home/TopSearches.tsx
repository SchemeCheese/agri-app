import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TOP_SEARCHES = ['Trai cay sach', 'Rau cu huu co', 'Gia vi', 'Ngu coc', 'Dac san mien Tay'];

type TopSearchesProps = {
  onPressKeyword: (keyword: string) => void;
};

export const TopSearches = ({ onPressKeyword }: TopSearchesProps) => {
  return (
    <View className="mb-4">
      <Text className="px-4 text-xs font-bold uppercase tracking-[2px] text-slate-400 mb-3">
        Tim kiem hang dau
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row gap-2">
          {TOP_SEARCHES.map((keyword) => (
            <TouchableOpacity
              key={keyword}
              onPress={() => onPressKeyword(keyword)}
              className="px-4 py-2.5 rounded-full bg-white border border-slate-200"
            >
              <Text className="text-sm text-slate-600">{keyword}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};