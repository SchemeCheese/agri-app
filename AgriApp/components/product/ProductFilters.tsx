import { FontAwesome } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { Text, TouchableOpacity, View } from 'react-native';

type ProductFiltersProps = {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  onChangePriceRange: (range: [number, number]) => void;
  origins: string[];
  selectedOrigins: string[];
  onToggleOrigin: (origin: string) => void;
  onClearAll: () => void;
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const ProductFilters = ({
  minPrice,
  maxPrice,
  priceRange,
  onChangePriceRange,
  origins,
  selectedOrigins,
  onToggleOrigin,
  onClearAll,
}: ProductFiltersProps) => {
  const handleSliderChange = (value: number | number[]) => {
    if (!Array.isArray(value) || value.length < 2) return;

    const nextMin = Math.min(Math.round(value[0]), Math.round(value[1]));
    const nextMax = Math.max(Math.round(value[0]), Math.round(value[1]));
    onChangePriceRange([nextMin, nextMax]);
  };

  return (
    <View className="px-4 mt-4 mb-2">
      <View className="bg-white border border-slate-200 rounded-[24px] p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-slate-900">Bộ lọc</Text>
          <TouchableOpacity onPress={onClearAll}>
            <Text className="text-red-500 font-medium">Xóa tất cả</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-medium text-slate-800">Khoảng giá</Text>
            <Text className="text-green-600 font-bold">
              {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
            </Text>
          </View>

          <Slider
            value={priceRange}
            onValueChange={handleSliderChange}
            minimumValue={minPrice}
            maximumValue={maxPrice}
            step={10000}
            minimumTrackTintColor="#16A34A"
            maximumTrackTintColor="#D1D5DB"
            containerStyle={{ paddingHorizontal: 6 }}
            trackStyle={{ height: 6, borderRadius: 999 }}
            thumbStyle={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: 2,
              borderColor: '#16A34A',
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>

        <View className="h-px bg-slate-200 mb-5" />

        <View>
          <Text className="text-lg font-medium text-slate-800 mb-3">Nguồn gốc</Text>
          <View className="gap-3">
            {origins.map((origin) => {
              const active = selectedOrigins.includes(origin);

              return (
                <TouchableOpacity
                  key={origin}
                  className="flex-row items-center"
                  activeOpacity={0.85}
                  onPress={() => onToggleOrigin(origin)}
                >
                  <View className="w-5 h-5 items-center justify-center mr-3">
                    {active ? (
                      <FontAwesome name="check-square-o" size={20} color="#16A34A" />
                    ) : (
                      <FontAwesome name="square-o" size={20} color="#6B7280" />
                    )}
                  </View>
                  <Text className="text-base text-slate-700">{origin}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};
