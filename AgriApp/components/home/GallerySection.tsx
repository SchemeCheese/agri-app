import { Image, ScrollView, Text, View } from 'react-native';

const galleryImages = [
  'https://images.unsplash.com/photo-1609412058473-c199497c3c5d?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1734313237467-1f93eb3abbe0?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1727099079513-952d40de9d78?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1621955050136-8e1cd6ed72e9?q=80&w=1400&auto=format&fit=crop',
];

export const GallerySection = () => {
  return (
    <View className="mb-5">
      <Text className="px-4 text-xs font-bold uppercase tracking-[2px] text-slate-400 mb-3">
        Thu vien anh
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row gap-3">
          {galleryImages.map((image, index) => (
            <View key={index} className="w-40 h-52 rounded-[28px] overflow-hidden">
              <Image source={{ uri: image }} className="w-full h-full" />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};