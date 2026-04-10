import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';

import { BannerSearchBar } from './BannerSearchBar';
import { HomeHeader } from './HomeHeader';

type HomeHeroProps = {
  cartCount: number;
  onPressCart: () => void;
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onPressExplore: () => void;
  onPressSearch: () => void;
};

export const HomeHero = ({
  cartCount,
  onPressCart,
  keyword,
  onChangeKeyword,
  onPressExplore,
  onPressSearch,
}: HomeHeroProps) => {
  return (
    <View className="px-4 mb-5">
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop' }}
        className="rounded-[32px] overflow-hidden"
        imageStyle={{ borderRadius: 32 }}
      >
        <View className="bg-black/35 min-h-[360px] pb-5">
          <HomeHeader cartCount={cartCount} onPressCart={onPressCart} onPressMenu={onPressSearch} inverse />

          <View className="flex-1 justify-end px-5 pb-5">
            <View className="bg-white/15 self-start px-3 py-1.5 rounded-full border border-white/20">
              <Text className="text-white text-xs font-semibold tracking-wide">Nong san tuoi moi ngay</Text>
            </View>

            <Text className="text-white text-4xl font-extrabold leading-tight mt-4">
              Thu mua nong san sach{`\n`}cho moi gia dinh
            </Text>

            <Text className="text-white/85 mt-3 text-sm leading-5 max-w-[280px]">
              Tim nhanh san pham tuoi, xem gia, them vao gio va dat hang ngay trong app.
            </Text>

            <TouchableOpacity
              onPress={onPressExplore}
              className="mt-5 self-start bg-[#16A34A] px-4 py-3 rounded-2xl"
            >
              <Text className="text-white font-semibold">Kham pha ngay</Text>
            </TouchableOpacity>
          </View>

          <View className="pb-4">
            <BannerSearchBar
              value={keyword}
              onChangeText={onChangeKeyword}
              onPressSearch={onPressSearch}
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};