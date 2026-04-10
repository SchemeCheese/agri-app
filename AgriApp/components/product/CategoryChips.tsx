import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { CategorySummary } from '@/api/product';

type CategoryChipsProps = {
  categories: CategorySummary[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export const CategoryChips = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryChipsProps) => {
  const merged = [{ id: 'all', name: 'Tất cả', count: 0 }, ...categories];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
      <View className="flex-row gap-2">
        {merged.map((item) => {
          const active = selectedCategory === item.name;

          return (
            <TouchableOpacity
              key={item.id}
              className={`px-4 py-2.5 rounded-full border ${active ? 'bg-[#15803D] border-[#15803D]' : 'bg-white border-slate-200'}`}
              onPress={() => onSelectCategory(item.name)}
            >
              <Text className={`text-sm ${active ? 'text-white font-semibold' : 'text-slate-600'}`}>
                {item.name}
                {item.count > 0 ? ` (${item.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};
