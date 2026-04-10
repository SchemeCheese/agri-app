import { FontAwesome } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

import { AgriLogo } from '@/components/common/AgriLogo';

type HomeHeaderProps = {
  cartCount: number;
  onPressCart: () => void;
  onPressMenu?: () => void;
  inverse?: boolean;
};

export const HomeHeader = ({ cartCount, onPressCart, onPressMenu, inverse = true }: HomeHeaderProps) => {
  return (
    <View className="px-4 py-3 flex-row items-center justify-between">
      <AgriLogo inverse={inverse} compact />

      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className={`p-2 rounded-full ${inverse ? 'bg-white/15' : 'bg-slate-100'}`}
          onPress={onPressCart}
        >
          <FontAwesome name="shopping-basket" size={18} color={inverse ? '#FFFFFF' : '#15803d'} />
          {cartCount > 0 ? (
            <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold">{cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          className={`p-2 rounded-full ${inverse ? 'bg-white/15' : 'bg-slate-100'}`}
          onPress={onPressMenu ?? (() => {})}
        >
          <FontAwesome name="bars" size={20} color={inverse ? '#FFFFFF' : '#0F172A'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
