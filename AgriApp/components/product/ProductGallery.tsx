import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';

import { resolveImageUrl } from '@/utils/image';

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export const ProductGallery = ({ images, name }: ProductGalleryProps) => {
  const normalizedImages = useMemo(
    () => (images.length > 0 ? images : ['https://via.placeholder.com/800x800?text=Agri']),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedImages]);

  return (
    <View>
      <Image source={{ uri: resolveImageUrl(normalizedImages[activeIndex]) }} className="w-full h-80 rounded-[28px]" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
        <View className="flex-row gap-2 px-0">
          {normalizedImages.map((image, index) => (
            <TouchableOpacity
              key={`${name}-${index}`}
              onPress={() => setActiveIndex(index)}
              className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${
                activeIndex === index ? 'border-[#15803D]' : 'border-transparent'
              }`}
            >
              <Image source={{ uri: resolveImageUrl(image) }} className="w-full h-full" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};